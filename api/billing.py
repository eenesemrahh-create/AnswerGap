"""Turning a Stripe event into rows: whose money, which plan, how many credits.

Lives apart from `api/main.py` so the webhook and the admin's "process again"
button run THE SAME CODE. Two copies of the rule that hands out credits would
be one fix away from disagreeing about who gets them.
"""

from __future__ import annotations

import json
import logging
from datetime import datetime, timezone

from answergap import db, gate

from . import stripe


def resolve_stripe_user(event: dict) -> int | None:
    """Whose money is this?

    Two routes, in order of how much they can be trusted:

    1. The CUSTOMER ID, which we stored on the account at the first checkout.
       A customer belongs to one account and keeps belonging to it.
    2. The metadata we put on objects we created - the checkout session and
       the subscription. Only a fallback, because a renewal invoice is
       created by Stripe a month later and carries none of ours.

    Never the email. An address can be changed, shared, or belong to somebody
    else entirely by the time a renewal arrives, and `payment_event` matching
    on it is the weakness CLAUDE.md item 14 records.
    """
    obj = ((event.get("data") or {}).get("object")) or {}
    customer_id = obj.get("customer")
    if isinstance(customer_id, str):
        row = db.user_by_stripe_customer(customer_id)
        if row:
            return int(row["id"])
    hinted = stripe._metadata_user_id(obj)
    if hinted is None and (event.get("type") or "").startswith("checkout.session."):
        raw = obj.get("client_reference_id")
        try:
            hinted = int(raw) if raw else None
        except (TypeError, ValueError):
            hinted = None
    return hinted


def plan_for_price(price_id: str | None) -> dict | None:
    """Which of our plans a Stripe price belongs to.

    The link an operator makes by pasting a price id onto a plan card. A
    price with no plan is not an error here - it is a subscription sold
    before the card was wired up, or a price the operator created and has
    not attached yet - so the caller keeps whatever it already knew.
    """
    if not price_id:
        return None
    try:
        rows = db.settings_all()
        plans = json.loads(rows.get(gate.SETTING_PRICING_PLANS, "") or "[]")
    except Exception:  # noqa: BLE001 - billing must not break on bad copy
        return None
    for plan in plans if isinstance(plans, list) else []:
        if price_id in (plan.get("stripe_price_id"), plan.get("stripe_price_id_annual")):
            return plan
    return None


def plan_features() -> dict[str, dict]:
    """What each plan grants, keyed by plan id. Empty when never saved.

    Separate from the pricing cards on purpose: a card is marketing copy an
    operator rewords, translates and reorders; this is the contract the
    billing code acts on.
    """
    try:
        data = json.loads(db.settings_all().get(gate.SETTING_PLAN_FEATURES, "") or "{}")
    except Exception:  # noqa: BLE001 - billing must not break on a bad setting
        return {}
    return data if isinstance(data, dict) else {}


def plan_credits(plan_id: str | None, *, card: dict | None = None) -> int | None:
    """How many credits one paid period of this plan grants, AS OF NOW.

    THE OPERATOR'S CHOICE (2026-10-12): every renewal grants the plan's
    CURRENT figure, so raising a plan's credits reaches existing subscribers
    at their next renewal - and so does lowering it. This replaced copying
    the figure onto the subscription at purchase.

    The Subscription features page is the source. A plan with no entry there
    falls back to the `credits` its pricing card carried before that page
    existed, so nothing already sold stops granting on the day this ships.
    None means "nobody has said": the caller keeps what it already had.
    """
    if not plan_id:
        return None
    entry = plan_features().get(plan_id)
    if isinstance(entry, dict) and entry.get("credits") is not None:
        try:
            return max(0, int(entry["credits"]))
        except (TypeError, ValueError):
            return None
    if card is None:
        try:
            cards = json.loads(db.settings_all().get(gate.SETTING_PRICING_PLANS, "") or "[]")
        except Exception:  # noqa: BLE001
            cards = []
        card = next(
            (c for c in cards if isinstance(c, dict) and c.get("id") == plan_id), None
        ) if isinstance(cards, list) else None
    legacy = (card or {}).get("credits")
    return int(legacy) if legacy else None


def apply_subscription_event(event: dict) -> str | None:
    """Turn a subscription lifecycle event into rows. Returns what it did.

    NEVER RAISES INTO THE WEBHOOK. Stripe retries a non-2xx, and a bug in
    here would turn one bad event into an endless redelivery loop against an
    endpoint that hands out credits. The signature was checked and the event
    was stored; if this half fails, that is a bug to read in the log rather
    than a reason to ask Stripe to try again.
    """
    kind = event.get("type") or ""
    if kind not in stripe.SUBSCRIPTION_EVENTS:
        return None
    try:
        found = stripe.subscription_from_event(event)
        if not found:
            return "not a subscription"

        user_id = resolve_stripe_user(event)
        if not user_id:
            # Real and worth logging loudly: money moved and we cannot say
            # whose it was. The event row is still stored, so it can be
            # reconciled by hand rather than lost.
            return "UNATTRIBUTED"

        customer_id = found.get("customer_id")
        if customer_id:
            # Idempotent, and cheap enough to repeat: it is how a person who
            # subscribed before this column existed gets linked on their
            # first renewal.
            db.stripe_customer_attach(user_id=user_id, customer_id=customer_id)

        subscription_id = found["subscription_id"]
        known = db.subscription_by_stripe_id(subscription_id)
        plan = plan_for_price(found.get("price_id"))

        if kind == "invoice.payment_failed":
            # Carries no items and no period, so nothing but the status may
            # be written from it.
            db.subscription_set_status(
                stripe_subscription_id=subscription_id, status="past_due"
            )
            return "past_due"

        plan_id = (plan or {}).get("id") or (known or {}).get("plan_id")
        current = plan_credits(plan_id, card=plan)

        db.subscription_upsert(
            user_id=user_id,
            stripe_subscription_id=subscription_id,
            plan_id=plan_id,
            stripe_price_id=found.get("price_id"),
            # An invoice does not carry a status; keep the one we had, and
            # treat a paid invoice as proof the subscription is running.
            status=found.get("status")
            or ("active" if kind == "invoice.paid" else (known or {}).get("status"))
            or "active",
            # Kept on the row so the account pages can draw "N credits per
            # month" without asking which plan setting is current.
            credits_per_period=int(
                current if current is not None
                else (known or {}).get("credits_per_period") or 0
            ),
            current_period_end=stripe_time(found.get("current_period_end")),
            cancel_at_period_end=bool(
                found.get("cancel_at_period_end")
                if found.get("cancel_at_period_end") is not None
                else (known or {}).get("cancel_at_period_end")
            ),
            livemode=bool(event.get("livemode")),
        )

        if kind != "invoice.paid":
            return f"status {found.get('status') or 'updated'}"

        # THE GRANT: the plan's figure TODAY (see `plan_credits`), falling
        # back to what the row last recorded when no plan setting answers.
        row = db.subscription_by_stripe_id(subscription_id) or {}
        credits = int(current if current is not None else row.get("credits_per_period") or 0)
        if credits <= 0:
            return "paid, but this plan grants no credits"
        granted = db.subscription_credit(
            user_id=user_id,
            invoice_id=found["invoice_id"],
            credits=credits,
            note=f"{row.get('plan_id') or 'subscription'} renewal",
        )
        return f"granted {credits}" if granted else "already granted"
    except Exception:  # noqa: BLE001 - see the docstring
        logging.getLogger("answergap.api").exception(
            "Subscription event %s failed", event.get("id")
        )
        return "ERROR"


# Statuses in which Stripe will never charge the card again. Everything else -
# `active`, `trialing`, `past_due`, `unpaid`, `incomplete`, `paused` - can still
# turn into a charge, so erasure cancels it.
FINISHED_STATUSES = ("canceled", "incomplete_expired")


class ErasureCancelFailed(Exception):
    """Stripe would not confirm a cancellation, so the erasure must not run."""


def cancel_for_erasure(user_id: int, *, actor: str) -> list[str]:
    """End every paid subscription AT STRIPE before an account is erased.

    Without this an erased customer kept being charged every month: the
    erasure blanked the account, the subscription stayed live at Stripe, and
    each renewal granted credits to a row nobody could sign in to.

    Cancelled NOW, not at period end. A subscription left running to the end
    of its period would outlive the account it belongs to, and the person has
    just asked for that account to go. No refund is issued here; the delete
    screen says so before they confirm.

    ALL OR NOTHING, in Stripe's favour of caution: if any cancellation fails
    this raises and the caller does not erase. An erased account still being
    charged is the bug being fixed; a refusal the person can retry is not.
    A subscription Stripe no longer knows (404) is already not charging, so it
    counts as done. Assigned plans never went near Stripe and are left to the
    erasure itself.
    """
    rows = db.subscriptions_for_user(int(user_id), limit=100)
    paid = [
        r for r in rows
        if r.get("source", "stripe") == "stripe"
        and r.get("stripe_subscription_id")
        and r.get("status") not in FINISHED_STATUSES
    ]
    if paid and stripe.mode() == "missing":
        raise ErasureCancelFailed("noKey")
    cancelled: list[str] = []
    for row in paid:
        sub_id = row["stripe_subscription_id"]
        try:
            stripe.cancel_subscription(sub_id, at_period_end=False)
        except stripe.StripeError as exc:
            if exc.status != 404:
                print(f"[stripe] erasure cancel {sub_id}: {exc}", flush=True)
                raise ErasureCancelFailed(exc.code) from exc
        db.subscription_mark_cancelled(
            subscription_id=int(row["id"]), user_id=int(user_id),
            at_period_end=False, actor=actor, stripe_subscription_id=sub_id,
        )
        cancelled.append(sub_id)
    return cancelled


def describe_failure(event: dict) -> str | None:
    """What went wrong, in Stripe's own codes, for a payment that did not
    happen. Written as the event's effect so the account log can say "card
    declined: insufficient_funds" rather than only "payment failed".
    """
    kind = event.get("type") or ""
    obj = ((event.get("data") or {}).get("object")) or {}
    if kind == "checkout.session.expired":
        return "checkout abandoned"
    if kind in ("payment_intent.payment_failed", "checkout.session.async_payment_failed"):
        error = obj.get("last_payment_error") or {}
        code = error.get("decline_code") or error.get("code") or "unknown"
        message = (error.get("message") or "").strip()
        return f"card declined: {code}" + (f" - {message}" if message else "")
    return None


def stripe_time(value) -> str | None:
    """A Stripe unix timestamp as an ISO string, or None.

    Stripe sends seconds since the epoch; Postgres wants something it can
    parse into a TIMESTAMPTZ.
    """
    if not isinstance(value, (int, float)):
        return None
    return datetime.fromtimestamp(float(value), tz=timezone.utc).isoformat()
