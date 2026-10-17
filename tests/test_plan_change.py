"""A mid-period plan change must not hand out a free period (D4/D5).

Two bugs, both from reading an invoice too literally:

- The FIRST line of a plan-change invoice is the credit for unused time on
  the OLD plan, so the invoice was attributed to the plan being left and
  granted its credits again.
- Every `invoice.paid` granted a full period, including the prorated
  `subscription_update` invoice and a $0 one (downgrade credit, 100% coupon).

Plan switching is also turned off in Stripe's portal; this is the guard for
the day somebody turns it back on.
"""

from __future__ import annotations

import json

from tests.test_subscriptions import _invoice_event, wired  # noqa: F401 - fixture
from answergap import db
from api import billing, stripe

PLANS = json.dumps([
    {"id": "lite", "enabled": True, "credits": 300, "stripe_price_id": "price_lite"},
    {"id": "pro", "enabled": True, "credits": 1000, "stripe_price_id": "price_pro"},
])


def _change_invoice(reason="subscription_update", amount_paid=700, new_style=False):
    def line(price, amount, proration):
        if new_style:
            return {"amount": amount, "pricing": {"price_details": {"price": price}},
                    "parent": {"subscription_item_details": {"proration": proration}},
                    "period": {"end": 1790000000}, "quantity": 1}
        return {"price": {"id": price}, "amount": amount, "proration": proration,
                "period": {"end": 1790000000}, "quantity": 1}

    ev = _invoice_event(id="in_change", billing_reason=reason, amount_paid=amount_paid)
    ev["data"]["object"]["lines"]["data"] = [
        line("price_lite", -500, True),     # unused time on the old plan
        line("price_pro", 1200, True),      # remaining time on the new one
    ]
    return ev


def _renewal_after_change():
    """The next renewal: leftover prorations first, then the new period."""
    ev = _invoice_event(id="in_cycle", billing_reason="subscription_cycle", amount_paid=3000)
    ev["data"]["object"]["lines"]["data"] = [
        {"price": {"id": "price_lite"}, "amount": -500, "proration": True,
         "period": {"end": 1788000000}},
        {"price": {"id": "price_pro"}, "amount": 3000, "proration": False,
         "period": {"end": 1790000000}},
    ]
    return ev


# ------------------------------------------------------- which line is it


def test_the_plan_line_is_the_one_that_is_not_a_proration() -> None:
    found = stripe.subscription_from_event(_renewal_after_change())
    assert found["price_id"] == "price_pro"
    assert found["current_period_end"] == 1790000000


def test_an_invoice_of_only_prorations_names_the_new_plan() -> None:
    assert stripe.subscription_from_event(_change_invoice())["price_id"] == "price_pro"


def test_the_new_api_versions_proration_flag_is_read_too() -> None:
    found = stripe.subscription_from_event(_change_invoice(new_style=True))
    assert found["price_id"] == "price_pro"


# --------------------------------------------------------- what it grants


def test_a_plan_change_invoice_grants_nothing(wired, monkeypatch) -> None:
    monkeypatch.setattr(db, "settings_all", lambda: {"pricing_plans": PLANS})
    out = billing.apply_subscription_event(_change_invoice())
    assert out == "paid (subscription_update), no credits"
    assert wired["grants"] == []
    # The subscription row still learns which plan it is on now.
    assert wired["upserts"][-1]["plan_id"] == "pro"


def test_the_renewal_after_a_change_grants_the_new_plan(wired, monkeypatch) -> None:
    monkeypatch.setattr(db, "settings_all", lambda: {"pricing_plans": PLANS})
    assert billing.apply_subscription_event(_renewal_after_change()) == "granted 1000"
    assert wired["upserts"][-1]["plan_id"] == "pro"


def test_a_zero_dollar_invoice_grants_nothing(wired) -> None:
    ev = _invoice_event(id="in_zero", billing_reason="subscription_cycle", amount_paid=0)
    assert billing.apply_subscription_event(ev) == "paid $0, no credits"
    assert wired["grants"] == []


def test_the_first_invoice_of_a_new_subscription_grants(wired) -> None:
    ev = _invoice_event(id="in_first", billing_reason="subscription_create", amount_paid=1000)
    assert billing.apply_subscription_event(ev) == "granted 300"


def test_an_older_event_without_the_fields_still_grants(wired) -> None:
    assert billing.apply_subscription_event(_invoice_event()) == "granted 300"
