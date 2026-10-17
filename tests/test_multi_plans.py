"""Several plans at once, and choosing which to keep (operator, 2026-10-17).

- A different plan may be bought beside a running one; the same plan twice,
  both renewing, may not.
- Choosing a default stops every OTHER paid plan renewing, at Stripe first.
- Capabilities are the widest set any live plan grants.

The pocket arithmetic is in tests/test_credits.py; the SQL in test_sql.py.
"""

from __future__ import annotations

from types import SimpleNamespace

import pytest
from fastapi import HTTPException

from tests.test_subscriptions import _Req, checkout_wired  # noqa: F401 - fixture
from answergap import db, entitlements
from api import auth


def _live(id_, plan, source="stripe", ending=False, default=False):
    return {"id": id_, "plan_id": plan, "source": source, "status": "active",
            "stripe_subscription_id": f"sub_{id_}" if source == "stripe" else None,
            "cancel_at_period_end": ending, "is_default": default,
            "current_period_end": None, "credits_per_period": 300}


# ---------------------------------------------------------------- checkout


def test_a_different_plan_beside_a_running_one_is_allowed(checkout_wired, monkeypatch) -> None:
    monkeypatch.setattr(db, "live_subscriptions", lambda uid: [_live(1, "lite")])
    assert auth.billing_checkout(_Req(), auth.CheckoutRequest(plan_id="pro"))["url"]


def test_the_same_renewing_plan_twice_is_refused(checkout_wired, monkeypatch) -> None:
    monkeypatch.setattr(db, "live_subscriptions", lambda uid: [_live(1, "lite")])
    with pytest.raises(HTTPException) as e:
        auth.billing_checkout(_Req(), auth.CheckoutRequest(plan_id="lite"))
    assert e.value.status_code == 409 and e.value.detail["code"] == "alreadyOnPlan"
    assert checkout_wired["sessions"] == []


def test_the_same_plan_is_buyable_once_it_stops_renewing(checkout_wired, monkeypatch) -> None:
    monkeypatch.setattr(db, "live_subscriptions",
                        lambda uid: [_live(1, "lite", ending=True)])
    assert auth.billing_checkout(_Req(), auth.CheckoutRequest(plan_id="lite"))["url"]


def test_an_assigned_plan_never_blocks_buying_it(checkout_wired, monkeypatch) -> None:
    monkeypatch.setattr(db, "live_subscriptions",
                        lambda uid: [_live(1, "lite", source="admin")])
    assert auth.billing_checkout(_Req(), auth.CheckoutRequest(plan_id="lite"))["url"]


# ------------------------------------------------------------ default plan


@pytest.fixture
def chooser(monkeypatch):
    state = {"live": [_live(1, "lite"), _live(2, "pro"), _live(3, "trial", source="admin")],
             "stripe": [], "ending": [], "default": [], "log": [], "fail": False}
    monkeypatch.setattr(auth, "accounts_enabled", lambda: True)
    monkeypatch.setattr(auth, "identity",
                        lambda r: SimpleNamespace(signed_in=True, user_id=7))
    monkeypatch.setattr(db, "live_subscriptions", lambda uid: state["live"])

    def cancel(sid, at_period_end):
        if state["fail"]:
            raise auth.stripe.StripeError("stripeDown", 503, "")
        state["stripe"].append((sid, at_period_end))
        return {}

    monkeypatch.setattr(auth.stripe, "cancel_subscription", cancel)
    monkeypatch.setattr(db, "subscription_mark_ending",
                        lambda **kw: state["ending"].append(kw["subscription_id"]))
    monkeypatch.setattr(db, "subscription_set_default",
                        lambda **kw: state["default"].append(kw["subscription_id"]))
    monkeypatch.setattr(db, "account_event_put", lambda **kw: state["log"].append(kw))
    return state


def test_choosing_a_default_stops_the_other_paid_plans_at_period_end(chooser) -> None:
    out = auth.billing_default(_Req(), auth.DefaultPlanRequest(subscription_id=2))
    assert chooser["stripe"] == [("sub_1", True)]       # at period end, not now
    assert chooser["ending"] == [1]
    assert chooser["default"] == [2]
    assert out["stopped_renewing"] == [1]
    assert chooser["log"][-1]["kind"] == "default_plan_set"


def test_an_assigned_plan_and_one_already_ending_are_left_alone(chooser) -> None:
    chooser["live"][1]["cancel_at_period_end"] = True
    auth.billing_default(_Req(), auth.DefaultPlanRequest(subscription_id=3))
    assert chooser["stripe"] == [("sub_1", True)]


def test_a_plan_that_is_not_yours_or_not_running_is_refused(chooser) -> None:
    with pytest.raises(HTTPException) as e:
        auth.billing_default(_Req(), auth.DefaultPlanRequest(subscription_id=99))
    assert e.value.status_code == 404
    assert chooser["stripe"] == [] and chooser["default"] == []


def test_a_stripe_refusal_saves_no_choice(chooser) -> None:
    chooser["fail"] = True
    with pytest.raises(HTTPException) as e:
        auth.billing_default(_Req(), auth.DefaultPlanRequest(subscription_id=2))
    assert e.value.status_code == 502
    assert chooser["default"] == [] and chooser["ending"] == []
    assert chooser["log"][-1]["kind"] == "default_plan_failed"


# ------------------------------------------------------------ capabilities


def test_capabilities_are_the_widest_any_live_plan_grants(monkeypatch) -> None:
    some = sorted(entitlements.CAPABILITIES - entitlements.FREE)
    assert len(some) >= 2, "needs two paid capabilities to tell the plans apart"
    cards = {"lite": {"capabilities": [some[0]]}, "pro": {"capabilities": [some[1]]}}
    monkeypatch.setattr(db, "live_subscriptions",
                        lambda uid: [_live(1, "lite"), _live(2, "pro")])
    monkeypatch.setattr(auth, "_plan_by_id", lambda pid: cards.get(pid))
    got = set(auth._capabilities(7, is_admin=False, subscription=None))
    assert {some[0], some[1]} <= got


# ------------------------------------------------------- /api/me's lists


def test_the_plan_list_carries_each_pocket_and_the_spending_order(monkeypatch) -> None:
    monkeypatch.setattr(db, "live_subscriptions",
                        lambda uid: [_live(1, "lite", default=True), _live(2, "pro")])
    monkeypatch.setattr(db, "credit_pockets", lambda uid: {
        "plans": [{"subscription_id": 2, "granted": 1000, "remaining": 950,
                   "expires_at": "2026-10-20T00:00:00+00:00"},
                  {"subscription_id": 1, "granted": 300, "remaining": 300,
                   "expires_at": "2026-11-01T00:00:00+00:00"}],
        "other": 10})
    monkeypatch.setattr(auth, "_plan_by_id", lambda pid: {"name": pid.title()})
    out = auth._plans_and_pockets(7)
    by_id = {p["id"]: p for p in out["plans"]}
    assert by_id[1]["is_default"] and by_id[1]["credits_left"] == 300
    assert by_id[2]["credits_left"] == 950
    assert out["pockets"] == {"spending_from": 2, "other": 10}


def test_a_broken_read_never_breaks_the_account_page(monkeypatch) -> None:
    def boom(uid):
        raise RuntimeError("database away")

    monkeypatch.setattr(db, "live_subscriptions", boom)
    assert auth._plans_and_pockets(7) == {"plans": [], "pockets": None}
