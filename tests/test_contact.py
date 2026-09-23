"""The marketing contact form: the product's only open write endpoint.

Unauthenticated by necessity - the people most likely to use it have not
signed up - which makes it the one place a stranger can make this service send
mail from OUR verified domain. The rate limit is therefore not polish; it is
the reason the endpoint is allowed to exist, exactly as the token is for the
pay probe.

Called as plain functions, like test_pay_probe.py. No network: `mailer.send` is
replaced, and what it was asked to send is the assertion.
"""

from __future__ import annotations

from types import SimpleNamespace

import pytest
from fastapi import HTTPException

from answergap import mailer
from api import auth, main


def _request(ip: str = "198.51.100.4") -> SimpleNamespace:
    return SimpleNamespace(headers={"x-forwarded-for": ip})


def _body(**overrides) -> main.ContactRequest:
    payload = {
        "name": "Ada Lovelace",
        "email": "ada@example.com",
        "company": "Analytical Engines",
        "subject": "Enterprise volume",
        "message": "We run 40k questions a month.",
    }
    payload.update(overrides)
    return main.ContactRequest(**payload)


@pytest.fixture(autouse=True)
def _sent(monkeypatch):
    """Capture what would have been mailed, and send nothing."""
    captured: list[dict] = []

    def fake_send(**kwargs):
        captured.append(kwargs)
        return True

    monkeypatch.setattr(mailer, "send", fake_send)
    monkeypatch.setenv("MAIL_REPLY_TO", "support@example.com")
    auth._ATTEMPTS.clear()
    yield captured
    auth._ATTEMPTS.clear()


def test_a_message_is_mailed_to_the_support_address(_sent) -> None:
    assert main.contact(_body(), _request()) == {"ok": True}
    assert len(_sent) == 1
    assert _sent[0]["to"] == "support@example.com"
    assert "Enterprise volume" in _sent[0]["subject"]


def test_reply_to_is_the_sender_not_our_own_mailbox(_sent) -> None:
    """Hitting Reply on a contact mail has to reach the customer.

    `MAIL_REPLY_TO` is right for everything else the product sends - a bounced
    verification mail should land somewhere a human reads - so this is an
    override rather than a change of default.
    """
    main.contact(_body(), _request())
    assert _sent[0]["reply_to_override"] == "ada@example.com"


def test_the_address_is_labelled_unverified_in_both_parts(_sent) -> None:
    """Nothing checks that the sender owns the address they typed.

    So the mail says so. An operator reading it must not take the From line as
    an identity claim, and the quiet way for that to go wrong is a support
    reply that trusts it.
    """
    main.contact(_body(), _request())
    assert "not verified" in _sent[0]["text"].lower()
    assert "not verified" in _sent[0]["html"].lower()


def test_the_message_is_escaped_into_the_html_part(_sent) -> None:
    """The body is attacker-controlled text landing in an HTML document."""
    main.contact(_body(message="<script>alert(1)</script>"), _request())
    assert "<script>" not in _sent[0]["html"]
    assert "&lt;script&gt;" in _sent[0]["html"]


def test_a_subject_cannot_span_several_lines(_sent) -> None:
    """Resend takes JSON so there is no header to inject into - but a subject
    with newlines in it is broken in every mail client, and stripping costs
    nothing."""
    main.contact(_body(subject="Hello\r\nBcc: someone@example.com"), _request())
    assert "\n" not in _sent[0]["subject"]
    assert "\r" not in _sent[0]["subject"]


def test_a_malformed_address_is_refused(_sent) -> None:
    with pytest.raises(HTTPException) as refusal:
        main.contact(_body(email="not-an-address"), _request())
    assert refusal.value.status_code == 400
    assert refusal.value.detail == {"code": "invalidEmail"}
    assert _sent == []


def test_the_limit_is_per_ip_and_counts_refusals(_sent) -> None:
    """Counted BEFORE the address is validated, so a malformed body is not a
    free request. Otherwise the limit is one missing `@` away from meaning
    nothing at all."""
    for _ in range(main.CONTACT_MAX_PER_IP):
        with pytest.raises(HTTPException):
            main.contact(_body(email="nope"), _request())

    # The allowance is spent on refusals alone; a valid message now waits.
    with pytest.raises(HTTPException) as refusal:
        main.contact(_body(), _request())
    assert refusal.value.status_code == 429
    assert refusal.value.detail == {"code": "tooManyRequests"}
    assert _sent == []


def test_one_sender_does_not_lock_out_another(_sent) -> None:
    """The key is the hashed address, so the limit is per origin rather than
    global - otherwise a single spammer closes the form for everybody."""
    for _ in range(main.CONTACT_MAX_PER_IP):
        main.contact(_body(), _request("203.0.113.1"))
    main.contact(_body(), _request("203.0.113.2"))
    assert len(_sent) == main.CONTACT_MAX_PER_IP + 1


def test_a_provider_refusal_is_still_a_200(monkeypatch, _sent) -> None:
    """`mailer.send` returns False rather than raising when the provider says
    no. Telling the visitor "that did not send" when the failure is ours
    invites them to send it four more times; the provider log is where that is
    diagnosed."""
    monkeypatch.setattr(mailer, "send", lambda **kwargs: False)
    assert main.contact(_body(), _request()) == {"ok": True}


def test_nothing_is_written_to_the_database(monkeypatch, _sent) -> None:
    """The privacy line under the form promises this, so it is pinned.

    There is no contact table and no row to leak. If a future change adds
    storage, the sentence on the page has to change in the same commit.
    """
    import answergap.db as db

    def explode(*args, **kwargs):  # pragma: no cover - the point is not reaching it
        raise AssertionError("contact must not touch the database")

    monkeypatch.setattr(db, "connect", explode)
    assert main.contact(_body(), _request()) == {"ok": True}
