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

from fastapi import APIRouter, HTTPException, Request
from pydantic import BaseModel, Field

from answergap import db, gate

from .auth import ADMIN_EMAILS, require_admin

router = APIRouter(prefix="/api/admin")

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


@router.get("/overview")
def overview(request: Request) -> dict:
    """The dashboard: users, credits, today's usage, spend. One statement."""
    require_admin(request)
    data = db.admin_overview()
    data["settings"] = _settings()
    return data


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
    if not db.admin_user_detail(user_id):
        raise HTTPException(404, {"code": "notFound"})
    changed = db.admin_set_status(
        user_id=user_id, status=payload.status, actor=who.email or ""
    )
    return {"user_id": user_id, "status": payload.status, "changed": changed}


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


@router.get("/actions")
def actions(request: Request, limit: int = 100) -> dict:
    """The audit log. Append-only, and the reason admin mistakes are visible."""
    require_admin(request)
    return {"actions": db.admin_actions(limit=max(1, min(500, limit)))}


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
