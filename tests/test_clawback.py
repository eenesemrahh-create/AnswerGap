"""When an admin ends a plan, the rest of this period's credits go with it.

The operator's rule (2026-10-17). These pin WHEN the clawback runs:

- cancel "now" from the admin            -> immediately
- cancel "at period end" from the admin  -> when Stripe's deletion arrives
- revoke an assigned plan                -> immediately
- the customer cancels in the portal     -> never
- erasure cancels the plan               -> never (revival keeps the balance)

HOW MUCH is SQL and is pinned in tests/test_sql.py (CI only).
"""

from __future__ import annotations

from tests.test_subscriptions import (  # noqa: F401 - fixtures
    _Req, _subscription_event, admin_wired, cancel_wired, wired,
)
from answergap import db
from api import admin, billing


# ---------------------------------------------------------------- admin acts


def test_cancelling_now_takes_the_credits_now(cancel_wired) -> None:
    out = admin.cancel_subscription(_Req(), 7, 5, admin.CancelSubscriptionRequest())
    assert cancel_wired["clawbacks"] == [
        {"user_id": 7, "subscription_id": 5, "actor": "op@example.com"}
    ]
    assert out["clawed_back"] == 180
    assert cancel_wired["marked"][0]["clawback"] is True


def test_cancelling_at_period_end_waits_for_the_end(cancel_wired) -> None:
    out = admin.cancel_subscription(
        _Req(), 7, 5, admin.CancelSubscriptionRequest(when="period_end")
    )
    assert cancel_wired["clawbacks"] == []
    assert out["clawed_back"] is None
    # Marked, so the deletion webhook knows to take them then.
    assert cancel_wired["marked"][0]["clawback"] is True


def test_a_failed_clawback_never_undoes_the_cancellation(monkeypatch, cancel_wired) -> None:
    def boom(**kw):
        raise RuntimeError("database away")

    monkeypatch.setattr(db, "subscription_clawback", boom)
    out = admin.cancel_subscription(_Req(), 7, 5, admin.CancelSubscriptionRequest())
    assert out["cancelled"] is True
    assert out["clawed_back"] is None


def test_revoking_an_assigned_plan_takes_its_credits(admin_wired) -> None:
    out = admin.revoke_plan(_Req(), 7, 12)
    assert admin_wired["clawbacks"] == [
        {"user_id": 7, "subscription_id": 12, "actor": "op@example.com"}
    ]
    assert out["clawed_back"] == 40


def test_a_revoke_that_changed_nothing_takes_nothing(monkeypatch, admin_wired) -> None:
    monkeypatch.setattr(db, "subscription_revoke_assigned", lambda **kw: False)
    out = admin.revoke_plan(_Req(), 7, 12)
    assert admin_wired["clawbacks"] == []
    assert out["clawed_back"] == 0


# ------------------------------------------------------------- the webhook


def _deleted():
    return _subscription_event(kind="customer.subscription.deleted")


def test_the_end_of_an_admin_period_end_cancel_takes_the_rest(wired) -> None:
    wired["admin_cancel"] = {"id": 5, "user_id": 7, "actor": "op@example.com"}
    assert billing.apply_subscription_event(_deleted()) == "status canceled, clawed back 120"
    assert wired["clawbacks"] == [
        {"user_id": 7, "subscription_id": 5, "actor": "op@example.com"}
    ]


def test_a_customer_cancelling_in_the_portal_keeps_the_credits(wired) -> None:
    assert billing.apply_subscription_event(_deleted()) == "status canceled"
    assert wired["clawbacks"] == []


def test_nothing_left_to_take_reads_as_a_plain_cancellation(monkeypatch, wired) -> None:
    wired["admin_cancel"] = {"id": 5, "user_id": 7, "actor": "op"}
    monkeypatch.setattr(db, "subscription_clawback", lambda **kw: 0)
    assert billing.apply_subscription_event(_deleted()) == "status canceled"


def test_only_a_deletion_can_take_credits(wired) -> None:
    wired["admin_cancel"] = {"id": 5, "user_id": 7, "actor": "op"}
    billing.apply_subscription_event(_subscription_event(cancel_at_period_end=True))
    assert wired["clawbacks"] == []


def test_erasure_cancels_without_marking_a_clawback(monkeypatch) -> None:
    marked = []
    monkeypatch.setattr(db, "subscriptions_for_user", lambda uid, limit=20: [
        {"id": 1, "status": "active", "source": "stripe",
         "stripe_subscription_id": "sub_1"}])
    monkeypatch.setattr(billing.stripe, "mode", lambda: "test")
    monkeypatch.setattr(billing.stripe, "cancel_subscription",
                        lambda sid, at_period_end: {"status": "canceled"})
    monkeypatch.setattr(db, "subscription_mark_cancelled", lambda **kw: marked.append(kw))
    billing.cancel_for_erasure(7, actor="a@example.com")
    assert marked[0].get("clawback", False) is False
