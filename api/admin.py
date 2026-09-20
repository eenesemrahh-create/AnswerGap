"""The admin surface. Every endpoint here requires ADMIN_EMAILS.

The file boundary is an AUTH boundary, not a line count: everything in this
module is behind `require_admin`, and nothing in `main.py` is. That is worth a
separate file on its own, because "is this endpoint protected?" becomes a
question you answer by looking at which file it lives in.

ONE SCREEN = ONE CALL = ONE STATEMENT
--------------------------------------
Three hops separate the admin's browser from Postgres (browser -> admin service
-> api service -> database) and the last one measures ~150 ms because the
database did not move to California with the api. A page that issues four calls
pays 600 ms before it renders anything. Every read below maps to exactly one
`db.*` function, and every one of those issues exactly one statement.

WHAT AN ADMIN CANNOT DO
-----------------------
Make another admin. There is no role column and no endpoint here writes one -
admin is an entry in an environment variable on the api service, so the only way
to grant it is a deploy. That is deliberate: it makes privilege escalation
structurally absent rather than forbidden by a check somebody could remove.
"""

from __future__ import annotations

import json
from typing import Literal

from fastapi import APIRouter, HTTPException, Request
from pydantic import BaseModel, Field, model_validator

from answergap import db, gate

from . import ci, stripe
from .auth import ADMIN_EMAILS, PUBLIC_BASE_URL, WEB_BASE_URL, require_admin

router = APIRouter(prefix="/api/admin")

# The marketing landing shows a pricing card per plan. Between 0 and 4 plans
# fit the layouts the CSS grid supports; the wider constraint is really the
# reader - after four cards the section becomes a comparison chart, not a
# pricing pitch. Set here rather than in the payload's `max_length` so the
# limit is written once and audited from one place.
PRICING_MAX_PLANS = 4
# A plan carries at most this many bullet points. The card visual starts to
# read as an itemised invoice past six, and Replit's reference sits at five;
# the ceiling is generous but not decorative.
PRICING_MAX_FEATURES = 8

# Bounds for the two runtime settings. Clamped here as well as in
# `gate.setting_int` - rejecting a bad value at the door gives the admin an
# error they can act on, rather than silently storing something the reader
# clamps later and nobody can explain.
ANON_DAILY_MAX = 100
SIGNUP_CREDITS_MAX = 100_000
# A grant is a person typing a number. Six figures in one action is a slip, not
# an intention, and the ledger is append-only - a mistake cannot be edited away,
# only offset by a second row.
CREDIT_DELTA_MAX = 100_000


class CreditRequest(BaseModel):
    delta: int
    note: str | None = Field(default=None, max_length=500)


class StatusRequest(BaseModel):
    status: str = Field(pattern="^(active|suspended)$")


class SettingsRequest(BaseModel):
    anonymous_daily_searches: int | None = None
    signup_credits: int | None = None


class Plan(BaseModel):
    """One row of the pricing landing section.

    `id` is what the frontend keys its React list on and what an admin can use
    to spot the same plan across an audit log entry. Lower-case ASCII plus
    hyphens keeps it slug-safe; anything more permissive would let a plan id
    end up in a query string looking like garbage.

    `theme` picks the card's visual identity. Four values so the operator
    picks one per card rather than mixing arbitrary colours - discrete
    choices produce visually coherent landings; a free hex-picker would
    ship rainbows and undermine the brand. `dark` is what the old
    `featured` boolean produced; `light` is the default surface; `violet`
    and `pink` tint the surface with the brand and accent hues, so a set of
    four cards can look distinct without any of them fighting the palette.
    Palette rule from globals.css still stands: NONE of these are status
    tokens - amber/teal never appear.

    `badge` is independent of theme (an admin can flag any card as Most
    Popular regardless of colour) and `enabled` is the publish switch: only
    cards with `enabled=true` reach the marketing landing. Text fields are
    `min_length=0` so a draft can hold WIP content; the model_validator
    below refuses `enabled` with a blank required field so an empty card
    cannot ship by ticking a checkbox.
    """

    id: str = Field(min_length=1, max_length=32, pattern=r"^[a-z0-9-]+$")
    enabled: bool = False
    theme: Literal["light", "violet", "pink", "dark"] = "light"
    name: str = Field(min_length=0, max_length=40, default="")
    desc: str = Field(min_length=0, max_length=200, default="")
    price: str = Field(min_length=0, max_length=20, default="")
    per: str = Field(min_length=0, max_length=20, default="")
    features: list[str] = Field(min_length=0, max_length=PRICING_MAX_FEATURES, default_factory=list)
    cta: str = Field(min_length=0, max_length=40, default="")
    badge: str | None = Field(default=None, max_length=30)

    @model_validator(mode="before")
    @classmethod
    def _from_legacy_featured(cls, data):
        """Backward compat for rows saved before `theme` existed.

        The first pricing shape carried `featured: bool`. Legacy rows in the
        database still have it; translating on the way in means no migration
        script and no one-shot conversion job - the mapping is stable and
        deterministic. `featured=true` was visually a dark card, so it maps
        to `theme=dark`; everything else falls to the default `light`.
        """
        if not isinstance(data, dict) or "theme" in data:
            return data
        featured = data.get("featured")
        if featured is True:
            data["theme"] = "dark"
        # `featured` field is ignored otherwise; the Literal above enforces
        # the new vocabulary and the old flag is not re-emitted.
        data.pop("featured", None)
        return data

    @model_validator(mode="after")
    def _enabled_requires_content(self) -> "Plan":
        """A card the admin chose to ship must actually be renderable.

        The frontend already blocks the obvious cases (empty name, empty
        cta), but the API is the security boundary and the check runs here
        too. A "featureless" enabled plan is allowed - a plan can legitimately
        say "one price, no bullets" - but a nameless or priceless one is not.
        """
        if not self.enabled:
            return self
        missing = [
            field for field in ("name", "desc", "price", "per", "cta")
            if not getattr(self, field).strip()
        ]
        if missing:
            raise ValueError(
                f"Plan '{self.id}' is enabled but missing: {', '.join(missing)}. "
                "Fill these fields or disable the card before publishing."
            )
        empty_features = [i for i, f in enumerate(self.features) if not f.strip()]
        if empty_features:
            raise ValueError(
                f"Plan '{self.id}' has empty feature(s) at position "
                f"{empty_features}. Fill them or remove them before publishing."
            )
        return self


class StripeTestRequest(BaseModel):
    """`confirm_live` is the operator saying "yes, charge a real card".

    A separate field rather than a flag on the button, so the live path cannot
    be reached by a stray click or by a page that forgot which mode it is in:
    the request itself has to say it. Absent means test mode only.
    """

    confirm_live: bool = False


class CiRunRequest(BaseModel):
    run_id: int = Field(gt=0)


class PricingRequest(BaseModel):
    """The list saved by the admin as a whole - no partial edits.

    Sent as one write rather than per-plan endpoints because the sort order
    IS the array order (index 0 is the leftmost card on the landing). A
    per-plan endpoint would need a separate 'move up / move down' route or
    an explicit `position` field, both of which are extra surface for a
    setting an operator touches once a month at most.
    """

    plans: list[Plan] = Field(max_length=PRICING_MAX_PLANS)


@router.get("/overview")
def overview(request: Request) -> dict:
    """The dashboard: users, credits, today's usage, spend. One statement."""
    require_admin(request)
    data = db.admin_overview()
    data["settings"] = _settings()
    return data


@router.get("/reports")
def reports(request: Request, months: int = 12, limit: int = 100) -> dict:
    """Spend and usage, for a month end or a year end.

    Separate from `/overview`, which answers "what is happening today". This
    answers "what has this cost us, and who spent it" - a different question
    with a different time axis, and the numbers behind a budget rather than
    behind a dashboard.

    THREE STATEMENTS, not one, and that is deliberate. The house rule is one
    statement per endpoint because the database is ~150 ms away, and it is the
    right rule for a page a customer waits on. Nobody is waiting on this one:
    it is an admin screen opened once a month, and folding a per-month roll-up,
    a per-account roll-up and an all-time total into one query would produce
    exactly the kind of statement this codebase has been burned by three times.

    ADMIN_EMAILS travels INTO the query. There is no `is_admin` column on
    `usage_event` - the flag only suppresses the ledger row - and admin is an
    environment variable rather than a row, so the database cannot answer
    "was this an admin's dollar" on its own. Passing the list keeps the
    report's definition of an admin identical to the gate's.
    """
    require_admin(request)
    months = max(1, min(int(months), 60))
    limit = max(1, min(int(limit), 500))
    return {
        "months": db.admin_usage_by_month(months=months, admin_emails=ADMIN_EMAILS),
        "users": db.admin_usage_by_user(limit=limit, admin_emails=ADMIN_EMAILS),
        "totals": db.admin_usage_totals(admin_emails=ADMIN_EMAILS),
        "window_months": months,
    }


@router.get("/users")
def users(
    request: Request,
    q: str = "",
    status: str = "",
    limit: int = 50,
    offset: int = 0,
) -> dict:
    """The user list, with balance and attributed spend per row."""
    require_admin(request)
    if status not in ("", gate.STATUS_ACTIVE, gate.STATUS_SUSPENDED):
        raise HTTPException(400, {"code": "badRequest"})
    rows = db.admin_users(
        q=q.strip()[:200],
        status=status,
        limit=max(1, min(200, limit)),
        offset=max(0, offset),
    )
    return {"users": rows, "limit": limit, "offset": offset}


@router.get("/user/{user_id}")
def user_detail(request: Request, user_id: int) -> dict:
    """Profile, ledger, usage and crawls - one statement via json_agg."""
    require_admin(request)
    found = db.admin_user_detail(user_id)
    if not found:
        raise HTTPException(404, {"code": "notFound"})
    # Derived, never stored: whether this person is an admin is a fact about the
    # environment variable, not about the row.
    found["is_admin"] = gate.is_admin(found.get("email"), ADMIN_EMAILS)
    return found


@router.post("/user/{user_id}/credits")
def credit_user(request: Request, user_id: int, payload: CreditRequest) -> dict:
    """Grant or revoke credits. Writes a ledger row and an audit row together."""
    who = require_admin(request)
    if payload.delta == 0:
        raise HTTPException(400, {"code": "badRequest"})
    if abs(payload.delta) > CREDIT_DELTA_MAX:
        raise HTTPException(400, {"code": "tooLarge"})
    if not db.admin_user_detail(user_id):
        raise HTTPException(404, {"code": "notFound"})
    balance = db.admin_credit(
        user_id=user_id, delta=payload.delta, note=payload.note, actor=who.email or ""
    )
    return {"user_id": user_id, "balance": balance, "delta": payload.delta}


@router.post("/user/{user_id}/status")
def set_status(request: Request, user_id: int, payload: StatusRequest) -> dict:
    """Suspend or reactivate.

    Takes effect on the user's very next request: the spending gate re-reads
    `status` every time rather than trusting what the token said when it was
    issued. No sign-out is needed and none is performed - a suspended user
    stays signed in and simply cannot spend, which is easier to explain than a
    session that silently disappeared.
    """
    who = require_admin(request)
    detail = db.admin_user_detail(user_id)
    if not detail:
        raise HTTPException(404, {"code": "notFound"})
    # `admin_set_status` refuses an erased row anyway, but silently: it would
    # return `changed: false` and leave the operator guessing whether the click
    # missed. Un-erasing is not a status change - it happens when the person
    # proves the mailbox again - so say so.
    if detail.get("status") == gate.STATUS_ERASED:
        raise HTTPException(409, {"code": "erasedAccount"})
    changed = db.admin_set_status(
        user_id=user_id, status=payload.status, actor=who.email or ""
    )
    return {"user_id": user_id, "status": payload.status, "changed": changed}


class EraseRequest(BaseModel):
    """Why. Written to the audit, so it is a note from an operator - never
    anything a customer typed: nothing redacts `admin_action.detail`, so a name
    recorded here would outlive the erasure meant to remove it."""

    reason: str = Field(default="", max_length=200)


@router.post("/user/{user_id}/erase")
def erase_user(request: Request, user_id: int, payload: EraseRequest) -> dict:
    """Erase an account on the person's behalf. Irreversible from here.

    The Privacy Policy offers two routes - do it yourself, or ask support - and
    this is the second one. Same `db.user_erase` as the self-service endpoint,
    so there is one definition of what erasure means; the only difference is
    `actor`, which is this admin's address rather than the account's own, and
    which is what makes the audit row say `erase` instead of `erase_self`.

    NOT reachable through the suspend/reactivate toggle, deliberately: that one
    is reversible and this one is not, and a control that does both is a
    control somebody eventually misreads.
    """
    who = require_admin(request)
    if not db.admin_user_detail(user_id):
        raise HTTPException(404, {"code": "notFound"})
    result = db.user_erase(
        user_id=user_id, actor=who.email or "", reason=payload.reason
    )
    if result is None:
        raise HTTPException(404, {"code": "notFound"})
    return result


@router.post("/user/{user_id}/revoke-tokens")
def revoke_tokens(request: Request, user_id: int) -> dict:
    """Sign this user out everywhere, by bumping their token epoch.

    The only revocation there is, since there is no session table. Every token
    already issued carries the epoch it was signed under and stops verifying the
    moment the row moves past it.
    """
    who = require_admin(request)
    if not db.admin_user_detail(user_id):
        raise HTTPException(404, {"code": "notFound"})
    epoch = db.admin_revoke_tokens(user_id=user_id, actor=who.email or "")
    return {"user_id": user_id, "token_epoch": epoch}


@router.get("/settings")
def get_settings(request: Request) -> dict:
    require_admin(request)
    return _settings()


@router.post("/settings")
def put_settings(request: Request, payload: SettingsRequest) -> dict:
    """Change a runtime setting. Append-only: the old value stays on the record.

    Note that 0 is a real, wanted value for the anonymous limit - it means "no
    free searches at all" - so these must be `is not None` checks rather than
    truthiness.
    """
    who = require_admin(request)
    actor = who.email or ""
    if payload.anonymous_daily_searches is not None:
        value = payload.anonymous_daily_searches
        if not 0 <= value <= ANON_DAILY_MAX:
            raise HTTPException(400, {"code": "outOfRange"})
        db.setting_put(key=gate.SETTING_ANON_DAILY, value=str(value), actor=actor)
    if payload.signup_credits is not None:
        value = payload.signup_credits
        if not 0 <= value <= SIGNUP_CREDITS_MAX:
            raise HTTPException(400, {"code": "outOfRange"})
        db.setting_put(key=gate.SETTING_SIGNUP_CREDITS, value=str(value), actor=actor)
    return _settings()


@router.get("/pricing")
def get_pricing(request: Request) -> dict:
    """The current pricing plans, for the admin editor.

    Reads the same setting the public `GET /api/pricing` reads, and returns
    the SAME shape. Where the two diverge is in what they do with bad data:
    the public endpoint silently returns [], the admin endpoint returns
    what is stored verbatim - a syntax error the admin needs to see is not
    made invisible by our fallback.
    """
    require_admin(request)
    rows = db.settings_all()
    raw = rows.get(gate.SETTING_PRICING_PLANS, "").strip()
    if not raw:
        return {"plans": []}
    try:
        plans = json.loads(raw)
    except json.JSONDecodeError as exc:
        # An earlier admin saved something the schema now rejects. Surface it -
        # do not paper over it with []; the operator needs to see the syntax
        # error to fix it.
        raise HTTPException(500, {
            "code": "corruptSetting",
            "detail": f"pricing_plans is not valid JSON: {exc.msg}",
        }) from exc
    return {"plans": plans}


@router.post("/pricing")
def put_pricing(request: Request, payload: PricingRequest) -> dict:
    """Save the pricing plans. Append-only, per `app_setting`'s history rule.

    Duplicate `id`s are refused - the frontend renders a list keyed by id and
    two rows with the same key silently swallow one of them. Better to fail
    with a message than to save something that reads correctly to the API
    and wrong to the browser.

    The saved value is the JSON serialisation of the validated model. Pydantic
    already normalised the input by the time it lands here (trimmed nothing
    silently - `min_length=1` fails an all-spaces value at the door), so what
    hits the database is what a future GET will hand back, byte for byte.
    """
    who = require_admin(request)
    ids = [p.id for p in payload.plans]
    if len(ids) != len(set(ids)):
        raise HTTPException(400, {
            "code": "duplicateId",
            "detail": "Two plans share the same id. Ids must be unique.",
        })
    value = json.dumps([p.model_dump() for p in payload.plans], ensure_ascii=False)
    db.setting_put(
        key=gate.SETTING_PRICING_PLANS,
        value=value,
        actor=who.email or "",
    )
    return {"plans": [p.model_dump() for p in payload.plans]}


@router.get("/actions")
def actions(request: Request, limit: int = 100) -> dict:
    """The audit log. Append-only, and the reason admin mistakes are visible."""
    require_admin(request)
    return {"actions": db.admin_actions(limit=max(1, min(500, limit)))}


@router.get("/ci")
def ci_overview(request: Request) -> dict:
    """Recent CI runs on the deployed branch, with per-job results.

    Always 200. A GitHub outage, a spent rate limit or a refused token comes
    back as `error` beside the last good data - the admin API client turns any
    non-200 into a redirect to an error page, and "GitHub is slow right now"
    does not deserve to take the whole screen.
    """
    require_admin(request)
    return ci.overview()


def _ci_trigger(request: Request, action: str, detail: dict, call) -> dict:
    """Shared by the three buttons: gate, token check, audit, call."""
    who = require_admin(request)
    if not ci.can_trigger():
        return {"ok": False, "error": "noToken"}
    db.admin_log(actor=who.email or "", action=action, detail=detail)
    try:
        call()
    except ci.GitHubError as exc:
        print(f"[ci] {action} {detail} failed: {exc}", flush=True)
        return {"ok": False, "error": exc.code}
    return {"ok": True, "error": None}


@router.post("/ci/run")
def ci_dispatch(request: Request) -> dict:
    """Run the workflow now on the deployed branch, without a push."""
    return _ci_trigger(request, "ci_dispatch", {"branch": ci.branch()}, ci.dispatch)


@router.post("/ci/rerun")
def ci_rerun(request: Request, payload: CiRunRequest) -> dict:
    return _ci_trigger(
        request, "ci_rerun", {"run_id": payload.run_id},
        lambda: ci.rerun(payload.run_id, failed_only=False),
    )


@router.post("/ci/rerun-failed")
def ci_rerun_failed(request: Request, payload: CiRunRequest) -> dict:
    return _ci_trigger(
        request, "ci_rerun_failed", {"run_id": payload.run_id},
        lambda: ci.rerun(payload.run_id, failed_only=True),
    )


@router.post("/ci/cancel")
def ci_cancel(request: Request, payload: CiRunRequest) -> dict:
    return _ci_trigger(
        request, "ci_cancel", {"run_id": payload.run_id},
        lambda: ci.cancel(payload.run_id),
    )


@router.get("/stripe")
def stripe_status(request: Request) -> dict:
    """Are the keys there, do they work, and what has arrived so far.

    Always 200. A refused key or a Stripe outage comes back as `error` beside
    everything else that IS known, because the admin API client turns any
    non-200 into a redirect to an error page.

    No key material is returned - only the account id, the mode read from the
    key's prefix, and whether a webhook secret exists at all.
    """
    require_admin(request)
    mode = stripe.mode()
    out = {
        "mode": mode,
        "webhook_configured": bool(stripe.webhook_secret()),
        "webhook_url": f"{PUBLIC_BASE_URL}/api/stripe/webhook" if PUBLIC_BASE_URL else None,
        "test_amount_cents": stripe.TEST_AMOUNT_CENTS,
        "test_currency": stripe.TEST_CURRENCY,
        # A payment can be started in either mode; LIVE additionally requires
        # an explicit confirmation on the request, because it charges a real
        # card. The panel reads `needs_confirm` to know it must ask.
        "can_test_payment": mode in ("test", "live"),
        "needs_confirm": mode == "live",
        "account": None,
        "events": [],
        "error": None,
    }
    if mode != "missing":
        try:
            out["account"] = stripe.account()
        except stripe.StripeError as exc:
            print(f"[stripe] account: {exc}", flush=True)
            out["error"] = exc.code
    if db.available():
        try:
            out["events"] = db.payment_events(limit=25)
        except Exception as exc:  # noqa: BLE001 - the page still has a job to do
            print(f"[stripe] events: {type(exc).__name__}: {exc}", flush=True)
    return out


@router.post("/stripe/test-payment")
def stripe_test_payment(request: Request, payload: StripeTestRequest | None = None) -> dict:
    """Open a Checkout Session for the fixed amount, and return its link.

    LIVE MODE NEEDS `confirm_live`. With live keys this is not a test: a real
    card is charged and Stripe keeps its fee (on $1.00, about $0.33), so the
    money is really spent even though it lands in the operator's own account.
    The default answer stays "no" and the panel has to ask a second time before
    it can send true - one careless click must not become a charge.

    Test mode needs no confirmation: it is play money and the whole point of
    the button.
    """
    who = require_admin(request)
    payload = payload or StripeTestRequest()
    mode = stripe.mode()
    if mode == "missing":
        return {"ok": False, "error": "noKey", "url": None}
    if mode != "test" and not payload.confirm_live:
        return {"ok": False, "error": "liveNeedsConfirm", "url": None}
    if not WEB_BASE_URL:
        return {"ok": False, "error": "noReturnUrl", "url": None}

    # Audited BEFORE the call, and the mode is part of the record: "who started
    # a real charge, and when" is exactly the question this log exists for.
    db.admin_log(
        actor=who.email or "",
        action="stripe_test_payment",
        detail={"amount_cents": stripe.TEST_AMOUNT_CENTS, "mode": mode,
                "confirmed_live": bool(payload.confirm_live and mode != "test")},
    )
    try:
        session = stripe.checkout_session(
            success_url=f"{WEB_BASE_URL}/?stripe=success",
            cancel_url=f"{WEB_BASE_URL}/?stripe=cancelled",
            email=who.email,
        )
    except stripe.StripeError as exc:
        print(f"[stripe] test payment ({mode}): {exc}", flush=True)
        return {"ok": False, "error": exc.code, "url": None}
    return {"ok": True, "error": None, "url": session["url"], "id": session["id"],
            "mode": mode}


def _settings() -> dict:
    """Current settings, read through the same clamps the gate uses."""
    rows = db.settings_all()
    return {
        gate.SETTING_ANON_DAILY: gate.setting_int(
            rows,
            gate.SETTING_ANON_DAILY,
            default=gate.DEFAULT_ANON_DAILY,
            lo=0,
            hi=ANON_DAILY_MAX,
        ),
        gate.SETTING_SIGNUP_CREDITS: gate.setting_int(
            rows,
            gate.SETTING_SIGNUP_CREDITS,
            default=gate.DEFAULT_SIGNUP_CREDITS,
            lo=0,
            hi=SIGNUP_CREDITS_MAX,
        ),
    }
