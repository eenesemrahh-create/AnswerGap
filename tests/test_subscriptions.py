"""The subscription webhook: where money becomes credits.

The riskiest code in the product. Stripe retries a webhook until it gets a
2xx, so the question this file exists to answer is not "does it grant credits"
but "can it grant them twice" - and the second question is "can it grant them
to the wrong person".

Called as plain functions, like test_pay_probe.py. The database layer is
stubbed, because what is under test is the DECISION the handler makes from an
event, not the SQL - `tests/test_sql.py` runs the statements against a real
Postgres in CI.
"""

from __future__ import annotations

from types import SimpleNamespace

import pytest
from fastapi import HTTPException
from pydantic import ValidationError

from answergap import db
from api import admin, billing, main


# ------------------------------------------------------------ the fixtures


def _subscription_event(kind="customer.subscription.updated", **over) -> dict:
    obj = {
        "id": "sub_123",
        "customer": "cus_123",
        "status": "active",
        "current_period_end": 1790000000,
        "cancel_at_period_end": False,
        "items": {"data": [{"price": {"id": "price_lite"}, "quantity": 1}]},
        "metadata": {},
    }
    obj.update(over)
    return {"id": "evt_1", "type": kind, "data": {"object": obj}}


def _invoice_event(kind="invoice.paid", **over) -> dict:
    obj = {
        "id": "in_123",
        "customer": "cus_123",
        "subscription": "sub_123",
        "lines": {
            "data": [
                {
                    "price": {"id": "price_lite"},
                    "quantity": 1,
                    "period": {"end": 1790000000},
                }
            ]
        },
        "metadata": {},
    }
    obj.update(over)
    return {"id": "evt_2", "type": kind, "data": {"object": obj}}


PLANS = (
    '[{"id":"lite","enabled":true,"credits":300,'
    '"stripe_price_id":"price_lite","stripe_price_id_annual":"price_lite_yr"},'
    '{"id":"draft","enabled":false,"credits":999,'
    '"stripe_price_id":"price_draft","stripe_price_id_annual":""}]'
)


@pytest.fixture
def wired(monkeypatch):
    """A database that remembers what it was asked to do, and nothing else."""
    state = {
        "grants": [],
        "upserts": [],
        "status": [],
        "attached": [],
        "row": {"user_id": 7, "plan_id": "lite", "credits_per_period": 300,
                "status": "active", "cancel_at_period_end": False},
    }
    monkeypatch.setattr(db, "settings_all", lambda: {"pricing_plans": PLANS})
    monkeypatch.setattr(db, "user_by_stripe_customer",
                        lambda cid: {"id": 7} if cid == "cus_123" else None)
    monkeypatch.setattr(db, "subscription_by_stripe_id", lambda sid: state["row"])
    monkeypatch.setattr(db, "stripe_customer_attach",
                        lambda **kw: state["attached"].append(kw))
    monkeypatch.setattr(db, "subscription_upsert",
                        lambda **kw: state["upserts"].append(kw))
    monkeypatch.setattr(db, "subscription_set_status",
                        lambda **kw: state["status"].append(kw))
    # No admin cancellation behind these events unless a test says so.
    state["admin_cancel"] = None
    state["clawbacks"] = []
    monkeypatch.setattr(db, "subscription_cancelled_by_admin",
                        lambda sid: state["admin_cancel"])
    monkeypatch.setattr(db, "subscription_clawback",
                        lambda **kw: state["clawbacks"].append(kw) or 120)
    state["withdrawn"] = []
    monkeypatch.setattr(db, "subscription_cancel_withdrawn",
                        lambda **kw: state["withdrawn"].append(kw))

    def grant(**kw):
        # The real one is guarded by a unique index on the invoice; this
        # mirrors that so the handler is tested against the behaviour it gets.
        if any(g["invoice_id"] == kw["invoice_id"] for g in state["grants"]):
            return False
        state["grants"].append(kw)
        return True

    monkeypatch.setattr(db, "subscription_credit", grant)
    return state


# ------------------------------------------------------- granting, and once


def test_a_paid_invoice_grants_the_agreed_credits(wired) -> None:
    assert main._apply_subscription_event(_invoice_event()) == "granted 300"
    assert wired["grants"][0]["user_id"] == 7
    assert wired["grants"][0]["credits"] == 300


def test_a_redelivered_invoice_grants_nothing(wired) -> None:
    """THE ONE THAT MATTERS. Stripe retries until it gets a 2xx, so without
    the guard one retry is one free month."""
    first = main._apply_subscription_event(_invoice_event())
    second = main._apply_subscription_event(_invoice_event())
    assert first == "granted 300"
    assert second == "already granted"
    assert len(wired["grants"]) == 1


def test_the_grant_is_keyed_on_the_invoice(wired) -> None:
    """Two different invoices are two different months, even on one
    subscription."""
    main._apply_subscription_event(_invoice_event())
    main._apply_subscription_event(_invoice_event(id="in_456"))
    assert [g["invoice_id"] for g in wired["grants"]] == ["in_123", "in_456"]


def test_a_renewal_grants_the_plans_current_credits(monkeypatch, wired) -> None:
    """THE OPERATOR'S CHOICE, 2026-10-12: a renewal pays the plan's figure
    TODAY, not the one recorded when it was bought. This used to be the
    opposite rule, and this test used to pin the opposite answer.

    Patched through `monkeypatch` rather than by assigning to the module, so
    a 50-credit plan cannot leak into the tests that run after this one.
    """
    cheaper = PLANS.replace('"credits":300', '"credits":50')
    monkeypatch.setattr(db, "settings_all", lambda: {"pricing_plans": cheaper})
    wired["row"]["credits_per_period"] = 300
    assert main._apply_subscription_event(_invoice_event()) == "granted 50"


def test_the_features_page_outranks_the_card(monkeypatch, wired) -> None:
    monkeypatch.setattr(db, "settings_all", lambda: {
        "pricing_plans": PLANS,
        "plan_features": '{"lite": {"credits": 450}}',
    })
    assert main._apply_subscription_event(_invoice_event()) == "granted 450"
    assert wired["upserts"][-1]["credits_per_period"] == 450


def test_zero_on_the_features_page_grants_nothing(monkeypatch, wired) -> None:
    """A deliberate 0 is an answer, not a blank: it must not fall back to the
    card's figure or to what the row recorded last month."""
    monkeypatch.setattr(db, "settings_all", lambda: {
        "pricing_plans": PLANS,
        "plan_features": '{"lite": {"credits": 0}}',
    })
    assert main._apply_subscription_event(_invoice_event()) == (
        "paid, but this plan grants no credits"
    )
    assert wired["grants"] == []


def test_a_plan_nobody_priced_keeps_what_the_row_recorded(monkeypatch, wired) -> None:
    """No features entry and no card figure: the last known amount stands,
    so a missing setting never zeroes a paying customer's renewal."""
    monkeypatch.setattr(db, "settings_all", lambda: {
        "pricing_plans": PLANS.replace('"credits":300,', ''),
    })
    wired["row"]["credits_per_period"] = 120
    assert main._apply_subscription_event(_invoice_event()) == "granted 120"


def test_a_corrupt_features_setting_does_not_break_billing(monkeypatch, wired) -> None:
    monkeypatch.setattr(db, "settings_all", lambda: {
        "pricing_plans": PLANS, "plan_features": "{not json",
    })
    assert main._apply_subscription_event(_invoice_event()) == "granted 300"


# ------------------------------------------------------------ whose money


def test_an_unknown_customer_is_not_guessed_at(monkeypatch, wired) -> None:
    """No user, no grant. An address is never used to decide whose money this
    is - it can be changed, shared, or belong to somebody else by the time a
    renewal arrives a month later."""
    monkeypatch.setattr(db, "user_by_stripe_customer", lambda cid: None)
    assert main._apply_subscription_event(_invoice_event()) == "UNATTRIBUTED"
    assert wired["grants"] == []


def test_metadata_is_a_fallback_when_the_customer_is_unknown(monkeypatch, wired) -> None:
    """A first checkout carries our user id; the customer link is written from
    it, so the NEXT event resolves without it."""
    monkeypatch.setattr(db, "user_by_stripe_customer", lambda cid: None)
    event = _subscription_event(metadata={"answergap_user_id": "7"})
    main._apply_subscription_event(event)
    assert wired["attached"] == [{"user_id": 7, "customer_id": "cus_123"}]


def test_the_email_is_never_consulted(monkeypatch, wired) -> None:
    monkeypatch.setattr(db, "user_by_stripe_customer", lambda cid: None)
    event = _invoice_event(customer_email="someone@example.com")
    assert main._apply_subscription_event(event) == "UNATTRIBUTED"


# --------------------------------------------------------------- lifecycle


def test_a_failed_payment_only_moves_the_status(wired) -> None:
    """It carries no items and no period, so a full upsert from it would
    overwrite good data with blanks."""
    assert main._apply_subscription_event(
        _invoice_event(kind="invoice.payment_failed")
    ) == "past_due"
    assert wired["status"] == [
        {"stripe_subscription_id": "sub_123", "status": "past_due"}
    ]
    assert wired["upserts"] == []


def test_a_deleted_subscription_is_canceled_whatever_it_says(wired) -> None:
    """Stripe sends the object with its last status; the event type is the
    authority on it being over."""
    main._apply_subscription_event(
        _subscription_event(kind="customer.subscription.deleted", status="active")
    )
    assert wired["upserts"][0]["status"] == "canceled"


def test_a_paid_invoice_keeps_the_subscription_active(wired) -> None:
    """An invoice carries no status. A payment that went through is not a
    reason to blank one."""
    main._apply_subscription_event(_invoice_event())
    assert wired["upserts"][0]["status"] == "active"


def test_the_period_end_becomes_a_timestamp(wired) -> None:
    main._apply_subscription_event(_invoice_event())
    assert str(wired["upserts"][0]["current_period_end"]).startswith("2026-")


# ------------------------------------------------------ nothing escapes it


def test_a_broken_event_never_asks_stripe_to_retry(monkeypatch, wired) -> None:
    """A raise here would turn one bad event into an endless redelivery loop
    against the endpoint that hands out credits."""
    def boom(**kw):
        raise RuntimeError("database on fire")

    monkeypatch.setattr(db, "subscription_upsert", boom)
    assert main._apply_subscription_event(_invoice_event()) == "ERROR"


def test_an_unrelated_event_is_ignored(wired) -> None:
    assert main._apply_subscription_event(
        {"id": "e", "type": "payment_intent.succeeded", "data": {"object": {}}}
    ) is None


def test_a_one_off_invoice_is_not_a_subscription(wired) -> None:
    """The pay probe raises `invoice.paid` too, and it has no subscription."""
    event = _invoice_event()
    del event["data"]["object"]["subscription"]
    assert main._apply_subscription_event(event) == "not a subscription"


# ------------------------------------------------------------ plan lookup


def test_a_price_maps_to_its_plan(wired) -> None:
    assert (billing.plan_for_price("price_lite") or {}).get("id") == "lite"
    assert (billing.plan_for_price("price_lite_yr") or {}).get("id") == "lite"


def test_an_unknown_price_is_not_a_plan(wired) -> None:
    assert billing.plan_for_price("price_nope") is None
    assert billing.plan_for_price(None) is None


def test_checkout_refuses_a_price_the_browser_supplies() -> None:
    """The request model has no price field at all, which is the point: a
    client that could name its own Stripe price could name a cheaper one."""
    from api.auth import CheckoutRequest

    assert "price" not in CheckoutRequest.model_fields
    assert set(CheckoutRequest.model_fields) == {"plan_id", "cycle"}


# ------------------------------------------------- assigning a plan by hand
#
# Trials, the people who tested this before it could take money, an apology,
# an agency invoiced somewhere else. None of those can go through Stripe.
#
# The SQL is pinned in `tests/test_sql.py`; these are the endpoint's
# decisions - what it refuses, and where the credit figure comes from.


class _Req:
    """Enough of a Request for `require_admin`, which is stubbed anyway."""


@pytest.fixture
def admin_wired(monkeypatch):
    state = {"assigned": [], "revoked": []}

    monkeypatch.setattr(admin, "require_admin",
                        lambda request: SimpleNamespace(email="op@example.com"))
    monkeypatch.setattr(db, "admin_user_detail",
                        lambda uid: {"id": uid, "status": "active"} if uid == 7 else None)
    monkeypatch.setattr(db, "settings_all", lambda: {"pricing_plans": PLANS})

    def assign(**kw):
        state["assigned"].append(kw)
        return {"subscription_id": 1, "current_period_end": None,
                "granted": kw["credits_per_period"] if kw["grant_credits"] else 0,
                "superseded": 0, "balance": 0}

    monkeypatch.setattr(db, "subscription_assign", assign)
    monkeypatch.setattr(db, "subscription_revoke_assigned",
                        lambda **kw: state["revoked"].append(kw) or True)
    state["clawbacks"] = []
    monkeypatch.setattr(db, "subscription_clawback",
                        lambda **kw: state["clawbacks"].append(kw) or 40)
    return state


def _assign_request(**over):
    body = {"plan_id": "lite"}
    body.update(over)
    return admin.AssignPlanRequest(**body)


def test_the_credit_figure_comes_from_the_plan(admin_wired) -> None:
    admin.assign_plan(_Req(), 7, _assign_request())
    assert admin_wired["assigned"][0]["credits_per_period"] == 300


def test_an_operator_may_override_the_credit_figure(admin_wired) -> None:
    """The half-month trial and the apology. Forcing them to assign the plan
    and then correct the balance in a second screen would produce two audit
    rows for one intention."""
    admin.assign_plan(_Req(), 7, _assign_request(credits=50))
    assert admin_wired["assigned"][0]["credits_per_period"] == 50


def test_zero_credits_is_not_the_same_as_leaving_it_blank(admin_wired) -> None:
    """Blank means "whatever the plan grants"; 0 means "this plan, no
    credits", which is a real thing to want for somebody who already has a
    balance."""
    admin.assign_plan(_Req(), 7, _assign_request(credits=0))
    assert admin_wired["assigned"][0]["credits_per_period"] == 0


def test_an_unpublished_plan_is_assignable(admin_wired) -> None:
    """UNLIKE A CUSTOMER CHECKOUT. `enabled` governs what the public pricing
    page sells; refusing a draft here would mean publishing a plan to the
    whole internet in order to give it to one person."""
    admin.assign_plan(_Req(), 7, _assign_request(plan_id="draft"))
    assert admin_wired["assigned"][0]["plan_id"] == "draft"


def test_an_unknown_plan_is_refused(admin_wired) -> None:
    """`plan_id` is what every later screen looks up to name the plan and draw
    its card, so a typo accepted here becomes an account on a plan that
    renders as a blank."""
    with pytest.raises(HTTPException) as caught:
        admin.assign_plan(_Req(), 7, _assign_request(plan_id="nope"))
    assert caught.value.status_code == 404
    assert caught.value.detail["code"] == "unknownPlan"
    assert admin_wired["assigned"] == []


def test_an_unknown_user_is_refused(admin_wired) -> None:
    with pytest.raises(HTTPException) as caught:
        admin.assign_plan(_Req(), 99, _assign_request())
    assert caught.value.status_code == 404


def test_an_erased_account_cannot_be_put_on_a_plan(monkeypatch, admin_wired) -> None:
    """Erasure blanks every identifier by design. Assigning a plan to one
    would write a new row naming the person it just removed."""
    monkeypatch.setattr(db, "admin_user_detail",
                        lambda uid: {"id": uid, "status": "erased"})
    with pytest.raises(HTTPException) as caught:
        admin.assign_plan(_Req(), 7, _assign_request())
    assert caught.value.status_code == 409


def test_a_plan_cannot_be_assigned_for_longer_than_a_year() -> None:
    """Anything beyond it should be re-assigned deliberately rather than set
    once and forgotten about."""
    with pytest.raises(ValidationError):
        _assign_request(days=400)
    with pytest.raises(ValidationError):
        _assign_request(days=0)


def test_the_plan_id_is_slug_shaped() -> None:
    """It travels into an audit row and back out onto a page."""
    with pytest.raises(ValidationError):
        _assign_request(plan_id="Lite Plan")


def test_revoking_names_the_row_and_the_user(admin_wired) -> None:
    """Both, not just the subscription id: `subscription_revoke_assigned` has
    `user_id` in its WHERE clause so a mistyped id cannot end somebody else's
    plan."""
    out = admin.revoke_plan(_Req(), 7, 12)
    assert out["changed"] is True
    assert admin_wired["revoked"] == [
        {"user_id": 7, "subscription_id": 12, "actor": "op@example.com"}
    ]


# ------------------------------------------- test or live, and "process again"


def test_the_mode_of_the_event_is_written_onto_the_subscription(wired) -> None:
    """A sandbox subscription grants real credits in this database, so the
    admin has to be able to tell it from a paying customer."""
    main._apply_subscription_event({**_subscription_event(), "livemode": False})
    main._apply_subscription_event({**_subscription_event(), "livemode": True})
    assert [u["livemode"] for u in wired["upserts"]] == [False, True]


@pytest.fixture
def stored(monkeypatch, wired):
    """One stored event, and a record of what the endpoint wrote back."""
    state = {"payload": {**_invoice_event(), "id": "evt_2", "livemode": False},
             "effects": [], "audit": []}
    monkeypatch.setattr(admin, "require_admin",
                        lambda request: SimpleNamespace(email="op@example.com"))
    monkeypatch.setattr(db, "payment_event_payload",
                        lambda eid: state["payload"] if eid == "evt_2" else None)
    monkeypatch.setattr(db, "payment_event_set_effect",
                        lambda eid, effect, user_id=None:
                        state["effects"].append((eid, effect, user_id)))
    monkeypatch.setattr(db, "admin_log", lambda **kw: state["audit"].append(kw))
    return state


def test_processing_a_stored_invoice_again_grants_its_credits(stored, wired) -> None:
    out = admin.stripe_event_process(_Req(), "evt_2")
    assert out == {"effect": "granted 300", "user_id": 7}
    assert stored["effects"] == [("evt_2", "granted 300", 7)]
    assert stored["audit"][0]["action"] == "stripe_event_process"


def test_processing_twice_never_pays_twice(stored, wired) -> None:
    admin.stripe_event_process(_Req(), "evt_2")
    again = admin.stripe_event_process(_Req(), "evt_2")
    assert again["effect"] == "already granted"
    assert len(wired["grants"]) == 1


def test_only_lifecycle_events_can_be_processed(stored) -> None:
    stored["payload"] = {"id": "evt_2", "type": "checkout.session.completed",
                         "data": {"object": {}}}
    with pytest.raises(HTTPException) as exc:
        admin.stripe_event_process(_Req(), "evt_2")
    assert exc.value.status_code == 409
    assert stored["audit"] == []


@pytest.mark.parametrize("event_id", ["evt_missing", "not-an-event", "evt_../x"])
def test_an_unknown_or_malformed_event_is_refused(stored, event_id) -> None:
    with pytest.raises(HTTPException) as exc:
        admin.stripe_event_process(_Req(), event_id)
    assert exc.value.status_code in (400, 404)


# ------------------------------------------------- the features page itself


@pytest.fixture
def features_wired(monkeypatch):
    state = {"settings": {"pricing_plans": PLANS,
                          "plan_features": '{"retired": {"credits": 70}}'},
             "puts": []}
    monkeypatch.setattr(admin, "require_admin",
                        lambda request: SimpleNamespace(email="op@example.com"))
    monkeypatch.setattr(db, "settings_all", lambda: state["settings"])

    def put(*, key, value, actor):
        state["puts"].append((key, value, actor))
        state["settings"] = {**state["settings"], key: value}

    monkeypatch.setattr(db, "setting_put", put)
    return state


def test_saving_features_keeps_plans_the_form_did_not_send(features_wired) -> None:
    """A retired plan still renews for the people on it; saving the page
    without its row must not zero their renewals."""
    out = admin.put_plan_features(
        _Req(), admin.PlanFeaturesRequest(features={"lite": {"credits": 250}})
    )
    assert out["features"] == {"lite": {"credits": 250}, "retired": {"credits": 70}}
    assert features_wired["puts"][0][0] == "plan_features"
    assert billing.plan_credits("lite") == 250


def test_features_for_a_plan_that_does_not_exist_are_refused(features_wired) -> None:
    with pytest.raises(HTTPException) as exc:
        admin.put_plan_features(
            _Req(), admin.PlanFeaturesRequest(features={"strater": {"credits": 1}})
        )
    assert exc.value.status_code == 400
    assert features_wired["puts"] == []


def test_negative_credits_never_reach_the_setting() -> None:
    with pytest.raises(ValidationError):
        admin.PlanFeaturesRequest(features={"lite": {"credits": -5}})


def test_the_page_shows_the_cards_figure_until_the_plan_is_saved(features_wired) -> None:
    out = admin.get_plan_features(_Req())
    assert {p["id"] for p in out["plans"]} == {"lite", "draft"}
    assert out["legacy"]["lite"] == 300
    assert out["features"] == {"retired": {"credits": 70}}


# ------------------------------------------ cancelling from the account page


@pytest.fixture
def cancel_wired(monkeypatch):
    state = {"row": {"id": 5, "user_id": 7, "stripe_subscription_id": "sub_123",
                     "source": "stripe", "status": "active"},
             "stripe": [], "marked": []}
    monkeypatch.setattr(admin, "require_admin",
                        lambda request: SimpleNamespace(email="op@example.com"))
    monkeypatch.setattr(db, "subscription_for_admin",
                        lambda user_id, subscription_id:
                        state["row"] if (user_id, subscription_id) == (7, 5) else None)

    def cancel(sid, at_period_end):
        state["stripe"].append((sid, at_period_end))
        return {"status": "active" if at_period_end else "canceled",
                "cancel_at_period_end": at_period_end}

    monkeypatch.setattr(admin.stripe, "cancel_subscription", cancel)
    monkeypatch.setattr(db, "subscription_mark_cancelled",
                        lambda **kw: state["marked"].append(kw))
    state["clawbacks"] = []
    monkeypatch.setattr(db, "subscription_clawback",
                        lambda **kw: state["clawbacks"].append(kw) or 180)
    return state


def test_cancelling_now_ends_it_at_stripe_then_here(cancel_wired) -> None:
    out = admin.cancel_subscription(_Req(), 7, 5, admin.CancelSubscriptionRequest())
    assert cancel_wired["stripe"] == [("sub_123", False)]
    assert cancel_wired["marked"][0]["at_period_end"] is False
    assert cancel_wired["marked"][0]["actor"] == "op@example.com"
    assert out["status"] == "canceled"


def test_cancelling_at_period_end_keeps_what_was_paid_for(cancel_wired) -> None:
    admin.cancel_subscription(
        _Req(), 7, 5, admin.CancelSubscriptionRequest(when="period_end")
    )
    assert cancel_wired["stripe"] == [("sub_123", True)]


def test_a_refused_cancellation_writes_nothing(monkeypatch, cancel_wired) -> None:
    """The row must never say cancelled about a subscription still charging."""
    def refuse(sid, at_period_end):
        raise admin.stripe.StripeError("invalidRequest", 404, "No such subscription")

    monkeypatch.setattr(admin.stripe, "cancel_subscription", refuse)
    with pytest.raises(HTTPException) as exc:
        admin.cancel_subscription(_Req(), 7, 5, admin.CancelSubscriptionRequest())
    assert exc.value.status_code == 502
    assert cancel_wired["marked"] == []


@pytest.mark.parametrize("change, code", [
    ({"source": "admin", "stripe_subscription_id": None}, 409),
    ({"status": "canceled"}, 409),
])
def test_what_cannot_be_cancelled_at_stripe_is_refused(cancel_wired, change, code) -> None:
    cancel_wired["row"].update(change)
    with pytest.raises(HTTPException) as exc:
        admin.cancel_subscription(_Req(), 7, 5, admin.CancelSubscriptionRequest())
    assert exc.value.status_code == code
    assert cancel_wired["stripe"] == []


def test_another_accounts_subscription_is_not_found(cancel_wired) -> None:
    with pytest.raises(HTTPException) as exc:
        admin.cancel_subscription(_Req(), 8, 5, admin.CancelSubscriptionRequest())
    assert exc.value.status_code == 404


# ------------------------------------------------- what a failure is called


def test_a_declined_card_is_described_in_stripes_own_codes() -> None:
    event = {"type": "payment_intent.payment_failed", "data": {"object": {
        "last_payment_error": {"code": "card_declined", "decline_code": "insufficient_funds",
                               "message": "Your card has insufficient funds."}}}}
    assert billing.describe_failure(event) == (
        "card declined: insufficient_funds - Your card has insufficient funds."
    )


def test_an_abandoned_checkout_is_called_that() -> None:
    assert billing.describe_failure(
        {"type": "checkout.session.expired", "data": {"object": {}}}
    ) == "checkout abandoned"


def test_an_expired_checkout_is_attributed_by_its_reference(monkeypatch) -> None:
    monkeypatch.setattr(db, "user_by_stripe_customer", lambda cid: None)
    event = {"type": "checkout.session.expired",
             "data": {"object": {"client_reference_id": "7", "customer": None}}}
    assert billing.resolve_stripe_user(event) == 7


# ------------------------------------------- what a checkout leaves behind

from api import auth  # noqa: E402


@pytest.fixture
def checkout_wired(monkeypatch):
    state = {"log": [], "attached": [], "sessions": [], "fail": False}
    monkeypatch.setattr(auth, "accounts_enabled", lambda: True)
    monkeypatch.setattr(auth, "identity",
                        lambda request: SimpleNamespace(signed_in=True, user_id=7))
    monkeypatch.setattr(db, "user_for_gate", lambda uid: {
        "status": "active", "email_verified": True, "email": "a@example.com",
        "stripe_customer_id": None})
    monkeypatch.setattr(auth.stripe, "mode", lambda: "test")
    monkeypatch.setattr(auth, "_published_plan",
                        lambda pid: {"id": pid, "stripe_price_id": "price_lite"})
    monkeypatch.setattr(auth.stripe, "create_customer", lambda **kw: "cus_new")
    monkeypatch.setattr(db, "stripe_customer_attach",
                        lambda **kw: state["attached"].append(kw))
    monkeypatch.setattr(db, "account_event_put", lambda **kw: state["log"].append(kw))

    def session(**kw):
        if state["fail"]:
            raise auth.stripe.StripeError("invalidRequest", 400, "No such price")
        state["sessions"].append(kw)
        return {"id": "cs_1", "url": "https://checkout.stripe.com/x"}

    monkeypatch.setattr(auth.stripe, "subscription_checkout", session)
    # What Stripe itself says the customer holds, and the checkouts still
    # open; both empty unless a test says otherwise.
    state["held"], state["open"], state["expired"] = set(), [], []
    monkeypatch.setattr(auth.stripe, "customer_held_prices", lambda cid: state["held"])
    monkeypatch.setattr(auth.stripe, "open_checkouts_for",
                        lambda cid, prices: [s for s, p in state["open"] if p in prices])
    monkeypatch.setattr(auth.stripe, "expire_checkout", lambda sid: state["expired"].append(sid))
    return state


def test_a_checkout_creates_the_customer_first_and_logs_the_attempt(checkout_wired) -> None:
    """The customer exists before the card is typed, so even a declined first
    attempt raises events we can map back to this account."""
    out = auth.billing_checkout(_Req(), auth.CheckoutRequest(plan_id="lite"))
    assert out["url"].startswith("https://checkout.stripe.com")
    assert checkout_wired["attached"] == [{"user_id": 7, "customer_id": "cus_new"}]
    assert checkout_wired["sessions"][0]["customer_id"] == "cus_new"
    entry = checkout_wired["log"][0]
    assert entry["kind"] == "checkout_started"
    assert entry["detail"]["plan_id"] == "lite" and entry["detail"]["session_id"] == "cs_1"


def test_a_checkout_stripe_refuses_is_logged_as_failed(checkout_wired) -> None:
    checkout_wired["fail"] = True
    with pytest.raises(HTTPException):
        auth.billing_checkout(_Req(), auth.CheckoutRequest(plan_id="lite"))
    assert checkout_wired["log"][0]["kind"] == "checkout_failed"
    assert checkout_wired["log"][0]["detail"]["error"] == "invalidRequest"


def test_a_broken_log_never_costs_the_customer_their_checkout(monkeypatch, checkout_wired) -> None:
    def boom(**kw):
        raise RuntimeError("database away")

    monkeypatch.setattr(db, "account_event_put", boom)
    assert auth.billing_checkout(_Req(), auth.CheckoutRequest(plan_id="lite"))["url"]
