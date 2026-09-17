"""The link-gated payment page: every way in that must stay shut.

This is the only payment path with no signed-in actor behind it, and it mints
Stripe Checkout sessions for an amount the caller types. Left open it would be
a card-testing target - a stolen card list validated against our account, which
Stripe freezes accounts over. So the token, the bounds and the rate limit are
not polish; they are the reason the endpoint is allowed to exist.

Called as plain functions, like test_pricing.py. No network: `stripe._request`
is replaced, and a call reaching it in a refusal test is itself the failure.
"""

from __future__ import annotations

from types import SimpleNamespace

import pytest
from fastapi import HTTPException

from api import auth, main, stripe

TOKEN = "probe-secret-token"


def _request(ip: str = "203.0.113.7") -> SimpleNamespace:
    return SimpleNamespace(headers={"x-forwarded-for": ip})


def _body(amount: int = 100, token: str = TOKEN) -> main.PayProbeRequest:
    return main.PayProbeRequest(token=token, amount_cents=amount)


@pytest.fixture(autouse=True)
def _configured(monkeypatch):
    monkeypatch.setattr(main, "PAY_PROBE_TOKEN", TOKEN)
    monkeypatch.setenv("STRIPE_SECRET_KEY", "sk_test_abc")
    monkeypatch.setattr(auth, "WEB_BASE_URL", "https://app.example.com")
    auth._ATTEMPTS.clear()
    yield
    auth._ATTEMPTS.clear()


@pytest.fixture
def stripe_calls(monkeypatch):
    calls: list[dict] = []

    def fake(method, path, form=None):
        calls.append({"path": path, "form": form})
        return {"id": "cs_1", "url": "https://checkout.stripe.com/c/pay/cs_1"}

    monkeypatch.setattr(stripe, "_request", fake)
    return calls


def _refuses(func, *args) -> HTTPException:
    with pytest.raises(HTTPException) as caught:
        func(*args)
    return caught.value


# ------------------------------------------------------------------- closed


def test_without_a_token_configured_the_endpoint_does_not_exist(monkeypatch, stripe_calls) -> None:
    """404, not 403: an endpoint nobody enabled should not announce itself."""
    monkeypatch.setattr(main, "PAY_PROBE_TOKEN", "")
    assert _refuses(main.pay_probe_session, _body(), _request()).status_code == 404
    assert _refuses(main.pay_probe_config).status_code == 404
    assert stripe_calls == []


def test_a_wrong_token_buys_nothing(stripe_calls) -> None:
    error = _refuses(main.pay_probe_session, _body(token="guess"), _request())
    assert error.status_code == 403 and error.detail["code"] == "badToken"
    assert stripe_calls == []


def test_an_empty_token_is_not_a_way_in(stripe_calls) -> None:
    assert _refuses(main.pay_probe_session, _body(token=""), _request()).status_code == 403
    assert stripe_calls == []


# ------------------------------------------------------------------- bounds


@pytest.mark.parametrize("amount", [0, -100, 49, main.PAY_PROBE_MAX_CENTS + 1, 100_000])
def test_an_amount_outside_the_bounds_is_refused(amount, stripe_calls) -> None:
    """A mistyped 100000 must not become a $1,000 charge."""
    error = _refuses(main.pay_probe_session, _body(amount), _request())
    assert error.status_code == 400 and error.detail["code"] == "amountOutOfRange"
    assert stripe_calls == []


@pytest.mark.parametrize("amount", [main.PAY_PROBE_MIN_CENTS, 1000, main.PAY_PROBE_MAX_CENTS])
def test_the_bounds_themselves_are_allowed(amount, stripe_calls) -> None:
    out = main.pay_probe_session(_body(amount), _request())
    assert out["url"].startswith("https://checkout.stripe.com/")
    assert stripe_calls[0]["form"]["line_items[0][price_data][unit_amount]"] == str(amount)


# --------------------------------------------------------------- rate limit


def test_guessing_the_token_is_rate_limited_too(stripe_calls) -> None:
    """The counter runs BEFORE the comparison, so guesses are not free."""
    for _ in range(main.PAY_PROBE_MAX_PER_IP):
        assert _refuses(main.pay_probe_session, _body(token="wrong"), _request()).status_code == 403
    later = _refuses(main.pay_probe_session, _body(), _request())
    assert later.status_code == 429, "a valid token after the window is spent is still refused"
    assert stripe_calls == []


def test_one_address_running_out_does_not_refuse_another(stripe_calls) -> None:
    for _ in range(main.PAY_PROBE_MAX_PER_IP + 1):
        try:
            main.pay_probe_session(_body(), _request("203.0.113.7"))
        except HTTPException:
            pass
    out = main.pay_probe_session(_body(), _request("198.51.100.4"))
    assert out["url"]


# ---------------------------------------------------------------- the happy


def test_a_good_request_returns_a_stripe_hosted_link(stripe_calls) -> None:
    out = main.pay_probe_session(_body(250), _request())
    assert out == {"url": "https://checkout.stripe.com/c/pay/cs_1", "mode": "test"}
    form = stripe_calls[0]["form"]
    assert form["line_items[0][price_data][unit_amount]"] == "250"
    assert form["success_url"] == "https://app.example.com/pay?paid=1"
    # No email is collected here: the page asks for an amount and nothing else.
    assert "customer_email" not in form


def test_with_no_stripe_key_it_says_so_rather_than_failing_oddly(monkeypatch, stripe_calls) -> None:
    monkeypatch.delenv("STRIPE_SECRET_KEY", raising=False)
    error = _refuses(main.pay_probe_session, _body(), _request())
    assert error.status_code == 503 and error.detail["code"] == "noKey"
    assert stripe_calls == []


def test_the_config_never_carries_the_token() -> None:
    assert TOKEN not in str(main.pay_probe_config())
