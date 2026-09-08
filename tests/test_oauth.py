"""An open redirect is a session handed to a stranger.

`answergap/oauth.py` decides two things that a mistake in either would hand an
account away: where a completed sign-in is allowed to return to, and which
claims in a Google ID token we are willing to believe.

Nothing here touches the network. `exchange_code` is the only function in that
module that does, and it is deliberately the only one not covered here.
"""

from __future__ import annotations

import json

import pytest

from answergap import oauth, tokens

SECRET = "test-secret"
CLIENT_ID = "1234.apps.googleusercontent.com"
NOW = 1_700_000_000
ALLOWED = oauth.parse_origins("https://app.up.railway.app,https://admin.up.railway.app")


# ---------------------------------------------------------- return_allowed


def test_an_exact_origin_is_allowed() -> None:
    assert oauth.return_allowed("https://app.up.railway.app/tree/x?a=1", ALLOWED)


def test_a_suffix_lookalike_is_refused() -> None:
    """THE test. `startswith` would wave this through.

    `https://admin.up.railway.app.evil.com` begins with an allowed origin and
    belongs to somebody else. The thing being redirected is the session, so a
    prefix check here is an account handover.
    """
    assert not oauth.return_allowed("https://admin.up.railway.app.evil.com/x", ALLOWED)


def test_an_unrelated_origin_is_refused() -> None:
    assert not oauth.return_allowed("https://evil.com", ALLOWED)


def test_the_scheme_is_part_of_the_origin() -> None:
    """http:// is not https:// - downgrading would expose the token in transit."""
    assert not oauth.return_allowed("http://app.up.railway.app", ALLOWED)


def test_an_empty_allowlist_accepts_nothing() -> None:
    """Fails closed, like ADMIN_EMAILS - an unset variable is not permission."""
    assert not oauth.return_allowed("https://app.up.railway.app", frozenset())


@pytest.mark.parametrize("junk", ["", "not a url", "javascript:alert(1)", "//evil.com"])
def test_non_http_targets_are_refused(junk: str) -> None:
    assert not oauth.return_allowed(junk, ALLOWED)


# ------------------------------------------------------------------- state


def test_state_round_trip_carries_the_return_target_and_verifier() -> None:
    state = oauth.make_state(return_to="https://app.up.railway.app", verifier="v", secret=SECRET, now=NOW)
    payload = oauth.read_state(state, SECRET, now=NOW + 1)
    assert payload is not None
    assert payload["rt"] == "https://app.up.railway.app"
    assert payload["cv"] == "v"


def test_a_tampered_state_is_refused() -> None:
    """The state is what carries the return target. Editing it must not work."""
    state = oauth.make_state(return_to="https://app.up.railway.app", verifier="v", secret=SECRET, now=NOW)
    encoded, _, mac = state.partition(".")
    forged = tokens.b64u(json.dumps({"rt": "https://evil.com", "cv": "v", "exp": 9999999999}).encode())
    assert oauth.read_state(f"{forged}.{mac}", SECRET, now=NOW + 1) is None


def test_an_expired_state_is_refused() -> None:
    state = oauth.make_state(return_to="https://app.up.railway.app", verifier="v", secret=SECRET, now=NOW)
    assert oauth.read_state(state, SECRET, now=NOW + oauth.STATE_TTL_SECONDS + 1) is None


# ------------------------------------------------------------- id token


def _id_token(**overrides) -> str:
    claims = {
        "iss": "https://accounts.google.com",
        "aud": CLIENT_ID,
        "sub": "google-sub-1",
        "email": "a@b.com",
        "email_verified": True,
        "exp": NOW + 600,
    }
    claims.update(overrides)
    body = tokens.b64u(json.dumps(claims).encode())
    return f"header.{body}.signature"


def test_a_well_formed_token_yields_its_claims() -> None:
    claims = oauth.claims_from_id_token(_id_token(), client_id=CLIENT_ID, now=NOW)
    assert claims is not None
    assert claims["sub"] == "google-sub-1"


def test_a_token_for_another_application_is_refused() -> None:
    """aud is what stops a token minted for a different app being replayed here."""
    assert oauth.claims_from_id_token(_id_token(aud="someone-else"), client_id=CLIENT_ID, now=NOW) is None


def test_a_token_from_another_issuer_is_refused() -> None:
    assert oauth.claims_from_id_token(_id_token(iss="https://evil.com"), client_id=CLIENT_ID, now=NOW) is None


def test_an_expired_token_is_refused() -> None:
    assert oauth.claims_from_id_token(_id_token(exp=NOW - 1), client_id=CLIENT_ID, now=NOW) is None


def test_an_unverified_email_is_refused() -> None:
    """One line, and it is the difference between an allowlist and a claim.

    ADMIN_EMAILS matches on the address. If an unverified address were accepted,
    anyone could assert an admin's address and be believed.
    """
    assert oauth.claims_from_id_token(_id_token(email_verified=False), client_id=CLIENT_ID, now=NOW) is None
    assert oauth.claims_from_id_token(_id_token(email_verified="true"), client_id=CLIENT_ID, now=NOW) is None


@pytest.mark.parametrize("junk", ["", "a.b", "a.!!!.c", "a.b.c.d"])
def test_malformed_id_tokens_return_none(junk: str) -> None:
    assert oauth.claims_from_id_token(junk, client_id=CLIENT_ID, now=NOW) is None


# -------------------------------------------------------------------- pkce


def test_pkce_challenge_matches_the_rfc_example() -> None:
    """RFC 7636 Appendix B. Pinning it against the spec, not against ourselves."""
    verifier = "dBjftJeZ4CVP-mB92K27uhbUJU1p1r_wW1gFWFOEjXk"
    assert oauth.pkce_challenge(verifier) == "E9Melhoa2OwvFrEMTJguCHaoeK1t8URWbuGJSstw-cM"
