"""The payment pipe: signature verification, mode detection, and the guards.

No network and no Stripe account. `stripe._request` is replaced where a call
would happen, and the signature tests build real HMACs with the same stdlib
Stripe uses - so these check the actual comparison, not a mock of it.

The webhook is the security boundary here: it is a public endpoint that writes
rows the admin panel presents as payments. Everything below defends that.
"""

from __future__ import annotations

import hmac
import json
import time
from hashlib import sha256
from types import SimpleNamespace

import pytest

from api import admin, stripe

SECRET = "whsec_testsecret"


def _signed(body: bytes, *, secret: str = SECRET, when: float | None = None) -> str:
    timestamp = int(time.time() if when is None else when)
    digest = hmac.new(secret.encode(), f"{timestamp}.".encode() + body, sha256).hexdigest()
    return f"t={timestamp},v1={digest}"


@pytest.fixture(autouse=True)
def _clean_env(monkeypatch):
    monkeypatch.delenv("STRIPE_SECRET_KEY", raising=False)
    monkeypatch.delenv("STRIPE_WEBHOOK_SECRET", raising=False)


# ------------------------------------------------------------------ the mode


@pytest.mark.parametrize(
    ("key", "expected"),
    [
        ("sk_test_abc", "test"),
        ("rk_test_abc", "test"),
        ("sk_live_abc", "live"),
        ("rk_live_abc", "live"),
        ("pk_test_abc", "unknown"),
        ("nonsense", "unknown"),
        ("", "missing"),
    ],
)
def test_the_mode_is_read_from_the_key_prefix(monkeypatch, key, expected) -> None:
    """Stripe's Account object does not say which mode issued the call."""
    if key:
        monkeypatch.setenv("STRIPE_SECRET_KEY", key)
    assert stripe.mode() == expected


def test_an_unrecognised_key_is_never_treated_as_test(monkeypatch) -> None:
    monkeypatch.setenv("STRIPE_SECRET_KEY", "sk_something_new")
    assert stripe.mode() == "unknown"


# ------------------------------------------------------------- the signature


def test_a_genuine_stripe_signature_is_accepted() -> None:
    body = b'{"id":"evt_1","type":"checkout.session.completed"}'
    assert stripe.verify(body, _signed(body), secret=SECRET) is True


def test_a_changed_body_fails_even_with_a_valid_header() -> None:
    body = b'{"amount_total":100}'
    header = _signed(body)
    assert stripe.verify(b'{"amount_total":9999999}', header, secret=SECRET) is False


def test_a_signature_from_another_secret_fails() -> None:
    body = b"{}"
    assert stripe.verify(body, _signed(body, secret="whsec_someoneelse"), secret=SECRET) is False


def test_an_old_signature_is_refused_so_it_cannot_be_replayed() -> None:
    body = b"{}"
    stale = _signed(body, when=time.time() - stripe.SIGNATURE_TOLERANCE_SECONDS - 5)
    assert stripe.verify(body, stale, secret=SECRET) is False
    fresh = _signed(body, when=time.time() - 10)
    assert stripe.verify(body, fresh, secret=SECRET) is True


def test_any_of_several_v1_values_may_match_during_rotation() -> None:
    body = b"{}"
    good = _signed(body)
    header = f"{good},v1=" + "0" * 64
    assert stripe.verify(body, header, secret=SECRET) is True


@pytest.mark.parametrize("header", ["", "garbage", "t=,v1=abc", "v1=abc", "t=abc,v1=def"])
def test_a_malformed_header_is_refused_rather_than_crashing(header) -> None:
    assert stripe.verify(b"{}", header, secret=SECRET) is False


def test_no_secret_means_no_signature_can_pass() -> None:
    body = b"{}"
    assert stripe.verify(body, _signed(body), secret="") is False


# ----------------------------------------------------------------- the event


def test_only_payment_events_are_recorded() -> None:
    assert stripe.summarize_event({"type": "invoice.created", "id": "evt_x"}) is None
    out = stripe.summarize_event({
        "id": "evt_1",
        "type": "checkout.session.completed",
        "livemode": False,
        "data": {"object": {"id": "cs_1", "amount_total": 100, "currency": "usd",
                            "payment_status": "paid",
                            "customer_details": {"email": "op@example.com"}}},
    })
    assert out == {
        "event_id": "evt_1",
        "kind": "checkout.session.completed",
        "livemode": False,
        "amount_cents": 100,
        "currency": "usd",
        "email": "op@example.com",
        "status": "paid",
        "object_id": "cs_1",
    }


def test_a_live_event_is_marked_as_such() -> None:
    out = stripe.summarize_event({
        "id": "evt_2", "type": "payment_intent.succeeded", "livemode": True,
        "data": {"object": {"id": "pi_2", "amount_received": 4900, "currency": "usd",
                            "status": "succeeded"}},
    })
    assert out["livemode"] is True and out["amount_cents"] == 4900


# ----------------------------------------------------------------- the guard


@pytest.fixture
def as_admin(monkeypatch):
    logged: list[dict] = []
    monkeypatch.setattr(
        admin, "require_admin", lambda request: SimpleNamespace(email="op@example.com")
    )
    monkeypatch.setattr(admin.db, "admin_log", lambda **kw: logged.append(kw))
    monkeypatch.setattr(admin, "WEB_BASE_URL", "https://app.example.com")
    return logged


def _no_calls(monkeypatch):
    def boom(*args, **kwargs):  # pragma: no cover - reaching it is the failure
        raise AssertionError("Stripe must not be called here")
    monkeypatch.setattr(stripe, "_request", boom)


def test_a_live_key_cannot_start_a_test_payment(monkeypatch, as_admin) -> None:
    """A "test" that charges a real card is a purchase, not a test."""
    monkeypatch.setenv("STRIPE_SECRET_KEY", "sk_live_abc")
    _no_calls(monkeypatch)
    assert admin.stripe_test_payment(None) == {
        "ok": False, "error": "liveKeyRefused", "url": None
    }
    assert as_admin == [], "nothing was attempted, so nothing is on the record"


def test_an_unknown_key_cannot_start_a_test_payment(monkeypatch, as_admin) -> None:
    monkeypatch.setenv("STRIPE_SECRET_KEY", "sk_weird")
    _no_calls(monkeypatch)
    assert admin.stripe_test_payment(None)["error"] == "liveKeyRefused"


def test_no_key_at_all_says_so(monkeypatch, as_admin) -> None:
    _no_calls(monkeypatch)
    assert admin.stripe_test_payment(None)["error"] == "noKey"


def test_a_test_key_opens_a_session_and_the_attempt_is_audited(monkeypatch, as_admin) -> None:
    monkeypatch.setenv("STRIPE_SECRET_KEY", "sk_test_abc")
    seen: dict = {}

    def fake(method, path, form=None):
        seen.update(method=method, path=path, form=form)
        return {"id": "cs_test_1", "url": "https://checkout.stripe.com/c/pay/cs_test_1"}

    monkeypatch.setattr(stripe, "_request", fake)
    out = admin.stripe_test_payment(None)
    assert out["ok"] is True and out["url"].startswith("https://checkout.stripe.com/")
    assert seen["path"] == "/v1/checkout/sessions"
    assert seen["form"]["line_items[0][price_data][unit_amount]"] == "100"
    assert seen["form"]["metadata[answergap_purpose]"] == "integration_test"
    assert as_admin == [{
        "actor": "op@example.com",
        "action": "stripe_test_payment",
        "detail": {"amount_cents": 100, "mode": "test"},
    }]


def test_the_status_never_returns_key_material(monkeypatch, as_admin) -> None:
    monkeypatch.setenv("STRIPE_SECRET_KEY", "sk_test_supersecretvalue")
    monkeypatch.setenv("STRIPE_WEBHOOK_SECRET", "whsec_alsosecret")
    monkeypatch.setattr(stripe, "_request", lambda *a, **k: {"id": "acct_1",
                                                            "charges_enabled": True})
    monkeypatch.setattr(admin.db, "available", lambda: False)
    body = json.dumps(admin.stripe_status(None))
    assert "supersecretvalue" not in body and "alsosecret" not in body
    assert '"mode": "test"' in body and '"webhook_configured": true' in body


def test_a_refused_key_is_reported_beside_what_is_known(monkeypatch, as_admin) -> None:
    monkeypatch.setenv("STRIPE_SECRET_KEY", "sk_test_abc")

    def refuse(*args, **kwargs):
        raise stripe.StripeError("keyRefused", 401, "Invalid API Key provided")

    monkeypatch.setattr(stripe, "_request", refuse)
    monkeypatch.setattr(admin.db, "available", lambda: False)
    out = admin.stripe_status(None)
    assert out["error"] == "keyRefused" and out["account"] is None
    assert out["mode"] == "test", "the mode is known from the key, refused or not"
