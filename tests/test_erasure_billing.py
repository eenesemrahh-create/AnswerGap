"""Erasing an account ends its paid plan at Stripe first.

Before this, `db.user_erase` blanked the account and left the subscription
live at Stripe: the erased person kept being charged every month, and each
renewal granted credits to a row nobody could sign in to.

Called as plain functions with the database and Stripe stubbed, like
test_subscriptions.py. The SQL behind `subscription_mark_cancelled` is pinned
in tests/test_sql.py.
"""

from __future__ import annotations

from types import SimpleNamespace

import pytest
from fastapi import HTTPException

from answergap import db, passwords
from api import admin, auth, billing, stripe


class _Req:
    """Enough of a Request; everything that reads it is stubbed."""

    headers: dict = {}


def _sub(id_, status="active", source="stripe", stripe_id=None):
    return {"id": id_, "status": status, "source": source,
            "stripe_subscription_id": stripe_id if stripe_id is not None
            else (f"sub_{id_}" if source == "stripe" else None)}


@pytest.fixture
def wired(monkeypatch):
    state = {"rows": [_sub(1)], "stripe": [], "marked": [], "erased": [],
             "fail": None}
    monkeypatch.setattr(db, "subscriptions_for_user",
                        lambda uid, limit=20: list(state["rows"]))
    monkeypatch.setattr(stripe, "mode", lambda: "test")

    def cancel(sid, at_period_end):
        if state["fail"]:
            raise stripe.StripeError(*state["fail"])
        state["stripe"].append((sid, at_period_end))
        return {"status": "canceled", "cancel_at_period_end": False}

    monkeypatch.setattr(stripe, "cancel_subscription", cancel)
    monkeypatch.setattr(db, "subscription_mark_cancelled",
                        lambda **kw: state["marked"].append(kw))

    def erase(**kw):
        # The order is the point: by the time this runs, Stripe must already
        # have been told.
        state["erased"].append({**kw, "stripe_before": list(state["stripe"])})
        return {"already_erased": False}

    monkeypatch.setattr(db, "user_erase", erase)
    return state


# ------------------------------------------------------------ the helper


def test_a_live_paid_plan_is_cancelled_now(wired) -> None:
    assert billing.cancel_for_erasure(7, actor="a@example.com") == ["sub_1"]
    assert wired["stripe"] == [("sub_1", False)]
    assert wired["marked"][0]["at_period_end"] is False
    assert wired["marked"][0]["subscription_id"] == 1


@pytest.mark.parametrize("status", ["past_due", "trialing", "unpaid", "incomplete"])
def test_every_status_that_can_still_charge_is_cancelled(wired, status) -> None:
    wired["rows"] = [_sub(1, status=status)]
    assert billing.cancel_for_erasure(7, actor="a") == ["sub_1"]


def test_finished_and_assigned_plans_are_left_alone(wired) -> None:
    wired["rows"] = [_sub(1, status="canceled"), _sub(2, status="incomplete_expired"),
                     _sub(3, source="admin")]
    assert billing.cancel_for_erasure(7, actor="a") == []
    assert wired["stripe"] == []


def test_every_paid_plan_is_cancelled_not_just_the_newest(wired) -> None:
    wired["rows"] = [_sub(1), _sub(2)]
    assert billing.cancel_for_erasure(7, actor="a") == ["sub_1", "sub_2"]


def test_a_refused_cancellation_raises_and_marks_nothing(wired) -> None:
    wired["fail"] = ("stripeDown", 503, "")
    with pytest.raises(billing.ErasureCancelFailed):
        billing.cancel_for_erasure(7, actor="a")
    assert wired["marked"] == []


def test_a_subscription_stripe_no_longer_knows_counts_as_done(wired) -> None:
    wired["fail"] = ("invalidRequest", 404, "No such subscription")
    assert billing.cancel_for_erasure(7, actor="a") == ["sub_1"]
    assert wired["marked"]


def test_no_key_with_a_paid_plan_refuses(wired, monkeypatch) -> None:
    monkeypatch.setattr(stripe, "mode", lambda: "missing")
    with pytest.raises(billing.ErasureCancelFailed):
        billing.cancel_for_erasure(7, actor="a")


def test_no_key_and_nothing_paid_is_fine(wired, monkeypatch) -> None:
    monkeypatch.setattr(stripe, "mode", lambda: "missing")
    wired["rows"] = [_sub(3, source="admin")]
    assert billing.cancel_for_erasure(7, actor="a") == []


# ------------------------------------------------------- self-service route


@pytest.fixture
def self_service(monkeypatch, wired):
    monkeypatch.setattr(auth, "_accounts_or_503", lambda: None)
    monkeypatch.setattr(auth, "_rate_ok", lambda *a, **kw: True)
    monkeypatch.setattr(auth, "identity", lambda r: SimpleNamespace(
        signed_in=True, user_id=7, token_epoch=1))
    monkeypatch.setattr(db, "user_for_gate", lambda uid: {
        "token_epoch": 1, "email": "a@example.com"})
    monkeypatch.setattr(db, "user_by_email", lambda e: {"password_hash": "h"})
    monkeypatch.setattr(passwords, "verify_password", lambda p, h: True)
    monkeypatch.setattr(auth.mailer, "render", lambda *a, **kw: ("s", "t", "h"))
    monkeypatch.setattr(auth.mailer, "send", lambda **kw: None)
    return wired


def test_self_erasure_cancels_at_stripe_before_erasing(self_service) -> None:
    auth.erase_account(_Req(), auth.EraseRequest(confirm="pw"))
    assert self_service["erased"][0]["stripe_before"] == [("sub_1", False)]


def test_self_erasure_stops_when_stripe_refuses(self_service) -> None:
    self_service["fail"] = ("stripeDown", 503, "")
    with pytest.raises(HTTPException) as e:
        auth.erase_account(_Req(), auth.EraseRequest(confirm="pw"))
    assert e.value.status_code == 502
    assert e.value.detail["code"] == "subscriptionCancelFailed"
    assert self_service["erased"] == []


def test_a_wrong_password_cancels_nothing(self_service, monkeypatch) -> None:
    monkeypatch.setattr(passwords, "verify_password", lambda p, h: False)
    with pytest.raises(HTTPException):
        auth.erase_account(_Req(), auth.EraseRequest(confirm="nope"))
    assert self_service["stripe"] == []


# --------------------------------------------------------------- admin route


@pytest.fixture
def by_admin(monkeypatch, wired):
    monkeypatch.setattr(admin, "require_admin",
                        lambda request: SimpleNamespace(email="op@example.com"))
    monkeypatch.setattr(db, "admin_user_detail", lambda uid: {"id": uid})
    return wired


def test_admin_erasure_cancels_at_stripe_before_erasing(by_admin) -> None:
    admin.erase_user(_Req(), 7, admin.EraseRequest())
    assert by_admin["erased"][0]["stripe_before"] == [("sub_1", False)]
    assert by_admin["marked"][0]["actor"] == "op@example.com"


def test_admin_erasure_stops_when_stripe_refuses(by_admin) -> None:
    by_admin["fail"] = ("keyRefused", 401, "")
    with pytest.raises(HTTPException) as e:
        admin.erase_user(_Req(), 7, admin.EraseRequest())
    assert e.value.detail["code"] == "subscriptionCancelFailed"
    assert by_admin["erased"] == []
