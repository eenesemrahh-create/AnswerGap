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
from urllib.parse import quote

from fastapi import APIRouter, HTTPException, Request
from fastapi.responses import JSONResponse, RedirectResponse
from pydantic import BaseModel, Field, field_validator

from answergap import db, gate, mailer, oauth, passwords, tokens

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
#
# The raw string is kept because ORDER is a fact the allowlist itself cannot
# carry - `parse_origins` returns a set, and `WEB_BASE_URL` below needs to know
# which of these the operator meant as the customer app.
AUTH_RETURN_ORIGINS_RAW = os.environ.get(
    "AUTH_RETURN_ORIGINS", "http://localhost:3000,http://localhost:3100"
)
AUTH_RETURN_ORIGINS = oauth.parse_origins(AUTH_RETURN_ORIGINS_RAW)

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

    Requires the secret, a public URL to come back to, AND a database - an
    account that cannot be stored is not an account, and a verification link
    that cannot name a host cannot be clicked.

    GOOGLE IS NO LONGER PART OF THIS TEST. It was, until password accounts
    existed and made the two questions genuinely different: a deployment with
    no Google client can still run email sign-in perfectly well, and the old
    combined check would have switched the whole account system off to report
    the absence of one of its two doors.
    """
    return bool(SESSION_SECRET and PUBLIC_BASE_URL and db.available())


def google_enabled() -> bool:
    """Whether the Google button should work - and be shown at all.

    Reported through `/api/meta` so the sign-in dialog can hide a button that
    would only ever produce a 503. A door that is visibly there and does not
    open is worse than one that was never drawn.
    """
    return bool(accounts_enabled() and GOOGLE_CLIENT_ID and GOOGLE_CLIENT_SECRET)


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
    # Absent `ev` means a token signed before password accounts existed. Those
    # were all Google sign-ins, and Google had already asserted a verified
    # address, so True is the correct reading rather than a lenient one - and
    # the alternative would have signed out every live session on deploy.
    verified = bool(payload.get("ev", True))
    return gate.Identity(
        user_id=payload.get("uid"),
        email=email,
        # VERIFICATION IS PART OF BEING AN ADMIN, and this is the line that
        # makes it so. `ADMIN_EMAILS` matches on the address; a password signup
        # may type ANY address, the operator's included, and receives a session
        # before the mail is opened. Without `and verified`, "sign up as the
        # admin address and never check the inbox" would be an admin session.
        # The claim is inside a token we signed, so reading it here costs no
        # query - which is what `/api/meta` requires.
        is_admin=verified and gate.is_admin(email, ADMIN_EMAILS),
        email_verified=verified,
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
            # From the ROW, not from the token. The token's claim was true when
            # it was signed; this is the spending path, where the current fact
            # is the one that decides. It also means a session opened before
            # verification starts spending the moment the link is clicked,
            # without waiting for the token to be re-issued.
            email_verified=bool(row.get("email_verified", True)),
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
        raise _refuse(
            who,
            action,
            decision.outcome,
            decision.http_status,
            decision.code,
            info=decision.info,
        )
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
    who: gate.Identity,
    action: str,
    outcome: str,
    status: int | None,
    code: str | None,
    info: dict | None = None,
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
    return HTTPException(status or 403, {"code": code or "forbidden", **(info or {})})


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
    # The same rule `identity` applies to the token, applied again to the row.
    # Defence in depth on the one check that separates "admin is an allowlist"
    # from "admin is a claim anybody can type into a signup form".
    if not row.get("email_verified", True):
        raise HTTPException(403, {"code": "emailUnverified"})
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
    if not google_enabled():
        # `googleOff`, not `accountsOff`. With password sign-in beside it,
        # "Google is not configured here" and "accounts are switched off" are
        # different facts, and the dialog reacts differently to each.
        raise HTTPException(503, {"code": "googleOff"})
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
    if not google_enabled():
        raise HTTPException(503, {"code": "googleOff"})

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
    except oauth.OAuthError as exc:
        # LOGGED, not swallowed. `oauth.exchange_code` already builds a message
        # naming Google's own reason - redirect_uri_mismatch, invalid_client, a
        # bad PKCE verifier - and its docstring says that reason "has to reach
        # the log". It did not: this handler caught the exception and discarded
        # it, so every one of those distinct causes arrived as the same
        # characterless `?auth=failed` and the only way to tell them apart was
        # to guess.
        #
        # That cost a debugging round trip on 2026-09-15, which is the same
        # price `return_allowed` paid before IT was given a log line below.
        # The detail must not reach the USER - it names our client id and our
        # redirect configuration - but it must reach us.
        print(f"[auth] google token exchange failed: {exc}", flush=True)
        return RedirectResponse(f"{return_to}?auth=failed", status_code=302)

    claims = oauth.claims_from_id_token(
        granted.get("id_token") or "", client_id=GOOGLE_CLIENT_ID, now=now
    )
    if not claims:
        # The other silent path. `claims_from_id_token` returns None for a bad
        # issuer, an audience that is not our client id, an expired token, or
        # `email_verified: false` - four different problems with four different
        # fixes, previously indistinguishable from each other AND from the
        # exchange failure above.
        print(
            "[auth] google id_token rejected: "
            f"id_token_present={bool(granted.get('id_token'))} "
            f"client_id_set={bool(GOOGLE_CLIENT_ID)}",
            flush=True,
        )
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
        # `db.user_upsert` has already logged the exception behind this. The
        # line here is what says WHICH of the three failure paths was taken,
        # since all three end at the same redirect.
        print("[auth] user_upsert returned nothing; sign-in abandoned", flush=True)
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
    verified = bool(row.get("email_verified", True))
    return {
        "email": row.get("email"),
        "name": row.get("name"),
        "picture_url": row.get("picture_url"),
        "status": row.get("status"),
        "credits": int(row.get("balance") or 0),
        # Drives the "confirm your address" banner and the resend button. Read
        # from the ROW rather than from the token, so the banner disappears as
        # soon as the link is clicked on another device - without waiting for
        # this session's token to be re-issued.
        "email_verified": verified,
        # Which doors this account can use. The account screen needs both:
        # offering "set a password" to somebody who has one, or "unlink
        # Google" to somebody who never linked it, is how a settings page
        # starts lying about the account it describes.
        "has_password": bool(row.get("has_password", False)),
        "has_google": bool(row.get("has_google", True)),
        # Verification is part of being an admin - the same rule `identity`
        # applies, restated here so the two cannot drift. `ADMIN_EMAILS`
        # matches on the address, and a password signup may type any address
        # it likes until a mail proves otherwise.
        "role": (
            "admin"
            if verified and gate.is_admin(row.get("email"), ADMIN_EMAILS)
            else "user"
        ),
    }


# ====================================================== email + password
#
# The second door. Everything below produces the SAME session token as the
# Google path and nothing downstream can tell which door was used - that is
# what keeps `gate`, `identity`, the ownership checks and the admin panel
# untouched by this feature.
#
# THREE RULES SHAPE EVERY HANDLER HERE, and they are worth stating once
# because each one looks like an oversight if you meet it alone.
#
# 1. NO ENDPOINT CONFIRMS WHETHER AN ADDRESS HAS AN ACCOUNT. Signup, resend
#    and forgot-password all answer identically whatever they find. An
#    endpoint that says "this address is already registered" is a membership
#    oracle: point it at a list and it tells you who your users are. The cost
#    is that a typo'd signup looks like it worked, which the mail then
#    corrects - a fair trade against publishing the customer list.
#
# 2. FAILURE IS SLOW ON PURPOSE. A missing account still pays for one scrypt
#    derivation, because returning early would make "no such user" measurably
#    faster than "wrong password" and hand back the oracle rule 1 just closed.
#
# 3. SENDING MAIL IS CAPPED IN TWO PLACES. Per caller in memory, and per
#    account in the database. These endpoints must be open - "I forgot my
#    password" cannot require the password - so without a cap anyone could aim
#    our sending reputation at an address as a weapon.

# Where the browser lives, for links that go INTO an email. `PUBLIC_BASE_URL`
# is the api; a person clicking a link in their inbox needs the app. Falls
# back to the first allowed return origin so a correct deployment does not
# need a fourth URL variable set to a value it could have worked out.
#
# THE FALLBACK USED TO SORT THE ALLOWLIST AND TAKE `[0]`, WHICH IS NOT "first"
# BUT "alphabetically first" - and there are always at least two apps here.
# `https://admin-…` sorts ahead of `https://web-…`, so with `WEB_BASE_URL`
# unset every verification link mailed a CUSTOMER to the ADMIN console, which
# cannot read the session fragment and simply showed its own sign-in screen.
# The order the operator wrote is the only signal available about which origin
# is the customer app, so it is the one that is honoured.
WEB_BASE_URL = (
    os.environ.get("WEB_BASE_URL", "").rstrip("/")
    or oauth.first_origin(AUTH_RETURN_ORIGINS_RAW)
)

# Sliding-window counters, in memory, per process. Same trade as the `/jobs`
# sweep cooldown: a database round trip to answer "how many times lately" is
# ~150 ms on a path whose whole job is to be cheap, and process-local state
# resetting on redeploy costs one burst of allowance rather than a permanent
# hole. The DB-backed per-account cap below is what makes that acceptable -
# these two are not the same control counted twice, they close different
# halves (one attacker many accounts / many attackers one account).
_ATTEMPTS: dict[str, list[float]] = {}

LOGIN_WINDOW_SECONDS = 15 * 60
LOGIN_MAX_PER_EMAIL = 10
LOGIN_MAX_PER_IP = 30

MAIL_WINDOW_SECONDS = 60 * 60
MAIL_MAX_PER_IP = 6
# Per account, counted in Postgres so it holds across replicas and restarts.
# Four an hour is generous for a person pressing "resend" and useless as a
# weapon.
MAIL_MAX_PER_ACCOUNT = 4

# A real scrypt hash of a value nobody knows, derived once at import. Verifying
# against it is how a sign-in for a non-existent account spends the same time
# as a real one - see rule 2 above. Deriving it lazily would put the cost on
# the first failed sign-in instead, which is the request that must not be
# distinguishable.
_DUMMY_HASH = passwords.hash_password(secrets.token_urlsafe(32))


def _rate_ok(key: str, *, limit: int, window: int) -> bool:
    """Record an attempt and say whether it is within the window's limit.

    Mark-first, like `_should_sweep`: the attempt is counted even when it is
    refused, so hammering the endpoint keeps the window full rather than
    letting a refused attempt cost nothing.
    """
    now = time.time()
    kept = [t for t in _ATTEMPTS.get(key, []) if now - t < window]
    kept.append(now)
    _ATTEMPTS[key] = kept
    # `> limit` because this call's own attempt is already in the list; with
    # `>=` a limit of 10 would refuse the 10th.
    return len(kept) <= limit


def _hash_token(raw: str) -> str:
    """Emailed tokens are stored hashed, like auth codes and for one reason:
    a leaked backup of `email_token` must not be a set of live links."""
    return hashlib.sha256(raw.encode()).hexdigest()


def _signup_credits() -> int:
    try:
        settings = db.settings_all()
    except Exception:  # noqa: BLE001 - a missing setting is not a failed signup
        settings = {}
    return gate.setting_int(
        settings,
        gate.SETTING_SIGNUP_CREDITS,
        default=gate.DEFAULT_SIGNUP_CREDITS,
        lo=0,
        hi=100000,
    )


def _send_link(*, user: dict, purpose: str, locale: str) -> bool:
    """Mint a one-time token, store its hash, and mail the link.

    The two TTLs come from `db`, beside the table they describe, so the
    lifetime quoted in the email cannot drift from the one enforced in SQL.

    The RESET link points at the web app because the next step needs a form;
    the VERIFY link points at this api because the next step is a redirect
    carrying a session, and a fragment cannot be read by a server.
    """
    raw = secrets.token_urlsafe(32)
    ttl = db.VERIFY_TTL_SECONDS if purpose == db.PURPOSE_VERIFY else db.RESET_TTL_SECONDS
    email = gate.normalize_email(user.get("email"))
    try:
        db.email_token_put(
            token_hash=_hash_token(raw),
            user_id=int(user["id"]),
            purpose=purpose,
            email=email,
            ttl_seconds=ttl,
        )
    except Exception as exc:  # noqa: BLE001
        print(f"[auth] could not store {purpose} token: {exc}", flush=True)
        return False

    if purpose == db.PURPOSE_VERIFY:
        link = f"{PUBLIC_BASE_URL}/api/auth/verify?token={quote(raw)}"
    else:
        link = f"{WEB_BASE_URL}/?reset={quote(raw)}"

    subject, text, html = mailer.render(purpose, link=link, locale=locale)
    return mailer.send(to=email, subject=subject, text=text, html=html)


def _locale_of(raw: str | None) -> str:
    """The reader's language, for the email only. Unknown values fall to `en`."""
    value = (raw or "").strip().lower()[:5]
    return value if value in mailer.FALLBACK else "en"


def _accounts_or_503() -> None:
    if not accounts_enabled():
        raise HTTPException(503, {"code": "accountsOff"})


class _EmailField(BaseModel):
    """Shared address field. NORMALISES here, REFUSES in the handler.

    The split is deliberate. A `field_validator` that raised would make FastAPI
    answer 422 with Pydantic's own English prose - and this API returns machine
    codes precisely because it cannot know which of five languages to apologise
    in (see the module docstring in main.py). So the shape check happens in the
    handler via `_email_or_400`, which returns `{"code": "invalidEmail"}` like
    every other refusal here.

    `gate.looks_like_email` rather than `EmailStr`, so the requirements file
    stays three lines long - see the note on that function.
    """

    email: str = Field(min_length=3, max_length=gate.EMAIL_MAX_LENGTH)

    @field_validator("email")
    @classmethod
    def _normalize(cls, value: str) -> str:
        return gate.normalize_email(value)


def _email_or_400(raw: str) -> str:
    """Normalised address, or a coded 400. Never leaks whether it has an account."""
    email = gate.normalize_email(raw)
    if not gate.looks_like_email(email):
        raise HTTPException(400, {"code": "invalidEmail"})
    return email


class SignupRequest(_EmailField):
    # Bounded here as well as in `passwords.check_policy`, because this bound
    # is about the REQUEST: scrypt is memory-hard by design, so an unbounded
    # password field is an unbounded amount of work per attempt chosen by the
    # caller. The policy check is about the password; this is about the door.
    password: str = Field(min_length=1, max_length=passwords.MAX_LENGTH)
    name: str | None = Field(default=None, max_length=120)
    locale: str | None = None


class LoginRequest(_EmailField):
    password: str = Field(min_length=1, max_length=passwords.MAX_LENGTH)


class EmailOnlyRequest(_EmailField):
    locale: str | None = None


class ResetRequest(BaseModel):
    token: str = Field(min_length=1, max_length=200)
    password: str = Field(min_length=1, max_length=passwords.MAX_LENGTH)


@router.post("/api/auth/signup")
def signup(request: Request, payload: SignupRequest) -> JSONResponse:
    """Create an unverified account and mail a link. NEVER returns a session.

    Withholding the token is the gate, and it is stronger than any check a
    handler could make afterwards: an account that has not proven its address
    cannot be signed in at all until the link is clicked, so there is no
    window in which an unverified session exists to be misused.

    The reply is identical whether the address was free, already taken by a
    password account, or already taken by a Google account. See rule 1.
    """
    _accounts_or_503()
    who = identity(request)
    if not _rate_ok(
        f"mail:{who.ip_hash}", limit=MAIL_MAX_PER_IP, window=MAIL_WINDOW_SECONDS
    ):
        raise HTTPException(429, {"code": "tooManyRequests"})

    # Policy BEFORE the lookup, and it is the one thing here that does answer
    # honestly: "your password is too short" is a fact about what the caller
    # just typed, not about who else has an account.
    try:
        passwords.check_policy(payload.password)
    except passwords.WeakPassword as weak:
        raise HTTPException(
            400, {"code": weak.code, "minLength": passwords.MIN_LENGTH}
        ) from weak

    email = _email_or_400(payload.email)
    locale = _locale_of(payload.locale)
    name = (payload.name or "").strip() or None

    existing = db.user_by_email(email)
    if existing is None:
        created = db.user_create_password(
            email=email,
            password_hash=passwords.hash_password(payload.password),
            name=name,
        )
        # None here means the address was taken between the SELECT and the
        # INSERT - two signups racing on one address. The unique index caught
        # it, and the loser is told what everybody is told.
        if created:
            _send_link(user=created, purpose=db.PURPOSE_VERIFY, locale=locale)
    elif not existing.get("email_verified"):
        # An unverified account being signed up again is somebody who never got
        # the first mail. Re-send, and take the new password: nobody has proven
        # control of this address yet, so there is no account here to protect -
        # the mail is what will decide who owns it.
        db.user_set_password(
            user_id=int(existing["id"]),
            password_hash=passwords.hash_password(payload.password),
            revoke=False,
        )
        if (
            db.email_token_recent(
                user_id=int(existing["id"]),
                purpose=db.PURPOSE_VERIFY,
                window_seconds=MAIL_WINDOW_SECONDS,
            )
            < MAIL_MAX_PER_ACCOUNT
        ):
            _send_link(user=existing, purpose=db.PURPOSE_VERIFY, locale=locale)
    else:
        # A VERIFIED account already owns this address. Setting the password
        # here would be account takeover by signup form, so instead we mail the
        # owner a password-reset link - which is the honest reading of "someone
        # is trying to create this account": either they forgot, and this is
        # what they needed, or it is not them and the link goes to the person
        # it should. Either way the reply to the CALLER is unchanged.
        if (
            db.email_token_recent(
                user_id=int(existing["id"]),
                purpose=db.PURPOSE_RESET,
                window_seconds=MAIL_WINDOW_SECONDS,
            )
            < MAIL_MAX_PER_ACCOUNT
        ):
            _send_link(user=existing, purpose=db.PURPOSE_RESET, locale=locale)

    return JSONResponse({"status": "verificationSent", "email": email})


@router.post("/api/auth/login")
def login(request: Request, payload: LoginRequest) -> JSONResponse:
    """Exchange an address and password for a session.

    ONE refusal code for every way this can fail - no such account, no password
    on it, wrong password. Three different codes would be three different
    answers to "does this address have an account", which is rule 1 again.

    An UNVERIFIED account is the single exception, and it is not a leak: the
    caller just proved they know the password, so they are the account holder
    and telling them to check their inbox is the only useful thing left to say.
    """
    _accounts_or_503()
    who = identity(request)
    email = _email_or_400(payload.email)
    if not _rate_ok(
        f"login:{email}", limit=LOGIN_MAX_PER_EMAIL, window=LOGIN_WINDOW_SECONDS
    ) or not _rate_ok(
        f"loginip:{who.ip_hash}", limit=LOGIN_MAX_PER_IP, window=LOGIN_WINDOW_SECONDS
    ):
        raise HTTPException(429, {"code": "tooManyAttempts"})

    row = db.user_by_email(email)
    stored = (row or {}).get("password_hash")
    # The dummy derivation is the point: a missing account and a wrong password
    # take the same time. Without it the endpoint answers "is this address
    # registered" in milliseconds.
    ok = passwords.verify_password(payload.password, stored or _DUMMY_HASH)
    if not row or not stored or not ok:
        # One code for all three. The address exists but arrived through Google
        # and has no password? Same answer as a wrong password, deliberately.
        raise HTTPException(401, {"code": "badCredentials"})
    # VERIFICATION BEFORE STATUS, and the order is the message - the same
    # argument `gate.decide` makes about checking the balance last. Someone who
    # signed up again with a previously erased address has a correct password
    # and an unverified, still-erased row; telling them "this account is
    # suspended" would be true and useless when the action they need is the
    # link already sitting in their inbox. No enumeration cost: they just
    # proved the password.
    if not row.get("email_verified"):
        raise HTTPException(403, {"code": "emailUnverified", "email": email})
    if row.get("status") != gate.STATUS_ACTIVE:
        raise HTTPException(403, {"code": "suspended"})

    # The cost parameters can be raised later, and this is the only moment the
    # plaintext exists to re-derive under them. `revoke=False`: the person is
    # signing in successfully, and bumping the epoch here would sign them out
    # of their other devices as a reward for a correct password.
    if passwords.needs_rehash(stored):
        try:
            db.user_set_password(
                user_id=int(row["id"]),
                password_hash=passwords.hash_password(payload.password),
                revoke=False,
            )
        except Exception:  # noqa: BLE001 - a failed upgrade is not a failed login
            pass

    return JSONResponse({"token": _issue(row), "email": row.get("email")})


@router.get("/api/auth/verify")
def verify_email(token: str = "") -> RedirectResponse:
    """Redeem an emailed verification link, then sign the person straight in.

    A GET, because it is reached by clicking a link in a mail client. That
    makes it prefetchable - some clients and scanners fetch links to preview
    them - which is exactly why redemption lands somewhere useful either way:
    the token is single-use, and a second redemption says so plainly instead
    of showing an error page to somebody whose account is already fine.

    Signing in here is what makes the flow one step instead of two. The session
    travels in a FRAGMENT for the same reason the Google callback uses one:
    fragments never reach a server, so the token stays out of access logs and
    out of the `Referer` header.
    """
    _accounts_or_503()
    home = WEB_BASE_URL or ""
    if not token:
        return RedirectResponse(f"{home}/?auth=verifyFailed", status_code=302)

    user_id = db.email_token_redeem(
        token_hash=_hash_token(token), purpose=db.PURPOSE_VERIFY
    )
    if not user_id:
        # Expired, already spent, or never real - and "already spent" is the
        # one that must not be treated like the others. The commonest way a
        # token is spent is a mail scanner prefetching the link, which verifies
        # the account before the human clicks; sending that person off to ask
        # for a replacement link would strand them, because `resend` will not
        # mail an account that is already verified.
        if db.email_token_settled(
            token_hash=_hash_token(token), purpose=db.PURPOSE_VERIFY
        ):
            return RedirectResponse(f"{home}/?auth=alreadyVerified", status_code=302)
        # Genuinely no good: the page offers "send me a new link".
        return RedirectResponse(f"{home}/?auth=verifyExpired", status_code=302)

    row = db.user_verify_email(user_id=user_id, signup_credits=_signup_credits())
    if not row:
        return RedirectResponse(f"{home}/?auth=verifyFailed", status_code=302)
    if row.get("status") != gate.STATUS_ACTIVE:
        return RedirectResponse(f"{home}/?auth=suspended", status_code=302)

    session = _issue(row)
    return RedirectResponse(f"{home}/?verified=1#token={session}", status_code=302)


@router.post("/api/auth/resend")
def resend_verification(request: Request, payload: EmailOnlyRequest) -> JSONResponse:
    """Send the verification link again. Always answers the same way."""
    _accounts_or_503()
    who = identity(request)
    if not _rate_ok(
        f"mail:{who.ip_hash}", limit=MAIL_MAX_PER_IP, window=MAIL_WINDOW_SECONDS
    ):
        raise HTTPException(429, {"code": "tooManyRequests"})

    email = _email_or_400(payload.email)
    row = db.user_by_email(email)
    # Nothing to do for an address with no account, or one already verified -
    # and in both cases the reply is the one everybody gets.
    if row and not row.get("email_verified"):
        if (
            db.email_token_recent(
                user_id=int(row["id"]),
                purpose=db.PURPOSE_VERIFY,
                window_seconds=MAIL_WINDOW_SECONDS,
            )
            < MAIL_MAX_PER_ACCOUNT
        ):
            _send_link(
                user=row, purpose=db.PURPOSE_VERIFY, locale=_locale_of(payload.locale)
            )
    return JSONResponse({"status": "verificationSent", "email": email})


@router.post("/api/auth/forgot")
def forgot_password(request: Request, payload: EmailOnlyRequest) -> JSONResponse:
    """Mail a password-reset link. Always answers the same way.

    A Google-only account gets a link too, and redeeming it SETS a password
    rather than refusing. The person controls the mailbox, which is the same
    proof Google gave us, so the outcome is an account with both doors - not
    a dead end that says "you signed up with Google" to somebody who does not
    remember doing so.
    """
    _accounts_or_503()
    who = identity(request)
    if not _rate_ok(
        f"mail:{who.ip_hash}", limit=MAIL_MAX_PER_IP, window=MAIL_WINDOW_SECONDS
    ):
        raise HTTPException(429, {"code": "tooManyRequests"})

    email = _email_or_400(payload.email)
    row = db.user_by_email(email)
    if row and row.get("status") == gate.STATUS_ACTIVE:
        if (
            db.email_token_recent(
                user_id=int(row["id"]),
                purpose=db.PURPOSE_RESET,
                window_seconds=MAIL_WINDOW_SECONDS,
            )
            < MAIL_MAX_PER_ACCOUNT
        ):
            _send_link(
                user=row, purpose=db.PURPOSE_RESET, locale=_locale_of(payload.locale)
            )
    return JSONResponse({"status": "resetSent", "email": email})


@router.post("/api/auth/reset")
def reset_password(request: Request, payload: ResetRequest) -> JSONResponse:
    """Redeem a reset link, set the new password, and sign in.

    `revoke=True` on the write, and that is the security half of this endpoint.
    A reset exists because control of the account may have been lost; leaving
    the old sessions alive would make it cosmetic - the attacker keeps their
    token and the owner changes a password that protects nothing. Bumping
    `token_epoch` invalidates every session ever issued, including the
    attacker's, and the fresh one returned below is the only one left.

    Redeeming also VERIFIES the address: the link proves the same mailbox
    control the verification mail does, so refusing to count it would send
    somebody a second mail asking for what they just demonstrated.
    """
    _accounts_or_503()
    who = identity(request)
    if not _rate_ok(
        f"reset:{who.ip_hash}", limit=LOGIN_MAX_PER_IP, window=LOGIN_WINDOW_SECONDS
    ):
        raise HTTPException(429, {"code": "tooManyAttempts"})

    try:
        passwords.check_policy(payload.password)
    except passwords.WeakPassword as weak:
        raise HTTPException(
            400, {"code": weak.code, "minLength": passwords.MIN_LENGTH}
        ) from weak

    user_id = db.email_token_redeem(
        token_hash=_hash_token(payload.token), purpose=db.PURPOSE_RESET
    )
    if not user_id:
        raise HTTPException(400, {"code": "resetExpired"})

    if not db.user_set_password(
        user_id=user_id,
        password_hash=passwords.hash_password(payload.password),
        revoke=True,
    ):
        raise HTTPException(400, {"code": "resetExpired"})

    row = db.user_verify_email(user_id=user_id, signup_credits=_signup_credits())
    if not row:
        raise HTTPException(400, {"code": "resetExpired"})
    if row.get("status") != gate.STATUS_ACTIVE:
        raise HTTPException(403, {"code": "suspended"})
    # Re-read so the token carries the BUMPED epoch. Signing the old one would
    # hand back a session the revocation above had just invalidated.
    fresh = db.user_for_gate(user_id) or row
    return JSONResponse({"token": _issue(fresh), "email": fresh.get("email")})


class EraseRequest(BaseModel):
    """What the person typed to prove they meant it.

    ONE field for two different proofs, because the account has one of two
    doors and not always both: an account with a password re-types the
    PASSWORD, a Google-only account re-types its own EMAIL ADDRESS. Naming the
    field after neither keeps the endpoint from telling a caller which kind of
    account an address is - which is exactly the enumeration `login` is careful
    about - and keeps the client from having to send the right key.
    """

    confirm: str = Field(min_length=1, max_length=passwords.MAX_LENGTH)
    locale: str | None = None


@router.post("/api/account/erase")
def erase_account(request: Request, payload: EraseRequest) -> JSONResponse:
    """Delete your own account. The Privacy Policy's section 7, as an endpoint.

    RE-AUTHENTICATION, because this is irreversible from the person's side and
    a session token is fourteen days old by the time most people use it. There
    was no re-auth machinery in this file - `verify_password` was called in
    exactly one place, inside `login` - so this is it: the password when there
    is one, the address when the account came through Google and there is not.

    The address fallback is not security theatre. A Google-only account has no
    secret we can check without bouncing the person through an OAuth redirect
    and back, and typing your own address is the same deliberate act GitHub
    and Stripe ask for. What it defends against is the misclick and the
    unattended laptop, which is what this control is actually exposed to.

    Rate-limited per identity as well as per address: `_rate_ok` is in-process
    and resets on redeploy, which is fine here - the cost of a burst is a few
    wrong guesses at a password the caller already has a session for.
    """
    _accounts_or_503()
    who = identity(request)
    if not who.signed_in:
        raise HTTPException(401, {"code": "signedOut"})
    if not _rate_ok(
        f"erase:{who.user_id}", limit=LOGIN_MAX_PER_EMAIL, window=LOGIN_WINDOW_SECONDS
    ):
        raise HTTPException(429, {"code": "tooManyAttempts"})

    # The epoch re-check is the same one `/api/me` does: a token signed before
    # a revocation must not be able to act.
    gate_row = db.user_for_gate(who.user_id)
    if not gate_row or gate_row.get("token_epoch") != who.token_epoch:
        raise HTTPException(401, {"code": "signedOut"})

    # `user_by_email` is the ONE function that fetches `password_hash`, by its
    # own docstring, so the proof is checked through it rather than by adding a
    # second way to read the column.
    email = gate.normalize_email(gate_row.get("email"))
    row = db.user_by_email(email)
    stored = (row or {}).get("password_hash")
    if stored:
        proven = passwords.verify_password(payload.confirm, stored)
    else:
        proven = gate.normalize_email(payload.confirm) == email
    if not proven:
        raise HTTPException(403, {"code": "badCredentials"})

    result = db.user_erase(
        user_id=int(who.user_id),
        # The account's own address, which is what makes `user_erase` label the
        # audit row `erase_self` rather than `erase`.
        actor=email,
        reason="self_service",
    )
    if result is None:
        raise HTTPException(401, {"code": "signedOut"})

    # AFTER the erasure, never before: a mail promising a deletion that then
    # failed is worse than no mail. It is also best-effort - `send` does not
    # raise into a caller - because a provider outage must not turn a completed
    # erasure into an error the person retries.
    if not result.get("already_erased"):
        try:
            subject, text, html = mailer.render(
                "erased", link=WEB_BASE_URL or PUBLIC_BASE_URL,
                locale=_locale_of(payload.locale),
            )
            mailer.send(to=email, subject=subject, text=text, html=html)
        except Exception as exc:  # noqa: BLE001 - the erasure already happened
            print(f"[auth] erasure mail failed: {type(exc).__name__}: {exc}", flush=True)

    # The client's token is already dead - erasure bumped the epoch - and this
    # is what tells it to stop holding one.
    return JSONResponse({"status": "erased"})


def _issue(user: dict) -> str:
    """Sign a session token. ONE function, so both doors produce the same thing.

    A password sign-in and a Google sign-in are indistinguishable downstream by
    design: the gate, the admin panel, `/api/me` and every ownership check read
    the same claims and never ask which door was used.
    """
    return tokens.sign(
        {
            "uid": int(user["id"]),
            "em": gate.normalize_email(user.get("email")),
            "ep": int(user.get("token_epoch") or 1),
            # Whether the address is proven. Read by `identity` with NO query,
            # which is what lets the admin check stay off the healthcheck path.
            # Defaults True because every caller that predates password
            # accounts passes a Google row, where it always was.
            "ev": bool(user.get("email_verified", True)),
        },
        SESSION_SECRET,
        now=int(time.time()),
    )


def _hash_code(raw: str) -> str:
    """Codes are stored hashed. A leaked backup should not be a set of sessions."""
    return hashlib.sha256(raw.encode()).hexdigest()
