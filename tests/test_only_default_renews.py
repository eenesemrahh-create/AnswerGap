"""Only the default plan renews (operator, 2026-10-19).

A plan bought beside a renewing default is set to stop at the end of its
first period; with nothing renewing beside it, it becomes the default. The
person keeps a second plan renewing by making it the default.
"""

from __future__ import annotations

import pytest

from answergap import db
from api import billing


def _row(id_, sid, *, default=False, ending=False, source="stripe", created="2026-10-01"):
    return {"id": id_, "stripe_subscription_id": sid if source == "stripe" else None,
            "plan_id": f"plan{id_}", "source": source, "is_default": default,
            "cancel_at_period_end": ending, "created_at": created, "status": "active"}


@pytest.fixture
def account(monkeypatch):
    state = {"live": [], "stopped": [], "ending": [], "default": [], "log": [], "fail": False}
    monkeypatch.setattr(db, "live_subscriptions", lambda uid: state["live"])

    def cancel(sid, at_period_end):
        if state["fail"]:
            raise billing.stripe.StripeError("stripeDown", 503, "")
        state["stopped"].append((sid, at_period_end))
        return {}

    monkeypatch.setattr(billing.stripe, "cancel_subscription", cancel)
    monkeypatch.setattr(db, "subscription_mark_ending",
                        lambda **kw: state["ending"].append(kw["subscription_id"]))
    monkeypatch.setattr(db, "subscription_set_default",
                        lambda **kw: state["default"].append(kw["subscription_id"]))
    monkeypatch.setattr(db, "account_event_put", lambda **kw: state["log"].append(kw["kind"]))
    return state


def test_a_plan_bought_beside_the_default_stops_at_period_end(account) -> None:
    account["live"] = [_row(1, "sub_old", default=True), _row(2, "sub_new")]
    assert billing._settle_new_plan(7, "sub_new") == "extra plan, stops at period end"
    assert account["stopped"] == [("sub_new", True)]          # at period end, not now
    assert account["ending"] == [2] and account["default"] == []
    assert account["log"] == ["extra_plan_not_renewing"]


def test_the_first_paid_plan_becomes_the_default(account) -> None:
    account["live"] = [_row(1, "sub_new")]
    assert billing._settle_new_plan(7, "sub_new") == "made default"
    assert account["default"] == [1] and account["stopped"] == []


def test_with_no_default_the_oldest_renewing_plan_is_kept(account) -> None:
    """An account from before defaults: buying a second plan must not stop
    the one the person already had."""
    account["live"] = [_row(1, "sub_old", created="2026-09-01"), _row(2, "sub_new", created="2026-10-18")]
    billing._settle_new_plan(7, "sub_new")
    assert account["default"] == [1]
    assert account["stopped"] == [("sub_new", True)]


def test_an_ending_default_does_not_hold_the_new_plan_back(account) -> None:
    account["live"] = [_row(1, "sub_old", default=True, ending=True), _row(2, "sub_new")]
    assert billing._settle_new_plan(7, "sub_new") == "made default"
    assert account["stopped"] == []


def test_an_assigned_plan_does_not_count_as_renewing(account) -> None:
    account["live"] = [_row(1, None, source="admin", default=True), _row(2, "sub_new")]
    assert billing._settle_new_plan(7, "sub_new") == "made default"


def test_the_second_event_does_nothing(account) -> None:
    account["live"] = [_row(1, "sub_old", default=True), _row(2, "sub_new", ending=True)]
    assert billing._settle_new_plan(7, "sub_new") is None
    account["live"] = [_row(2, "sub_new", default=True)]
    assert billing._settle_new_plan(7, "sub_new") is None
    assert account["stopped"] == [] and account["default"] == []


def test_a_stripe_refusal_leaves_it_renewing_and_logs(account) -> None:
    account["live"] = [_row(1, "sub_old", default=True), _row(2, "sub_new")]
    account["fail"] = True
    assert "still renewing" in billing._settle_new_plan(7, "sub_new")
    assert account["ending"] == [] and account["log"] == ["extra_plan_stop_failed"]


def test_a_subscription_not_yet_running_is_left_for_the_next_event(account) -> None:
    account["live"] = [_row(1, "sub_old", default=True)]       # new one still incomplete
    assert billing._settle_new_plan(7, "sub_new") is None


def test_the_webhook_runs_it_on_creation_and_on_the_first_invoice(monkeypatch) -> None:
    calls = []
    monkeypatch.setattr(billing, "_settle_new_plan", lambda uid, sid: calls.append(sid) or None)
    monkeypatch.setattr(billing, "resolve_stripe_user", lambda ev: 7)
    for name in ("stripe_customer_attach", "subscription_upsert", "subscription_cancelled_by_admin"):
        monkeypatch.setattr(db, name, lambda **kw: None)
    monkeypatch.setattr(db, "subscription_by_stripe_id", lambda sid: None)
    monkeypatch.setattr(db, "subscription_credit", lambda **kw: True)
    monkeypatch.setattr(billing, "plan_for_price", lambda pid: None)
    monkeypatch.setattr(billing, "plan_credits", lambda pid, card=None: 100)

    def event(kind, **found):
        monkeypatch.setattr(billing.stripe, "subscription_from_event",
                            lambda ev: {"subscription_id": "sub_new", "status": "active",
                                        "invoice_id": "in_1", **found})
        return billing.apply_subscription_event({"type": kind, "id": "evt", "livemode": False})

    event("customer.subscription.created")
    event("invoice.paid", billing_reason="subscription_create", amount_paid=1000)
    event("invoice.paid", billing_reason="subscription_cycle", amount_paid=1000)
    event("customer.subscription.updated")
    assert calls == ["sub_new", "sub_new"]                     # not on renewals or updates


def test_a_failure_while_settling_never_costs_the_grant(monkeypatch) -> None:
    def boom(uid, sid):
        raise RuntimeError("db down")
    monkeypatch.setattr(billing, "_settle_new_plan", boom)
    monkeypatch.setattr(billing, "resolve_stripe_user", lambda ev: 7)
    for name in ("stripe_customer_attach", "subscription_upsert", "subscription_cancelled_by_admin"):
        monkeypatch.setattr(db, name, lambda **kw: None)
    monkeypatch.setattr(db, "subscription_by_stripe_id", lambda sid: None)
    monkeypatch.setattr(db, "subscription_credit", lambda **kw: True)
    monkeypatch.setattr(billing, "plan_for_price", lambda pid: None)
    monkeypatch.setattr(billing, "plan_credits", lambda pid, card=None: 100)
    monkeypatch.setattr(billing.stripe, "subscription_from_event", lambda ev: {
        "subscription_id": "sub_new", "status": "active", "invoice_id": "in_1",
        "billing_reason": "subscription_create", "amount_paid": 1000})
    assert billing.apply_subscription_event(
        {"type": "invoice.paid", "id": "evt", "livemode": False}) == "granted 100"
