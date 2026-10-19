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
            # A FIRST payment that failed is not a plan that fell behind: it
            # was never paid. Stripe holds that subscription as `incomplete`
            # and refuses to update it, so marking it past_due (live) put an
            # unpaid plan on the account page, let it be made the default,
            # and made the next "make default" fail at Stripe (2026-10-19).
            status = ("incomplete" if found.get("billing_reason") == "subscription_create"
                      else "past_due")
            db.subscription_set_status(
                stripe_subscription_id=subscription_id, status=status
            )
            return status

        if (
            kind == "customer.subscription.updated"
            and known and known.get("cancel_at_period_end")
            and found.get("cancel_at_period_end") is False
            and found.get("status") != "canceled"
        ):
            # The scheduled end was undone - the customer renewed in the
            # portal. An admin's clawback mark from before must not apply to
            # whatever cancellation comes months later.
            db.subscription_cancel_withdrawn(
                user_id=user_id, stripe_subscription_id=subscription_id
            )

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

        # A NEW PAID PLAN: only the default renews (operator, 2026-10-19).
        # The first moment it is running is either event, whichever comes
        # first; `_settle_new_plan` is a no-op the second time.
        settled = None
        if kind == "customer.subscription.created" or (
            kind == "invoice.paid" and found.get("billing_reason") == "subscription_create"
        ):
            try:
                settled = _settle_new_plan(user_id, subscription_id)
            except Exception:  # noqa: BLE001 - never at the cost of the grant below
                logging.getLogger("answergap.api").exception(
                    "Settling new plan %s failed", subscription_id)

        if kind == "customer.subscription.deleted":
            # The end of a plan an ADMIN cancelled "at period end": the
            # customer kept the credits until now, and what is left goes now.
            # A cancellation made in the customer's own portal, or by
            # erasure, has no clawback mark and takes nothing.
            marked = db.subscription_cancelled_by_admin(subscription_id)
            if marked:
                taken = db.subscription_clawback(
                    user_id=int(marked["user_id"]),
                    subscription_id=int(marked["id"]),
                    actor=marked.get("actor") or "stripe",
                )
                if taken:
                    return f"status canceled, clawed back {taken}"

        if kind != "invoice.paid":
            return f"status {found.get('status') or 'updated'}" + (f"; {settled}" if settled else "")

        # ONLY A NEW SUBSCRIPTION OR A RENEWAL PAYS A PERIOD'S CREDITS.
        # A plan change raises its own invoice (`subscription_update`) for
        # the prorated difference; granting a full period on it handed out a
        # free month every time somebody switched plans. And never a $0
        # invoice: a downgrade's credit note or a 100% coupon paid nothing.
        # A missing field (an older event) is not a refusal.
        reason = found.get("billing_reason")
        if reason and reason not in ("subscription_create", "subscription_cycle"):
            return f"paid ({reason}), no credits"
        if found.get("amount_paid") == 0:
            return "paid $0, no credits"

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
            # A POCKET: this period's credits burn when this period ends
            # (answergap/credits.py). The invoice line's period is the one
            # paid for; the row's end is the fallback when a line has none.
            subscription_id=row.get("id"),
            expires_at=stripe_time(found.get("current_period_end"))
            or row.get("current_period_end"),
        )
        out = f"granted {credits}" if granted else "already granted"
        return out + (f"; {settled}" if settled else "")
    except Exception:  # noqa: BLE001 - see the docstring
        logging.getLogger("answergap.api").exception(
            "Subscription event %s failed", event.get("id")
        )
        return "ERROR"


def _settle_new_plan(user_id: int, stripe_subscription_id: str) -> str | None:
    """ONLY THE DEFAULT RENEWS (operator, 2026-10-19).

    A plan bought beside a renewing default is set at Stripe to stop at the
    end of its first period; the customer keeps it renewing by making it the
    default, which stops the others instead. With no renewing paid plan
    beside it, the new one simply becomes the default.

    An account from before defaults existed has renewing plans and no
    default: the OLDEST renewing one is taken as the default, so buying a
    second plan never silently stops the one the person already had.

    Idempotent - it runs on whichever of `customer.subscription.created` and
    the first `invoice.paid` arrives first, and does nothing the second time.
    Never raises: a refusal from Stripe is logged and the plan is left
    renewing, which the person can still settle by choosing a default.
    """
    live = db.live_subscriptions(user_id)
    new = next((s for s in live if s.get("stripe_subscription_id") == stripe_subscription_id), None)
    if not new or new.get("is_default") or new.get("cancel_at_period_end"):
        return None
    others = [s for s in live
              if s.get("source") == "stripe" and s.get("stripe_subscription_id")
              and not s.get("cancel_at_period_end") and int(s["id"]) != int(new["id"])]
    if not others:
        db.subscription_set_default(user_id=user_id, subscription_id=int(new["id"]))
        return "made default"
    keep = next((s for s in others if s.get("is_default")), None) or min(
        others, key=lambda s: (str(s.get("created_at") or ""), int(s["id"])))
    if not keep.get("is_default"):
        db.subscription_set_default(user_id=user_id, subscription_id=int(keep["id"]))
    try:
        stripe.cancel_subscription(stripe_subscription_id, at_period_end=True)
    except stripe.StripeError as exc:
        print(f"[stripe] extra plan {stripe_subscription_id} left renewing: {exc}", flush=True)
        _account_event(user_id, "extra_plan_stop_failed",
                       {"subscription_id": int(new["id"]), "error": exc.code})
        return "extra plan: Stripe refused the stop, still renewing"
    db.subscription_mark_ending(user_id=user_id, subscription_id=int(new["id"]))
    _account_event(user_id, "extra_plan_not_renewing",
                   {"subscription_id": int(new["id"]), "plan_id": new.get("plan_id"),
                    "default": int(keep["id"])})
    return "extra plan, stops at period end"


def _account_event(user_id: int, kind: str, detail: dict) -> None:
    try:
        db.account_event_put(user_id=user_id, kind=kind, detail=detail)
    except Exception as exc:  # noqa: BLE001 - a lost log line never fails billing
        print(f"[account-log] {kind} for {user_id} not written: {exc}", flush=True)


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
