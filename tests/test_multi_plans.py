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


def test_the_same_plan_is_refused_even_while_it_is_ending(checkout_wired, monkeypatch) -> None:
    """An ending plan comes back by making it default (which resumes it);
    buying it again would charge twice for the same period."""
    monkeypatch.setattr(db, "live_subscriptions",
                        lambda uid: [_live(1, "lite", ending=True)])
    with pytest.raises(HTTPException) as e:
        auth.billing_checkout(_Req(), auth.CheckoutRequest(plan_id="lite"))
    assert e.value.status_code == 409 and e.value.detail["code"] == "alreadyOnPlan"


def test_the_same_plan_is_buyable_once_it_has_ended(checkout_wired, monkeypatch) -> None:
    monkeypatch.setattr(db, "live_subscriptions", lambda uid: [])
    assert auth.billing_checkout(_Req(), auth.CheckoutRequest(plan_id="lite"))["url"]


@pytest.fixture
def known_customer(checkout_wired, monkeypatch):
    """A customer Stripe already knows, and our rows show nothing running -
    the moment between paying in one tab and the webhook arriving."""
    monkeypatch.setattr(db, "live_subscriptions", lambda uid: [])
    monkeypatch.setattr(db, "user_for_gate", lambda uid: {
        "status": "active", "email_verified": True, "email": "a@example.com",
        "stripe_customer_id": "cus_1"})
    monkeypatch.setattr(auth, "_published_plan", lambda pid: {
        "id": pid, "stripe_price_id": "price_lite", "stripe_price_id_annual": "price_lite_y"})
    return checkout_wired


def test_a_plan_stripe_already_holds_is_refused_before_our_webhook(known_customer) -> None:
    known_customer["held"] = {"price_lite"}
    with pytest.raises(HTTPException) as e:
        auth.billing_checkout(_Req(), auth.CheckoutRequest(plan_id="lite"))
    assert e.value.detail["code"] == "alreadyOnPlan"
    assert known_customer["sessions"] == []
    assert known_customer["log"][-1]["kind"] == "checkout_refused"


def test_the_annual_price_counts_as_the_same_plan(known_customer) -> None:
    known_customer["held"] = {"price_lite_y"}
    with pytest.raises(HTTPException):
        auth.billing_checkout(_Req(), auth.CheckoutRequest(plan_id="lite"))


def test_another_tabs_open_checkout_for_the_plan_is_closed(known_customer) -> None:
    known_customer["open"] = [("cs_old", "price_lite"), ("cs_other", "price_pro")]
    assert auth.billing_checkout(_Req(), auth.CheckoutRequest(plan_id="lite"))["url"]
    assert known_customer["expired"] == ["cs_old"]          # not the other plan's


def test_if_stripe_cannot_be_asked_no_checkout_opens(known_customer, monkeypatch) -> None:
    def down(cid):
        raise auth.stripe.StripeError("stripeDown", 503, "")
    monkeypatch.setattr(auth.stripe, "customer_held_prices", down)
    with pytest.raises(HTTPException) as e:
        auth.billing_checkout(_Req(), auth.CheckoutRequest(plan_id="lite"))
    assert e.value.status_code == 502 and known_customer["sessions"] == []


def test_stripe_reads_only_subscriptions_that_still_hold_a_plan(monkeypatch) -> None:
    from api import stripe as stripe_mod

    def fake(method, path, form=None):
        assert method == "GET" and "customer=cus_1" in path
        item = lambda p: {"items": {"data": [{"price": {"id": p}}]}}  # noqa: E731
        return {"data": [{"status": "active", **item("price_a")},
                         {"status": "past_due", **item("price_b")},
                         {"status": "canceled", **item("price_c")},
                         {"status": "incomplete", **item("price_d")}]}
    monkeypatch.setattr(stripe_mod, "_request", fake)
    assert stripe_mod.customer_held_prices("cus_1") == {"price_a", "price_b"}


def test_stripe_finds_open_checkouts_by_our_price_tag(monkeypatch) -> None:
    from api import stripe as stripe_mod
    monkeypatch.setattr(stripe_mod, "_request", lambda m, p, f=None: {"data": [
        {"id": "cs_1", "metadata": {"answergap_price_id": "price_a"}},
        {"id": "cs_2", "metadata": {"answergap_price_id": "price_b"}},
        {"id": "cs_3", "metadata": {}},
    ]})
    assert stripe_mod.open_checkouts_for("cus_1", {"price_a"}) == ["cs_1"]


def test_every_checkout_carries_its_price_tag(monkeypatch) -> None:
    from api import stripe as stripe_mod
    sent = {}
    monkeypatch.setattr(stripe_mod, "_request",
                        lambda m, p, f=None: sent.update(f or {}) or {"id": "cs", "url": "u"})
    stripe_mod.subscription_checkout(price_id="price_a", success_url="s", cancel_url="c",
                                     user_id=7, email=None, customer_id="cus_1")
    assert sent["metadata[answergap_price_id]"] == "price_a"


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

    def resume(sid):
        if state["fail"]:
            raise auth.stripe.StripeError("stripeDown", 503, "")
        state["stripe"].append((sid, "resume"))
        return {}

    monkeypatch.setattr(auth.stripe, "cancel_subscription", cancel)
    monkeypatch.setattr(auth.stripe, "resume_subscription", resume)
    state["renewing"], state["withdrawn"] = [], []
    monkeypatch.setattr(db, "subscription_mark_renewing",
                        lambda **kw: state["renewing"].append(kw["subscription_id"]))
    monkeypatch.setattr(db, "subscription_cancel_withdrawn",
                        lambda **kw: state["withdrawn"].append(kw["stripe_subscription_id"]))
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


def test_a_stopped_plan_made_default_renews_again(chooser) -> None:
    """The plan chosen to keep renews: if it was set to stop, the stop is
    undone at Stripe first, then the others stop."""
    chooser["live"][1]["cancel_at_period_end"] = True     # pro was stopped
    out = auth.billing_default(_Req(), auth.DefaultPlanRequest(subscription_id=2))
    assert chooser["stripe"] == [("sub_2", "resume"), ("sub_1", True)]
    assert chooser["renewing"] == [2] and chooser["withdrawn"] == ["sub_2"]
    assert out["resumed"] is True and out["stopped_renewing"] == [1]


def test_a_renewing_default_is_not_touched(chooser) -> None:
    out = auth.billing_default(_Req(), auth.DefaultPlanRequest(subscription_id=2))
    assert ("sub_2", "resume") not in chooser["stripe"]
    assert out["resumed"] is False and chooser["renewing"] == []


def test_an_assigned_plan_made_default_is_not_sent_to_stripe(chooser) -> None:
    chooser["live"][2]["cancel_at_period_end"] = True
    out = auth.billing_default(_Req(), auth.DefaultPlanRequest(subscription_id=3))
    assert out["resumed"] is False


def test_a_refused_resume_saves_nothing(chooser) -> None:
    chooser["live"][1]["cancel_at_period_end"] = True
    chooser["fail"] = True
    with pytest.raises(HTTPException) as e:
        auth.billing_default(_Req(), auth.DefaultPlanRequest(subscription_id=2))
    assert e.value.status_code == 502
    assert chooser["renewing"] == [] and chooser["default"] == [] and chooser["ending"] == []


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
