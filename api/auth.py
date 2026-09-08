"""Sign-in, and the gate that decides whether a request may spend money.

Three things live here, and the boundary between them matters:

- **Configuration**, read once at import. Railway restarts a service when a
  variable changes, so import-time is the right time; this mirrors how
  ALLOWED_ORIGINS and CALLBACK_TOKEN are already read in `main.py`.
- **HTTP glue** - pulling an identity out of headers, turning a refusal into an
  HTTPException. Impure by nature, thin on purpose.
- **Nothing else.** Every actual rule is in `answergap/gate.py`, which is pure
  and fully tested without a database.

FAILS CLOSED, EXCEPT WHERE THAT WOULD BREAK THE LAPTOP
-------------------------------------------------------
`ADMIN_EMAILS` unset means nobody is an admin, full stop - the same shape as the
CALLBACK_TOKEN check that already guards the DataForSEO postback.

But `SESSION_SECRET` unset means accounts are *switched off* and the product
behaves exactly as it did before this feature existed. That is deliberate and it
is not a weaker rule: local development has no Postgres, and a gate that refused
everything without a database would make the laptop the one place the product is
broken. Nothing is protected when accounts are off because there is nothing to
protect - no accounts exist.
"""

from __future__ import annotations

import hashlib
import os
import secrets
import time

from fastapi import APIRouter, HTTPException, Request
from fastapi.responses import JSONResponse, RedirectResponse

from answergap import db, gate, oauth, tokens

router = APIRouter()

# --------------------------------------------------------------- configuration

SESSION_SECRET = os.environ.get("SESSION_SECRET", "")
GOOGLE_CLIENT_ID = os.environ.get("GOOGLE_CLIENT_ID", "")
GOOGLE_CLIENT_SECRET = os.environ.get("GOOGLE_CLIENT_SECRET", "")

# Comma-separated, lowercased, exact-match. There is no role column anywhere in
# the schema, so this variable is the ONLY way to become an admin - which makes
# privilege escalation structurally impossible rather than merely forbidden.
ADMIN_EMAILS = gate.parse_admin_emails(os.environ.get("ADMIN_EMAILS", ""))

# Where a completed sign-in may return to. Exact origins, never prefixes.
AUTH_RETURN_ORIGINS = oauth.parse_origins(
    os.environ.get(
        "AUTH_RETURN_ORIGINS", "http://localhost:3000,http://localhost:3100"
    )
)

# Already used to build the DataForSEO postback URL. It now also builds the
# OAuth redirect_uri, which widens what an unset value costs: without it, batch
# scoring falls back to polling AND sign-in cannot work at all.
PUBLIC_BASE_URL = os.environ.get("PUBLIC_BASE_URL", "").rstrip("/")

# Derived rather than required. A missing salt must not disable rate limiting -
# the raw address is never stored either way.
ANON_IP_SALT = (
    os.environ.get("ANON_IP_SALT", "").encode()
    or hashlib.sha256((SESSION_SECRET + "anon-ip").encode()).digest()
)

ANON_HEADER = "x-ag-anon"


def accounts_enabled() -> bool:
    """Are accounts configured at all?

    Requires the secret, the Google client, a public URL to come back to, AND a
    database - an account that cannot be stored is not an account.
    """
    return bool(
        SESSION_SECRET
        and GOOGLE_CLIENT_ID
        and GOOGLE_CLIENT_SECRET
        and PUBLIC_BASE_URL
        and db.available()
    )


def redirect_uri() -> str:
    return f"{PUBLIC_BASE_URL}/api/auth/google/callback"


# ------------------------------------------------------------------- identity


def identity(request: Request) -> gate.Identity:
    """Who is asking, from headers alone. NO database query.

    This is called on `/api/meta`, which is Railway's healthcheck path. Putting
    a SELECT here would cost ~150 ms on every page load in the good case and a
    restart loop in the bad one, so `is_admin` is derived from the token's own
    email claim rather than from the row.

    That is a real boundary and it is safe: a revoked admin token still reports
    role "admin" to the UI until it expires, but it can DO nothing - every admin
    endpoint loads the row and re-checks the epoch and the status.
    """
    anon_id = (request.headers.get(ANON_HEADER) or "").strip()[:64] or None
    ip_hash = gate.anon_ip_hash(request.headers.get("x-forwarded-for"), ANON_IP_SALT)

    header = request.headers.get("authorization") or ""
    token = header[7:].strip() if header.lower().startswith("bearer ") else ""
    payload = tokens.verify(token, SESSION_SECRET, now=int(time.time())) if token else None
    if not payload:
        return gate.Identity(anon_id=anon_id, ip_hash=ip_hash)

    email = gate.normalize_email(payload.get("em"))
    return gate.Identity(
        user_id=payload.get("uid"),
        email=email,
        is_admin=gate.is_admin(email, ADMIN_EMAILS),
        anon_id=anon_id,
        ip_hash=ip_hash,
        token_epoch=payload.get("ep"),
    )


def role_of(who: gate.Identity) -> str:
    if who.is_admin:
        return "admin"
    return "user" if who.signed_in else "anonymous"


# ----------------------------------------------------------------- the gate


def check(who: gate.Identity, *, action: str, units: int) -> gate.Decision:
    """Gather the state in ONE query, then ask the pure decider.

    Raises HTTPException on a refusal, having first recorded it - "how often do
    we turn people away, and why" is a product question that cannot be answered
    later from rows that were never written.
    """
    if not accounts_enabled():
        return gate.decide(who, gate.State(accounts_enabled=False), action=action, units=units)

    if who.signed_in:
        row = db.user_for_gate(who.user_id) or {}
        # A token whose epoch is behind the row was revoked. Treat it as signed
        # out rather than as a stale-but-valid session.
        if not row or row.get("token_epoch") != who.token_epoch:
            raise _refuse(who, action, gate.REFUSED_SIGNED_OUT, 401, "signedOut")
        state = gate.State(
            accounts_enabled=True,
            status=row.get("status"),
            balance=int(row.get("balance") or 0),
        )
    else:
        counters = db.anon_counters(anon_id=who.anon_id, ip_hash=who.ip_hash)
        state = gate.State(
            accounts_enabled=True,
            anon_limit=gate.setting_int(
                {gate.SETTING_ANON_DAILY: counters["anon_limit"]},
                gate.SETTING_ANON_DAILY,
                default=gate.DEFAULT_ANON_DAILY,
                lo=0,
                hi=100,
            ),
            anon_used_browser=counters["by_browser"],
            anon_used_ip=counters["by_ip"],
        )

    decision = gate.decide(who, state, action=action, units=units)
    if not decision.allowed:
        raise _refuse(who, action, decision.outcome, decision.http_status, decision.code)
    return decision


def record(
    who: gate.Identity,
    *,
    action: str,
    billable_calls: int,
    spend: float,
    tree_slug: str | None = None,
    question_slug: str | None = None,
) -> None:
    """Write down what was actually bought. Charges only for real requests."""
    if not accounts_enabled():
        return
    credits = gate.credits_for(billable_calls)
    try:
        db.record_usage(
            user_id=who.user_id,
            ip_hash=who.ip_hash,
            anon_id=who.anon_id,
            action=action,
            outcome=gate.ALLOWED,
            credits=credits,
            spend_usd=float(spend or 0.0),
            tree_slug=tree_slug,
            question_slug=question_slug,
            is_admin=who.is_admin,
        )
    except Exception:  # noqa: BLE001
        # The money is already spent upstream. Losing the receipt is bad; losing
        # the user's result on top of it is worse, and node-level fault
        # tolerance is a standing rule in CLAUDE.md.
        pass


def _refuse(
    who: gate.Identity, action: str, outcome: str, status: int | None, code: str | None
) -> HTTPException:
    if accounts_enabled():
        try:
            db.record_usage(
                user_id=who.user_id,
                ip_hash=who.ip_hash,
                anon_id=who.anon_id,
                action=action,
                outcome=outcome,
                credits=0,
                spend_usd=0.0,
                is_admin=who.is_admin,
            )
        except Exception:  # noqa: BLE001
            pass
    # A dict detail, not a sentence. The API returns codes and the UI renders
    # words - see the module docstring in main.py. Without a code the frontend
    # could not tell "out of credits" from the DataForSEO ceiling, which already
    # owns 429.
    return HTTPException(status or 403, {"code": code or "forbidden"})


def require_admin(request: Request) -> gate.Identity:
    """The admin gate. Loads the row, unlike `identity`.

    Four things must hold: accounts are on, the token is valid, the row still
    matches the token's epoch and is active, and the address is in ADMIN_EMAILS.
    An empty ADMIN_EMAILS refuses everyone.
    """
    if not accounts_enabled():
        raise HTTPException(503, {"code": "accountsOff"})
    who = identity(request)
    if not who.signed_in:
        raise HTTPException(401, {"code": "signedOut"})
    if not gate.is_admin(who.email, ADMIN_EMAILS):
        raise HTTPException(403, {"code": "notAdmin"})
    row = db.user_for_gate(who.user_id) or {}
    if not row or row.get("token_epoch") != who.token_epoch:
        raise HTTPException(401, {"code": "signedOut"})
    if row.get("status") != gate.STATUS_ACTIVE:
        raise HTTPException(403, {"code": "suspended"})
    # Re-check against the CURRENT address on the row, not the one baked into
    # the token: an address that changed at Google must not keep an old claim.
    if not gate.is_admin(row.get("email"), ADMIN_EMAILS):
        raise HTTPException(403, {"code": "notAdmin"})
    return who


# --------------------------------------------------------------- the endpoints
#
# Declared `def`, not `async def`, and that is load-bearing. FastAPI runs a
# plain `def` handler in a threadpool; an `async def` calling urllib would block
# the event loop for the whole Google round trip and stall every concurrent
# request. Only shows up under load, which is the worst time to find it.


@router.get("/api/auth/google/start")
def google_start(return_to: str = "", mode: str = "token") -> RedirectResponse:
    """Send the browser to Google.

    `mode=token` hands the session back in a URL fragment (the customer web).
    `mode=code` hands back a one-time code instead (the admin service), because
    a server-side route handler cannot read a fragment and a query parameter
    would land in Railway's access log.
    """
    if not accounts_enabled():
        raise HTTPException(503, {"code": "accountsOff"})
    if not oauth.return_allowed(return_to, AUTH_RETURN_ORIGINS):
        # Logged, not returned. The reply stays a bare code - echoing the
        # allowlist back would hand an attacker the list of places a session
        # can be sent - but "which value was rejected" is the only thing
        # anyone needs to fix this, and without it the failure is a 400 with
        # no way in. It has already cost one debugging round trip.
        #
        # The usual cause is a missing scheme: Railway's Networking panel
        # shows a domain WITHOUT https://, so a copy-paste drops it and
        # urlsplit then finds no netloc at all.
        print(
            f"[auth] rejected return_to={return_to!r}; "
            f"AUTH_RETURN_ORIGINS={sorted(AUTH_RETURN_ORIGINS)}",
            flush=True,
        )
        raise HTTPException(400, {"code": "badReturn"})

    verifier = oauth.new_verifier()
    state = oauth.make_state(
        return_to=return_to,
        verifier=verifier,
        secret=SESSION_SECRET,
        now=int(time.time()),
        mode=mode if mode in ("token", "code") else "token",
    )
    return RedirectResponse(
        oauth.authorize_url(
            client_id=GOOGLE_CLIENT_ID,
            redirect_uri=redirect_uri(),
            state=state,
            code_challenge=oauth.pkce_challenge(verifier),
        ),
        status_code=302,
    )


@router.get("/api/auth/google/callback")
def google_callback(
    code: str = "", state: str = "", error: str = ""
) -> RedirectResponse:
    """Google is done. Turn the code into an account and go home."""
    if not accounts_enabled():
        raise HTTPException(503, {"code": "accountsOff"})

    now = int(time.time())
    payload = oauth.read_state(state, SESSION_SECRET, now=now)
    if not payload:
        raise HTTPException(400, {"code": "badState"})
    return_to = payload["rt"]
    # Re-checked after the round trip. The state is signed, but the allowlist
    # may have changed while the user sat on the consent screen, and this is the
    # last point at which a session could be sent somewhere it should not go.
    if not oauth.return_allowed(return_to, AUTH_RETURN_ORIGINS):
        # Logged, not returned. The reply stays a bare code - echoing the
        # allowlist back would hand an attacker the list of places a session
        # can be sent - but "which value was rejected" is the only thing
        # anyone needs to fix this, and without it the failure is a 400 with
        # no way in. It has already cost one debugging round trip.
        #
        # The usual cause is a missing scheme: Railway's Networking panel
        # shows a domain WITHOUT https://, so a copy-paste drops it and
        # urlsplit then finds no netloc at all.
        print(
            f"[auth] rejected return_to={return_to!r}; "
            f"AUTH_RETURN_ORIGINS={sorted(AUTH_RETURN_ORIGINS)}",
            flush=True,
        )
        raise HTTPException(400, {"code": "badReturn"})
    if error or not code:
        return RedirectResponse(f"{return_to}?auth=denied", status_code=302)

    try:
        granted = oauth.exchange_code(
            code=code,
            client_id=GOOGLE_CLIENT_ID,
            client_secret=GOOGLE_CLIENT_SECRET,
            redirect_uri=redirect_uri(),
            verifier=payload.get("cv", ""),
        )
    except oauth.OAuthError:
        return RedirectResponse(f"{return_to}?auth=failed", status_code=302)

    claims = oauth.claims_from_id_token(
        granted.get("id_token") or "", client_id=GOOGLE_CLIENT_ID, now=now
    )
    if not claims:
        return RedirectResponse(f"{return_to}?auth=failed", status_code=302)

    settings = {}
    try:
        settings = db.settings_all()
    except Exception:  # noqa: BLE001 - a missing setting is not a failed login
        pass
    user = db.user_upsert(
        google_sub=claims["sub"],
        email=gate.normalize_email(claims.get("email")),
        name=claims.get("name"),
        picture_url=claims.get("picture"),
        signup_credits=gate.setting_int(
            settings,
            gate.SETTING_SIGNUP_CREDITS,
            default=gate.DEFAULT_SIGNUP_CREDITS,
            lo=0,
            hi=100000,
        ),
    )
    if not user:
        return RedirectResponse(f"{return_to}?auth=failed", status_code=302)

    if payload.get("md") == "code":
        raw = secrets.token_urlsafe(32)
        db.auth_code_put(code_hash=_hash_code(raw), user_id=int(user["id"]))
        return RedirectResponse(f"{return_to}?code={raw}", status_code=302)

    session = _issue(user)
    # A FRAGMENT, not a query string. Fragments are never sent to a server, so
    # the token stays out of access logs and out of the Referer header.
    return RedirectResponse(f"{return_to}#token={session}", status_code=302)


@router.post("/api/auth/exchange")
def auth_exchange(request: Request, payload: dict) -> JSONResponse:
    """Redeem a one-time code for a session. Server-to-server only.

    Used by the admin service, which then keeps the token in a first-party
    httpOnly cookie on its own domain - so the admin's session never reaches
    browser JavaScript at all.
    """
    if not accounts_enabled():
        raise HTTPException(503, {"code": "accountsOff"})
    raw = str(payload.get("code") or "")
    if not raw:
        raise HTTPException(400, {"code": "badRequest"})
    user_id = db.auth_code_redeem(_hash_code(raw))
    if not user_id:
        raise HTTPException(401, {"code": "badCode"})
    row = db.user_for_gate(user_id)
    if not row:
        raise HTTPException(401, {"code": "badCode"})
    return JSONResponse({"token": _issue(row), "email": row.get("email")})


@router.get("/api/me")
def me(request: Request) -> dict:
    """The signed-in user, including the balance.

    Separate from `/api/meta` on purpose: that endpoint is the Railway
    healthcheck and must never issue a query. This one is only called when a
    token exists.
    """
    if not accounts_enabled():
        raise HTTPException(503, {"code": "accountsOff"})
    who = identity(request)
    if not who.signed_in:
        raise HTTPException(401, {"code": "signedOut"})
    row = db.user_for_gate(who.user_id)
    if not row or row.get("token_epoch") != who.token_epoch:
        raise HTTPException(401, {"code": "signedOut"})
    return {
        "email": row.get("email"),
        "name": row.get("name"),
        "picture_url": row.get("picture_url"),
        "status": row.get("status"),
        "credits": int(row.get("balance") or 0),
        "role": "admin" if gate.is_admin(row.get("email"), ADMIN_EMAILS) else "user",
    }


def _issue(user: dict) -> str:
    return tokens.sign(
        {
            "uid": int(user["id"]),
            "em": gate.normalize_email(user.get("email")),
            "ep": int(user.get("token_epoch") or 1),
        },
        SESSION_SECRET,
        now=int(time.time()),
    )


def _hash_code(raw: str) -> str:
    """Codes are stored hashed. A leaked backup should not be a set of sessions."""
    return hashlib.sha256(raw.encode()).hexdigest()
