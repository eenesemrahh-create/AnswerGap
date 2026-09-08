"""A forged or expired token must not be a session.

`answergap/tokens.py` is the whole of session identity - there is no session
table, so a token that verifies IS a signed-in user. Every way of getting one
without the secret is pinned here.

Pure by construction: `now` is an argument, so these tests have no clock, no
database and no fixtures.
"""

from __future__ import annotations

import pytest

from answergap import tokens

SECRET = "test-secret"
NOW = 1_700_000_000


def _token(now: int = NOW, ttl: int = 60) -> str:
    return tokens.sign({"uid": 7, "em": "a@b.com", "ep": 1}, SECRET, now=now, ttl_seconds=ttl)


def test_round_trip_returns_the_claims() -> None:
    """The happy path, and the claims the gate depends on survive it."""
    payload = tokens.verify(_token(), SECRET, now=NOW + 1)
    assert payload is not None
    assert payload["uid"] == 7
    assert payload["em"] == "a@b.com"
    assert payload["ep"] == 1


def test_a_tampered_signature_is_not_a_session() -> None:
    """Flip one character of the MAC and the token must die."""
    encoded, _, mac = _token().partition(".")
    forged = f"{encoded}.{'A' if mac[0] != 'A' else 'B'}{mac[1:]}"
    assert tokens.verify(forged, SECRET, now=NOW + 1) is None


def test_a_tampered_payload_is_not_a_session() -> None:
    """The interesting attack: keep the signature, edit the user id.

    An implementation that decoded the payload before checking the MAC - or
    checked the MAC against the decoded bytes rather than the encoded string -
    would pass every other test in this file and fail only this one.
    """
    original = _token()
    encoded, _, mac = original.partition(".")
    other = tokens.b64u(b'{"em":"a@b.com","ep":1,"exp":9999999999,"iat":1,"uid":1}')
    assert tokens.verify(f"{other}.{mac}", SECRET, now=NOW + 1) is None


def test_expiry_is_enforced() -> None:
    """A token past its exp is refused even though its signature is perfect."""
    token = _token(ttl=60)
    assert tokens.verify(token, SECRET, now=NOW + 59) is not None
    assert tokens.verify(token, SECRET, now=NOW + 61) is None


def test_a_token_signed_with_another_secret_does_not_verify() -> None:
    """Rotating SESSION_SECRET must invalidate everything already issued."""
    assert tokens.verify(_token(), "other-secret", now=NOW + 1) is None


def test_signing_with_an_empty_secret_raises() -> None:
    """An unset SESSION_SECRET is a misconfiguration, not a signing key.

    Signing with b"" would produce tokens that anyone could forge, silently.
    """
    with pytest.raises(ValueError):
        tokens.sign({"uid": 1}, "", now=NOW)


def test_verifying_with_an_empty_secret_refuses_everything() -> None:
    """The same misconfiguration on the read side must fail CLOSED."""
    assert tokens.verify(_token(), "", now=NOW + 1) is None


@pytest.mark.parametrize("junk", ["", "no-dot", ".", "a.", ".b", "a.b.c.d"])
def test_malformed_tokens_return_none_rather_than_raising(junk: str) -> None:
    """Garbage arrives from the internet; it must not become a 500."""
    assert tokens.verify(junk, SECRET, now=NOW) is None
