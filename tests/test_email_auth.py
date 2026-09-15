"""The rest of email sign-in: the mail templates, the gate, and one trap.

Three separate surfaces, all reachable without a database or a network:

  * `mailer.render` is pure, so the copy, the locale fallback and the link
    placement are testable without a provider account.
  * `gate.decide`'s unverified branch, including the ORDER it sits in.
  * `api.auth.identity` - specifically the rule that an unverified account is
    never an admin, which is the one genuine privilege-escalation trap this
    feature introduced.
"""

from __future__ import annotations

import time

import pytest
from fastapi import HTTPException

from answergap import gate, mailer, tokens
from api import auth

SECRET = "test-secret"


class FakeRequest:
    """Everything `identity` touches, and nothing else."""

    def __init__(self, headers: dict[str, str] | None = None) -> None:
        self.headers = {k.lower(): v for k, v in (headers or {}).items()}


# ============================================================ mail templates


def test_both_purposes_render_and_carry_the_link():
    for purpose in (mailer.SUBJECTS):
        subject, text, html = mailer.render(purpose, link="https://x.test/go?t=1")
        assert subject
        # The raw URL must appear in the TEXT part too. It is the fallback when
        # a button does not render, which is most plain-text clients.
        assert "https://x.test/go?t=1" in text
        assert "https://x.test/go?t=1" in html


def test_an_unknown_purpose_is_a_programming_error():
    with pytest.raises(ValueError):
        mailer.render("invoice", link="https://x.test/")


def test_every_locale_the_app_ships_has_its_own_subject():
    """Five locales, like every other string a reader sees.

    Nothing can enforce this at build time the way `en.ts` enforces the web
    catalogue, so it is enforced here instead.
    """
    for locale in ("en", "tr", "de", "es", "fr"):
        subject, _, _ = mailer.render("verify", link="https://x.test/", locale=locale)
        assert subject
    subjects = {
        mailer.render("verify", link="https://x.test/", locale=loc)[0]
        for loc in ("en", "tr", "de", "es", "fr")
    }
    assert len(subjects) == 5, "a locale is falling back to English"


def test_an_unknown_locale_falls_back_to_english_not_to_blank():
    english, _, _ = mailer.render("verify", link="https://x.test/", locale="en")
    klingon, _, _ = mailer.render("verify", link="https://x.test/", locale="tlh")
    assert klingon == english


def test_the_link_is_escaped_into_the_html():
    """A token is URL-safe base64, but the renderer must not depend on that.

    An unescaped `&` or `"` in an href is a broken link at best and an
    injection point at worst.
    """
    _, _, html = mailer.render("reset", link='https://x.test/?a=1&b="2"')
    assert "&amp;" in html
    assert '&quot;' in html
    # And the unescaped form must NOT be present in an attribute.
    assert 'href="https://x.test/?a=1&b="2""' not in html


def test_html_carries_no_external_assets():
    """Email clients are not browsers: a stylesheet or webfont never arrives,
    and Outlook renders through Word. Everything must be inline."""
    _, _, html = mailer.render("verify", link="https://x.test/")
    assert "<link" not in html
    assert "<style" not in html
    assert "fonts.googleapis" not in html


def test_console_backend_reports_success(capsys, monkeypatch):
    """A machine with no provider must look like a working machine.

    The log IS the outbox there, so reporting failure would make every local
    signup look broken - the same reasoning that keeps the filesystem storage
    backend alive without DATABASE_URL.
    """
    monkeypatch.delenv("RESEND_API_KEY", raising=False)
    monkeypatch.delenv("MAIL_FROM", raising=False)
    assert mailer.available() is False
    assert mailer.backend() == "console"
    assert mailer.send(to="a@b.test", subject="S", text="LINK-HERE", html="<p>x</p>")
    assert "LINK-HERE" in capsys.readouterr().out


def test_backend_needs_both_key_and_sender(monkeypatch):
    """A key with no verified From address sends nothing; an address with no
    key has nothing to send it with."""
    monkeypatch.setenv("RESEND_API_KEY", "re_x")
    monkeypatch.delenv("MAIL_FROM", raising=False)
    assert mailer.available() is False
    monkeypatch.setenv("MAIL_FROM", "AnswerGap <hi@answergap.com>")
    assert mailer.available() is True


def test_log_masking_keeps_addresses_out_of_the_log():
    assert mailer._mask("ahmet@example.com") == "a**@example.com"
    assert mailer._mask("nonsense") == "***"


# ============================================================ email syntax


@pytest.mark.parametrize(
    "address",
    [
        "a@b.co",
        "first.last+tag@sub.example.co.uk",
        "user_name@example.com",
        "x" * 60 + "@example.com",
    ],
)
def test_real_addresses_are_accepted(address):
    assert gate.looks_like_email(address)


@pytest.mark.parametrize(
    "address",
    [
        None, "", "nope", "@example.com", "user@", "a@b@c.com",
        "user name@example.com", "user@localhost", "user@.com",
        "user@example.", "user@ex..ample.com", "x" * 250 + "@example.com",
    ],
)
def test_undeliverable_shapes_are_refused(address):
    assert not gate.looks_like_email(address)


def test_the_check_is_deliberately_loose():
    """The verification mail is the real validation.

    An address that does not exist never receives its link, never verifies and
    never gets credits - so a syntactic check that accepts a superset costs
    nothing, while one that is too strict silently rejects real people.
    """
    # RFC 5321 permits stranger local parts than most regexes allow.
    assert gate.looks_like_email("weird!#$%&'*+-/=?^_`{|}~@example.com")


# ============================================================ the gate


def _state(**kw):
    return gate.State(accounts_enabled=True, status=gate.STATUS_ACTIVE, **kw)


def test_an_unverified_account_is_refused_with_its_own_code():
    who = gate.Identity(user_id=1, email="a@b.test")
    out = gate.decide(
        who, _state(email_verified=False, balance=0), action="search", units=1
    )
    assert not out.allowed
    assert out.code == "emailUnverified"
    assert out.http_status == 403
    assert out.outcome == gate.REFUSED_UNVERIFIED


def test_unverified_is_checked_BEFORE_the_balance():
    """Order is the message, and this is the test that pins it.

    An unverified account has a balance of zero by construction - the signup
    grant waits for verification - so a balance check running first would
    refuse every one of these with "you are out of credits". True, and useless:
    the action they need is in their inbox, not in a shop.
    """
    who = gate.Identity(user_id=1, email="a@b.test")
    out = gate.decide(
        who, _state(email_verified=False, balance=0), action="search", units=1
    )
    assert out.code == "emailUnverified"
    assert out.code != "noCredits"


def test_a_verified_account_with_credits_is_unaffected():
    who = gate.Identity(user_id=1, email="a@b.test")
    out = gate.decide(
        who, _state(email_verified=True, balance=5), action="search", units=1
    )
    assert out.allowed and out.affordable_units == 1


def test_verification_defaults_to_true_for_callers_that_predate_it():
    """Every call site written before password accounts existed passes a Google
    row, where the address was verified by Google. Defaulting to False would
    have refused all of them on deploy."""
    who = gate.Identity(user_id=1, email="a@b.test")
    assert gate.decide(who, _state(balance=1), action="search", units=1).allowed


def test_anonymous_visitors_are_not_touched_by_the_verification_rule():
    """The branch lives inside `if identity.signed_in`. A signed-out visitor
    has no address to verify and must still get the free daily search."""
    who = gate.Identity(anon_id="browser-1")
    out = gate.decide(
        who,
        gate.State(accounts_enabled=True, email_verified=False, anon_limit=1),
        action="search",
        units=1,
    )
    assert out.allowed


# ================================================ the escalation trap


def _token(email: str, *, ev: bool) -> str:
    return tokens.sign(
        {"uid": 7, "em": email, "ep": 1, "ev": ev}, SECRET, now=int(time.time())
    )


@pytest.fixture
def admin_env(monkeypatch):
    monkeypatch.setattr(auth, "SESSION_SECRET", SECRET)
    monkeypatch.setattr(auth, "ADMIN_EMAILS", gate.parse_admin_emails("boss@x.com"))


def test_an_unverified_admin_address_is_NOT_an_admin(admin_env):
    """THE TRAP THIS FEATURE INTRODUCED, and the test that closes it.

    `ADMIN_EMAILS` matches on the address. A password signup may type ANY
    address, the operator's included. Without the `and verified` in
    `identity`, "sign up as the admin address and never open the inbox" would
    be an admin session - no mail, no proof, full panel.
    """
    who = auth.identity(
        FakeRequest({"authorization": f"Bearer {_token('boss@x.com', ev=False)}"})
    )
    assert who.signed_in
    assert who.email == "boss@x.com"
    assert who.is_admin is False
    assert auth.role_of(who) == "user"


def test_a_verified_admin_address_is_an_admin(admin_env):
    who = auth.identity(
        FakeRequest({"authorization": f"Bearer {_token('boss@x.com', ev=True)}"})
    )
    assert who.is_admin is True
    assert auth.role_of(who) == "admin"


def test_a_token_without_the_claim_is_treated_as_verified(admin_env):
    """Tokens signed before password accounts existed carry no `ev`. They were
    all Google sign-ins, where the address WAS verified - so True is the
    correct reading, and False would have signed everyone out on deploy."""
    old = tokens.sign({"uid": 7, "em": "boss@x.com", "ep": 1}, SECRET, now=int(time.time()))
    who = auth.identity(FakeRequest({"authorization": f"Bearer {old}"}))
    assert who.email_verified is True
    assert who.is_admin is True


def test_identity_still_makes_no_query(admin_env, monkeypatch):
    """`/api/meta` is Railway's healthcheck path. A SELECT here would cost
    ~150 ms on every page load and a restart loop in the bad case."""

    def explode(*_a, **_k):
        raise AssertionError("identity() must not touch the database")

    monkeypatch.setattr(auth.db, "connect", explode)
    monkeypatch.setattr(auth.db, "user_for_gate", explode)
    auth.identity(
        FakeRequest({"authorization": f"Bearer {_token('boss@x.com', ev=True)}"})
    )


# ============================================================ rate limiting


def test_the_window_allows_exactly_its_limit(monkeypatch):
    monkeypatch.setattr(auth, "_ATTEMPTS", {})
    key = "login:a@b.test"
    assert all(auth._rate_ok(key, limit=3, window=900) for _ in range(3))
    assert not auth._rate_ok(key, limit=3, window=900)


def test_a_refused_attempt_still_counts(monkeypatch):
    """Mark-first, like the `/jobs` sweep cooldown. If a refused attempt were
    free, hammering the endpoint would drain the window and then reset it."""
    monkeypatch.setattr(auth, "_ATTEMPTS", {})
    key = "login:a@b.test"
    for _ in range(5):
        auth._rate_ok(key, limit=1, window=900)
    assert len(auth._ATTEMPTS[key]) == 5


def test_the_window_slides(monkeypatch):
    monkeypatch.setattr(auth, "_ATTEMPTS", {})
    key = "login:a@b.test"
    assert auth._rate_ok(key, limit=1, window=900)
    assert not auth._rate_ok(key, limit=1, window=900)
    # A zero-length window makes every earlier attempt already expired.
    assert auth._rate_ok(key, limit=1, window=0)


def test_keys_are_independent(monkeypatch):
    monkeypatch.setattr(auth, "_ATTEMPTS", {})
    assert auth._rate_ok("login:a@b.test", limit=1, window=900)
    assert auth._rate_ok("login:c@d.test", limit=1, window=900)


# ============================================================ configuration


def test_google_can_be_off_while_accounts_are_on(monkeypatch):
    """The two questions became genuinely different when the second door
    arrived. A deployment with no Google client still runs email accounts, and
    the old combined check would have switched the whole account system off to
    report the absence of one of its halves."""
    monkeypatch.setattr(auth, "SESSION_SECRET", SECRET)
    monkeypatch.setattr(auth, "PUBLIC_BASE_URL", "https://api.test")
    monkeypatch.setattr(auth.db, "available", lambda: True)
    monkeypatch.setattr(auth, "GOOGLE_CLIENT_ID", "")
    monkeypatch.setattr(auth, "GOOGLE_CLIENT_SECRET", "")
    assert auth.accounts_enabled() is True
    assert auth.google_enabled() is False


def test_accounts_need_a_public_url_to_come_back_to(monkeypatch):
    """A verification link that cannot name a host cannot be clicked."""
    monkeypatch.setattr(auth, "SESSION_SECRET", SECRET)
    monkeypatch.setattr(auth, "PUBLIC_BASE_URL", "")
    monkeypatch.setattr(auth.db, "available", lambda: True)
    assert auth.accounts_enabled() is False


def test_a_bad_address_is_a_CODED_400_not_a_pydantic_422():
    """This API returns codes, never prose - see the docstring in main.py.

    A `field_validator` that raised would hand FastAPI a 422 carrying
    Pydantic's own English sentence, which a five-language UI renders as
    "422 Unprocessable Entity". The shape check therefore lives in the handler
    and refuses like everything else here.
    """
    with pytest.raises(HTTPException) as caught:
        auth._email_or_400("user@localhost")
    assert caught.value.status_code == 400
    assert caught.value.detail == {"code": "invalidEmail"}


def test_a_good_address_comes_back_normalised():
    assert auth._email_or_400("  Ali@Example.COM ") == "ali@example.com"
