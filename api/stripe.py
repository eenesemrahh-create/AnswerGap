"""Stripe, as far as the admin panel needs it today: do the keys work, and did
a payment actually reach us.

This is NOT the checkout the product will sell with. It is the smallest slice
that proves the pipe: read the account with the secret key, open a Checkout
Session, and receive the webhook that says the money moved. Plans, prices and
credit grants come later, on top of the same three pieces.

SECRETS LIVE ON THE API SERVICE, NOWHERE ELSE. `STRIPE_SECRET_KEY` and
`STRIPE_WEBHOOK_SECRET` are read here and never returned by any endpoint - the
admin service and the browser see the account id and the mode, never a key.
The publishable key is not needed at all: Checkout is hosted by Stripe, so the
browser never talks to Stripe's API directly.

Stdlib only (`urllib`, `hmac`), like `api/ci.py` and `answergap/mailer.py`.
"""

from __future__ import annotations

import hmac
import json
import os
import time
import urllib.error
import urllib.parse
import urllib.request
from hashlib import sha256
from typing import Any

API = "https://api.stripe.com"
TIMEOUT_SECONDS = 15

# Stripe signs `{timestamp}.{body}`; anything older than this is refused, so a
# captured webhook cannot be replayed at leisure. Stripe's own default.
SIGNATURE_TOLERANCE_SECONDS = 300

# What the test payment asks for. Small on purpose - in test mode it is play
# money, and if the live guard is ever lifted it should stay a rounding error.
TEST_AMOUNT_CENTS = 100
TEST_CURRENCY = "usd"


def secret_key() -> str | None:
    return os.environ.get("STRIPE_SECRET_KEY") or None


def webhook_secret() -> str | None:
    return os.environ.get("STRIPE_WEBHOOK_SECRET") or None


def mode() -> str:
    """`test`, `live`, or `unknown` - read from the key's own prefix.

    The Account object does not say which mode issued the request, and a
    restricted key (`rk_`) follows the same convention, so the prefix is the
    honest source. `unknown` is never treated as test.
    """
    key = secret_key() or ""
    if key.startswith(("sk_test_", "rk_test_")):
        return "test"
    if key.startswith(("sk_live_", "rk_live_")):
        return "live"
    return "unknown" if key else "missing"


class StripeError(RuntimeError):
    def __init__(self, code: str, status: int | None = None, detail: str = ""):
        super().__init__(f"{code} ({status}): {detail}")
        self.code = code
        self.status = status
        self.detail = detail


def _request(method: str, path: str, form: dict[str, str] | None = None) -> Any:
    key = secret_key()
    if not key:
        raise StripeError("noKey")
    data = urllib.parse.urlencode(form or {}).encode() if form is not None else None
    request = urllib.request.Request(
        f"{API}{path}",
        data=data,
        method=method,
        headers={
            "Authorization": f"Bearer {key}",
            "User-Agent": "answergap-admin",
            **({"Content-Type": "application/x-www-form-urlencoded"} if data else {}),
        },
    )
    try:
        with urllib.request.urlopen(request, timeout=TIMEOUT_SECONDS) as response:
            return json.loads(response.read() or b"{}")
    except urllib.error.HTTPError as exc:
        body = exc.read().decode("utf-8", "replace")[:500]
        raise StripeError(_code(exc.code, body), exc.code, body) from exc
    except (urllib.error.URLError, TimeoutError, OSError) as exc:
        raise StripeError("unreachable", None, str(exc)) from exc


def _code(status: int, body: str) -> str:
    """A refusal the page can act on, rather than Stripe's English sentence."""
    if status in (401, 403):
        return "keyRefused"
    if status == 429:
        return "rateLimited"
    if status >= 500:
        return "stripeDown"
    try:
        kind = (json.loads(body).get("error") or {}).get("type") or ""
    except Exception:  # noqa: BLE001 - a non-JSON body is Stripe having a bad day
        kind = ""
    return "invalidRequest" if kind else "stripeError"


def account() -> dict:
    """Prove the secret key works. Reads only - no money moves, nothing is created."""
    data = _request("GET", "/v1/account")
    profile = data.get("business_profile") or {}
    return {
        "id": data.get("id"),
        "name": profile.get("name") or data.get("email"),
        "country": data.get("country"),
        "default_currency": data.get("default_currency"),
        "charges_enabled": bool(data.get("charges_enabled")),
        "payouts_enabled": bool(data.get("payouts_enabled")),
        "details_submitted": bool(data.get("details_submitted")),
    }


def checkout_session(
    *,
    success_url: str,
    cancel_url: str,
    email: str | None,
    amount_cents: int | None = None,
) -> dict:
    """A one-off Checkout Session for the fixed test amount.

    Hosted by Stripe: the card is typed on Stripe's page, so no card data ever
    reaches this service or the admin panel. That is the whole reason to use
    Checkout rather than building a payment form.
    """
    form = {
        "mode": "payment",
        "success_url": success_url,
        "cancel_url": cancel_url,
        "line_items[0][quantity]": "1",
        "line_items[0][price_data][currency]": TEST_CURRENCY,
        "line_items[0][price_data][unit_amount]": str(amount_cents or TEST_AMOUNT_CENTS),
        "line_items[0][price_data][product_data][name]": "AnswerGap payment test",
        # Marks the row this creates as a pipe test rather than a real sale, so
        # a later report can exclude it without guessing from the amount.
        "metadata[answergap_purpose]": "integration_test",
    }
    if email:
        form["customer_email"] = email
    data = _request("POST", "/v1/checkout/sessions", form)
    return {"id": data.get("id"), "url": data.get("url")}


# ------------------------------------------------------------------ webhook


def subscription_checkout(
    *,
    price_id: str,
    success_url: str,
    cancel_url: str,
    user_id: int,
    email: str | None,
    customer_id: str | None,
) -> dict:
    """A hosted Checkout Session for one monthly plan.

    `mode=subscription`, so Stripe owns the renewal, the retries and the
    proration on a plan change. That is the point of using Checkout and the
    billing portal rather than building a payment form: the parts of billing
    that are easy to get wrong are the parts we do not write.

    `client_reference_id` CARRIES OUR USER ID, and it is what makes the
    webhook able to attribute a subscription without matching on an email
    address. An address can be changed, shared, or already belong to somebody
    else by the time a renewal arrives a month later; a user id cannot.

    An existing `customer_id` is reused when we have one so the card on file
    and the billing history stay on one customer. Stripe refuses both
    `customer` and `customer_email` together, so it is one or the other.
    """
    form = {
        "mode": "subscription",
        "success_url": success_url,
        "cancel_url": cancel_url,
        "line_items[0][price]": price_id,
        "line_items[0][quantity]": "1",
        "client_reference_id": str(user_id),
        # Repeated on the subscription itself: a renewal invoice a month from
        # now carries the subscription, not this session.
        "subscription_data[metadata][answergap_user_id]": str(user_id),
        "metadata[answergap_user_id]": str(user_id),
    }
    if customer_id:
        form["customer"] = customer_id
    elif email:
        form["customer_email"] = email
    data = _request("POST", "/v1/checkout/sessions", form)
    return {"id": data.get("id"), "url": data.get("url")}


def billing_portal(*, customer_id: str, return_url: str) -> dict:
    """A link to Stripe's own billing portal.

    Cancelling, switching plan, updating a card and downloading invoices all
    live there. Every one of those is a screen we would otherwise have to
    build, keep correct against Stripe's state, and get right in five
    languages - and proration on a mid-period plan change is exactly the
    arithmetic this product has no business re-implementing.
    """
    data = _request(
        "POST",
        "/v1/billing_portal/sessions",
        {"customer": customer_id, "return_url": return_url},
    )
    return {"url": data.get("url")}


def subscription_from_event(event: dict) -> dict | None:
    """The fields `db.subscription_upsert` needs, out of any lifecycle event.

    THREE EVENT SHAPES, one answer. `customer.subscription.*` carries the
    subscription as the object; `invoice.*` carries an invoice that NAMES a
    subscription and holds the period on its line items. Reading each shape
    where the handler needs it would put three copies of this in one function
    and get one of them wrong.

    Returns None when the event is not about a subscription at all - a
    one-off payment still raises `invoice.paid`.
    """
    kind = event.get("type") or ""
    obj = ((event.get("data") or {}).get("object")) or {}

    if kind.startswith("customer.subscription."):
        item = ((obj.get("items") or {}).get("data") or [{}])[0]
        return {
            "subscription_id": obj.get("id"),
            "customer_id": obj.get("customer"),
            "price_id": (item.get("price") or {}).get("id"),
            # `deleted` arrives with whatever status Stripe last had; the
            # event type is the authority on it being over.
            "status": "canceled" if kind.endswith(".deleted") else obj.get("status"),
            "current_period_end": obj.get("current_period_end"),
            "cancel_at_period_end": bool(obj.get("cancel_at_period_end")),
            "user_id": _metadata_user_id(obj),
            "invoice_id": None,
            "quantity": item.get("quantity"),
        }

    if kind.startswith("invoice."):
        subscription_id = obj.get("subscription")
        if not subscription_id:
            return None
        line = ((obj.get("lines") or {}).get("data") or [{}])[0]
        period = line.get("period") or {}
        return {
            "subscription_id": subscription_id,
            "customer_id": obj.get("customer"),
            "price_id": (line.get("price") or {}).get("id"),
            # An invoice does not carry the subscription's status. The caller
            # keeps what it already had for a paid one and marks past_due on
            # a failure, which is what the two handlers below do.
            "status": None,
            "current_period_end": period.get("end"),
            "cancel_at_period_end": None,
            "user_id": _metadata_user_id(obj),
            "invoice_id": obj.get("id"),
            "quantity": line.get("quantity"),
        }

    return None


def _metadata_user_id(obj: dict) -> int | None:
    """Our user id, if this object was created with one on it.

    A hint rather than an authority: the customer id is the link the webhook
    trusts, because metadata is only present on objects we created and a
    renewal invoice is created by Stripe.
    """
    raw = (obj.get("metadata") or {}).get("answergap_user_id")
    try:
        return int(raw) if raw else None
    except (TypeError, ValueError):
        return None


def verify(payload: bytes, header: str, *, secret: str, now: float | None = None) -> bool:
    """Whether this body really came from Stripe, unmodified and recently.

    The header is `t=<unix>,v1=<hex>[,v1=<hex>]`, and the signed string is
    `{t}.{body}` - the RAW body, which is why the endpoint must not re-serialise
    the JSON before checking. Several `v1` values appear while a secret is being
    rotated, so any match counts.

    Compared with `hmac.compare_digest`: a plain `==` leaks, through its own
    timing, how much of a forged signature was right.
    """
    parts = dict(
        piece.split("=", 1) for piece in header.split(",") if "=" in piece
    ) if header else {}
    timestamp = parts.get("t")
    if not timestamp or not secret:
        return False
    try:
        age = (time.time() if now is None else now) - int(timestamp)
    except ValueError:
        return False
    if abs(age) > SIGNATURE_TOLERANCE_SECONDS:
        return False
    signed = f"{timestamp}.".encode() + payload
    expected = hmac.new(secret.encode(), signed, sha256).hexdigest()
    candidates = [
        value for piece in header.split(",")
        if piece.startswith("v1=") for value in [piece[3:]]
    ]
    return any(hmac.compare_digest(expected, value) for value in candidates)


# Events worth recording. Stripe sends dozens of types; storing every one would
# bury the two that answer "did the money arrive?".
INTERESTING = (
    "checkout.session.completed",
    "checkout.session.async_payment_failed",
    "payment_intent.succeeded",
    "payment_intent.payment_failed",
    "charge.refunded",
    # --- subscriptions -------------------------------------------------
    # `invoice.paid` is the one that hands out credits, and it covers BOTH
    # the first month and every renewal - Stripe raises it for the initial
    # invoice too, so granting on `checkout.session.completed` as well would
    # pay the first month twice.
    "invoice.paid",
    "invoice.payment_failed",
    "customer.subscription.created",
    "customer.subscription.updated",
    "customer.subscription.deleted",
)

# The lifecycle events. Recorded like the rest, but they also MOVE CREDITS or
# change what a person is entitled to, which is why they are named separately
# rather than being matched by string in the handler.
SUBSCRIPTION_EVENTS = (
    "customer.subscription.created",
    "invoice.paid",
    "invoice.payment_failed",
    "customer.subscription.updated",
    "customer.subscription.deleted",
)


def summarize_event(event: dict) -> dict | None:
    """The few fields the admin list shows. None for a type we do not record."""
    kind = event.get("type") or ""
    if kind not in INTERESTING:
        return None
    obj = ((event.get("data") or {}).get("object")) or {}
    amount = (
        obj.get("amount_total")
        if obj.get("amount_total") is not None
        else obj.get("amount_received")
        if obj.get("amount_received") is not None
        else obj.get("amount")
    )
    return {
        "event_id": event.get("id"),
        "kind": kind,
        "livemode": bool(event.get("livemode")),
        "amount_cents": int(amount) if isinstance(amount, int) else None,
        "currency": obj.get("currency"),
        "email": obj.get("customer_email")
        or ((obj.get("customer_details") or {}).get("email")),
        "status": obj.get("payment_status") or obj.get("status"),
        "object_id": obj.get("id"),
    }
