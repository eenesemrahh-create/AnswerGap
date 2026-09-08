"""The HTTP half of sign-in: headers in, identity out, and who gets refused.

`answergap/gate.py` is tested on its own and knows nothing about requests. This
file covers the thin layer above it in `api/auth.py` - the part that reads
headers and turns a refusal into a status code - because that layer is where a
mistake would be invisible to a pure test and still hand someone an admin panel.

No network and no database: `Request` is stubbed down to the only thing
`identity` uses (`.headers`), and the two db calls `require_admin` makes are
monkeypatched. That is possible precisely because the module reads headers
rather than querying on the identity path.
"""

from __future__ import annotations

import time

import pytest
from fastapi import HTTPException

from answergap import gate, tokens
from api import auth

SECRET = "test-secret"


class FakeRequest:
    """Everything `identity` touches, and nothing else."""

    def __init__(self, headers: dict[str, str] | None = None) -> None:
        self.headers = {k.lower(): v for k, v in (headers or {}).items()}


@pytest.fixture
def signed_in(monkeypatch):
    """Accounts on, one admin configured, and a row that agrees with the token."""
    monkeypatch.setattr(auth, "SESSION_SECRET", SECRET)
    monkeypatch.setattr(auth, "ADMIN_EMAILS", gate.parse_admin_emails("boss@x.com"))
    monkeypatch.setattr(auth, "accounts_enabled", lambda: True)

    def _row(user_id: int):
        return {
            "id": user_id,
            "email": "boss@x.com",
            "status": gate.STATUS_ACTIVE,
            "token_epoch": 1,
            "balance": 5,
        }

    monkeypatch.setattr(auth.db, "user_for_gate", _row)
    return _row


def _bearer(email: str = "boss@x.com", uid: int = 1, epoch: int = 1) -> dict[str, str]:
    token = tokens.sign({"uid": uid, "em": email, "ep": epoch}, SECRET, now=int(time.time()))
    return {"Authorization": f"Bearer {token}"}


# ----------------------------------------------------------------- identity


def test_no_headers_is_an_anonymous_visitor(monkeypatch) -> None:
    monkeypatch.setattr(auth, "SESSION_SECRET", SECRET)
    who = auth.identity(FakeRequest())
    assert not who.signed_in
    assert not who.is_admin
    assert auth.role_of(who) == "anonymous"


def test_the_anonymous_id_comes_from_a_header_not_a_cookie(monkeypatch) -> None:
    """api and web are separate sites, so a cookie set here would never return.

    The browser generates the id and sends it as a header; this pins the header
    name, which is the contract with web/lib/api.ts.
    """
    monkeypatch.setattr(auth, "SESSION_SECRET", SECRET)
    who = auth.identity(FakeRequest({"X-AG-Anon": "browser-1"}))
    assert who.anon_id == "browser-1"


def test_the_anonymous_id_is_length_capped(monkeypatch) -> None:
    """It is attacker-controlled text that becomes a database key."""
    monkeypatch.setattr(auth, "SESSION_SECRET", SECRET)
    who = auth.identity(FakeRequest({"X-AG-Anon": "x" * 500}))
    assert len(who.anon_id) == 64


def test_a_garbage_token_is_anonymous_not_an_error(monkeypatch) -> None:
    """A junk Authorization header must not 500 - it just is not a session."""
    monkeypatch.setattr(auth, "SESSION_SECRET", SECRET)
    who = auth.identity(FakeRequest({"Authorization": "Bearer not-a-token"}))
    assert not who.signed_in


def test_a_valid_token_carries_its_epoch(monkeypatch) -> None:
    """The epoch has to survive into Identity or revocation cannot be checked."""
    monkeypatch.setattr(auth, "SESSION_SECRET", SECRET)
    monkeypatch.setattr(auth, "ADMIN_EMAILS", frozenset())
    who = auth.identity(FakeRequest(_bearer(uid=9, epoch=4)))
    assert who.user_id == 9
    assert who.token_epoch == 4


def test_the_role_is_derived_from_the_allowlist_without_a_query(monkeypatch) -> None:
    """/api/meta is the Railway healthcheck; identity must not touch the database.

    If this ever starts querying, a Postgres blip becomes a failed healthcheck
    and a restart loop. The monkeypatch below makes any query an immediate test
    failure rather than a slow surprise in production.
    """
    monkeypatch.setattr(auth, "SESSION_SECRET", SECRET)
    monkeypatch.setattr(auth, "ADMIN_EMAILS", gate.parse_admin_emails("boss@x.com"))

    def _explode(*_a, **_k):  # pragma: no cover - only runs if the rule breaks
        raise AssertionError("identity() must not query the database")

    monkeypatch.setattr(auth.db, "user_for_gate", _explode)
    assert auth.role_of(auth.identity(FakeRequest(_bearer()))) == "admin"
    assert auth.role_of(auth.identity(FakeRequest(_bearer("someone@else.com")))) == "user"


# -------------------------------------------------------------- require_admin


def test_admin_is_refused_when_the_allowlist_is_empty(monkeypatch, signed_in) -> None:
    """THE test. ADMIN_EMAILS unset must lock the panel, not open it.

    403 rather than 503: accounts ARE configured here, so the refusal is about
    this person, not about the deployment.
    """
    monkeypatch.setattr(auth, "ADMIN_EMAILS", frozenset())
    with pytest.raises(HTTPException) as e:
        auth.require_admin(FakeRequest(_bearer()))
    assert e.value.status_code == 403


def test_a_signed_in_non_admin_is_refused(monkeypatch, signed_in) -> None:
    monkeypatch.setattr(auth.db, "user_for_gate", lambda _id: {
        "email": "someone@else.com", "status": "active", "token_epoch": 1, "balance": 0,
    })
    with pytest.raises(HTTPException) as e:
        auth.require_admin(FakeRequest(_bearer("someone@else.com")))
    assert e.value.status_code == 403


def test_an_admin_passes(signed_in) -> None:
    who = auth.require_admin(FakeRequest(_bearer()))
    assert who.is_admin


def test_a_revoked_token_is_refused_even_for_an_admin(monkeypatch, signed_in) -> None:
    """"Sign out everywhere" has to actually sign the admin out.

    The token still verifies - its signature is perfect and it has not expired -
    but the row has moved past its epoch, and that is the only revocation there
    is without a session table.
    """
    monkeypatch.setattr(auth.db, "user_for_gate", lambda _id: {
        "email": "boss@x.com", "status": "active", "token_epoch": 2, "balance": 0,
    })
    with pytest.raises(HTTPException) as e:
        auth.require_admin(FakeRequest(_bearer(epoch=1)))
    assert e.value.status_code == 401


def test_a_suspended_admin_is_refused(monkeypatch, signed_in) -> None:
    monkeypatch.setattr(auth.db, "user_for_gate", lambda _id: {
        "email": "boss@x.com", "status": "suspended", "token_epoch": 1, "balance": 0,
    })
    with pytest.raises(HTTPException) as e:
        auth.require_admin(FakeRequest(_bearer()))
    assert e.value.status_code == 403


def test_an_address_that_changed_at_google_loses_admin(monkeypatch, signed_in) -> None:
    """The ROW's address is authoritative, not the one baked into the token.

    A token is valid for two weeks. If the address on the account changes in
    that window, an old token still carries the old claim - so require_admin
    re-checks against what the row says now.
    """
    monkeypatch.setattr(auth.db, "user_for_gate", lambda _id: {
        "email": "moved@elsewhere.com", "status": "active", "token_epoch": 1, "balance": 0,
    })
    with pytest.raises(HTTPException) as e:
        auth.require_admin(FakeRequest(_bearer("boss@x.com")))
    assert e.value.status_code == 403


def test_admin_is_refused_when_accounts_are_off(monkeypatch) -> None:
    """No SESSION_SECRET or no database means there is no admin to be."""
    monkeypatch.setattr(auth, "accounts_enabled", lambda: False)
    with pytest.raises(HTTPException) as e:
        auth.require_admin(FakeRequest(_bearer()))
    assert e.value.status_code == 503


# --------------------------------------------------------------- the gate


def test_the_gate_allows_everything_when_accounts_are_off(monkeypatch) -> None:
    """A laptop with no Postgres must behave exactly as it did before."""
    monkeypatch.setattr(auth, "accounts_enabled", lambda: False)
    decision = auth.check(gate.Identity(), action="batch", units=10)
    assert decision.allowed


def test_a_refusal_is_recorded_before_it_is_raised(monkeypatch, signed_in) -> None:
    """Refusals are data. "How often do we turn people away, and why" cannot be
    answered later from rows that were never written."""
    monkeypatch.setattr(auth.db, "user_for_gate", lambda _id: {
        "email": "u@x.com", "status": "active", "token_epoch": 1, "balance": 0,
    })
    written: list[dict] = []
    monkeypatch.setattr(auth.db, "record_usage", lambda **kw: written.append(kw))

    who = auth.identity(FakeRequest(_bearer("u@x.com")))
    with pytest.raises(HTTPException) as e:
        auth.check(who, action="search", units=1)

    assert e.value.status_code == 402
    # The refusal carries the numbers behind it. Only ever facts about the
    # person asking - their own balance - so it reveals nothing they could not
    # count themselves, and it is what lets the UI say WHY rather than just no.
    assert e.value.detail == {"code": "noCredits", "balance": 0, "needed": 1}
    assert written and written[0]["outcome"] == gate.REFUSED_NO_CREDITS
    assert written[0]["credits"] == 0


def test_an_admin_spends_without_a_ledger_row(monkeypatch, signed_in) -> None:
    """Admin dollars stay attributed; admin credits are not invented."""
    written: list[dict] = []
    monkeypatch.setattr(auth.db, "record_usage", lambda **kw: written.append(kw))

    who = auth.identity(FakeRequest(_bearer()))
    auth.record(who, action="search", billable_calls=1, spend=0.0026, tree_slug="t")

    assert written[0]["is_admin"] is True
    assert written[0]["spend_usd"] == 0.0026


def test_a_cache_hit_charges_no_credit(monkeypatch, signed_in) -> None:
    """CLAUDE.md: cached results are free. Zero billable calls, zero credits."""
    written: list[dict] = []
    monkeypatch.setattr(auth.db, "record_usage", lambda **kw: written.append(kw))

    auth.record(gate.Identity(user_id=1), action="search", billable_calls=0, spend=0.0)
    assert written[0]["credits"] == 0


def test_a_lost_receipt_does_not_lose_the_users_result(monkeypatch, signed_in) -> None:
    """The money is already spent upstream by the time record() runs.

    Losing the receipt is bad; throwing away the answer the user just paid for
    on top of it is worse. Node-level fault tolerance is a standing rule.
    """
    def _explode(**_kw):
        raise RuntimeError("database gone")

    monkeypatch.setattr(auth.db, "record_usage", _explode)
    auth.record(gate.Identity(user_id=1), action="search", billable_calls=1, spend=0.01)
