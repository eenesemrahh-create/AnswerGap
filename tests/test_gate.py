"""The decision that spends money, with no database and no clock.

`answergap/gate.py` is where every refusal is decided. It takes the state as an
argument rather than fetching it, which is what makes the whole surface -
suspended accounts, empty balances, the anonymous daily limit, batch truncation
- reachable from here without standing up Postgres.

The rules being pinned are product rules, not implementation details:
CLAUDE.md prices a cache hit at zero, and the anonymous allowance is defended by
two counters precisely because either one alone is trivially reset.
"""

from __future__ import annotations

from answergap import gate
from answergap.gate import Identity, State


def _anon(**kw) -> Identity:
    return Identity(anon_id="browser-1", ip_hash="ip-1", **kw)


def _user(**kw) -> Identity:
    return Identity(user_id=7, email="a@b.com", **kw)


# ------------------------------------------------------------ the off switch


def test_disabled_accounts_allow_everything() -> None:
    """No SESSION_SECRET or no DATABASE_URL means the product behaves as before.

    Local development has no Postgres. A gate that failed closed here would make
    the laptop the one place the product is broken, which is how a safety
    feature turns into an obstacle nobody keeps.
    """
    decision = gate.decide(_anon(), State(accounts_enabled=False), action="batch", units=10)
    assert decision.allowed
    assert decision.affordable_units == 10


# ------------------------------------------------------------------- status


def test_suspension_outranks_a_full_balance() -> None:
    """Having credits is not permission to use them."""
    decision = gate.decide(
        _user(), State(True, gate.STATUS_SUSPENDED, balance=999), action="search", units=1
    )
    assert not decision.allowed
    assert (decision.http_status, decision.code) == (403, "suspended")


def test_suspension_outranks_being_an_admin() -> None:
    """A suspended admin is suspended. The order of the checks is the rule."""
    decision = gate.decide(
        _user(is_admin=True),
        State(True, gate.STATUS_SUSPENDED, balance=10),
        action="search",
        units=1,
    )
    assert not decision.allowed


def test_an_erased_account_cannot_spend() -> None:
    """The reason erasure could not ship without touching this file.

    Written as `status == STATUS_SUSPENDED`, this gate waved through every
    status it had not been told about by name - so an erased account would have
    kept its balance AND kept spending it.
    """
    decision = gate.decide(
        _user(), State(True, gate.STATUS_ERASED, balance=999), action="search", units=1
    )
    assert not decision.allowed
    # Its own OUTCOME, so "how many erased accounts tried to spend" stays
    # answerable and does not silently inflate the suspension count. The same
    # CODE, because that one is shown to the reader and this branch should be
    # unreachable - erasure bumps the token epoch, so the session dies first.
    assert decision.outcome == gate.REFUSED_ERASED
    assert (decision.http_status, decision.code) == (403, "suspended")


def test_an_erased_admin_is_still_erased() -> None:
    decision = gate.decide(
        _user(is_admin=True),
        State(True, gate.STATUS_ERASED, balance=10),
        action="search",
        units=1,
    )
    assert not decision.allowed


def test_a_status_nobody_recognises_fails_closed() -> None:
    """A gate that only stops the refusals it knows by name is not a gate."""
    decision = gate.decide(
        _user(), State(True, "something-new", balance=999), action="search", units=1
    )
    assert not decision.allowed
    assert decision.http_status == 403


def test_no_status_at_all_is_signed_out_not_suspended() -> None:
    """`status is None` means there is no account row, not a bad one.

    Both answers are now a refusal, so the assertion is on WHICH one. The
    fail-closed rule is written `!= "active"`, and `None != "active"`, so a
    signed-out visitor falling into that branch would be told their account is
    suspended - a sentence about an account they do not have, and a 403 where
    the browser needs a 401 to know to offer a sign-in.
    """
    decision = gate.decide(_anon(), State(True, None), action="search", units=1)
    assert not decision.allowed
    assert (decision.http_status, decision.code) == (401, "signedOut")
    assert decision.outcome == gate.REFUSED_SIGNED_OUT


# ------------------------------------------------------------------ credits


def test_an_admin_spends_without_a_balance() -> None:
    """Admins are not billed, so an empty ledger must not stop one."""
    decision = gate.decide(
        _user(is_admin=True), State(True, "active", balance=0), action="batch", units=10
    )
    assert decision.allowed
    assert decision.affordable_units == 10


def test_an_empty_balance_is_402_not_a_generic_refusal() -> None:
    """402 is distinguishable from the 429 the DataForSEO ceiling already uses.

    Reusing 429 would hand a user out of credits the advice for a completely
    different problem - see error.budget in web/i18n/en.ts.
    """
    decision = gate.decide(_user(), State(True, "active", balance=0), action="search", units=1)
    assert not decision.allowed
    assert (decision.http_status, decision.code) == (402, "noCredits")


def test_a_batch_is_trimmed_to_what_the_balance_covers() -> None:
    """Ten questions against three credits buys three - it does not refuse.

    The exact billable count is only known after queue_scores filters out
    already-scored questions, so the pre-check works from an upper bound.
    Refusing on an upper bound would over-refuse.
    """
    decision = gate.decide(_user(), State(True, "active", balance=3), action="batch", units=10)
    assert decision.allowed
    assert decision.affordable_units == 3


def test_a_batch_with_no_credits_at_all_is_refused() -> None:
    """Trimming to zero is a refusal, not an empty batch."""
    decision = gate.decide(_user(), State(True, "active", balance=0), action="batch", units=10)
    assert not decision.allowed
    assert decision.code == "noCredits"


# ---------------------------------------------------------------- anonymous


def test_searching_signed_out_is_refused() -> None:
    """The rule this whole section used to test the opposite of.

    Until 2026-09-23 a signed-out visitor got one free search a day. It was
    retired because the two counters behind it - a browser id and a hashed IP -
    are both resettable by the person being counted, so it bounded the bill by
    how much trouble a stranger felt like going to rather than by anything.
    """
    decision = gate.decide(_anon(), State(True), action="search", units=1)
    assert not decision.allowed
    assert (decision.http_status, decision.code) == (401, "signedOut")


def test_no_action_buys_its_way_past_being_signed_out() -> None:
    """`action` no longer changes the signed-out answer, and that is the point.

    `search` used to be the one action a signed-out visitor could reach, named
    in an `ANONYMOUS_ACTIONS` set. The set is gone; if anything ever
    reintroduces a per-action exemption, it fails here rather than in
    production on the one endpoint that spends money.
    """
    for action in ("search", "score", "batch", "something-new"):
        decision = gate.decide(_anon(), State(True), action=action, units=1)
        assert not decision.allowed, action
        assert (decision.http_status, decision.code) == (401, "signedOut"), action


# -------------------------------------------------------------- the charge


def test_a_cache_hit_costs_nothing() -> None:
    """CLAUDE.md's pricing rule, falling out of the measurement.

    `billable_calls` is 0 when the response came from cache, so the credit
    charge is 0 without anyone having to assert it separately.
    """
    assert gate.credits_for(0) == 0


def test_a_batch_is_n_charges_not_one() -> None:
    assert gate.credits_for(7) == 7


def test_a_missing_billable_count_charges_nothing() -> None:
    """A dry run returns a dict with no billable_calls key. It must not bill."""
    assert gate.credits_for(None) == 0


# ------------------------------------------------------------ the allowlist


def test_an_empty_admin_list_means_nobody_is_an_admin() -> None:
    """The entire security model of the admin panel is this one behaviour.

    ADMIN_EMAILS unset must not mean "unrestricted"; it must mean "closed".
    """
    assert gate.is_admin("a@b.com", frozenset()) is False


def test_admin_matching_ignores_case_and_whitespace() -> None:
    admins = gate.parse_admin_emails("  A@B.com , c@d.com ")
    assert gate.is_admin(" a@b.COM ", admins) is True
    assert gate.is_admin("e@f.com", admins) is False


def test_a_missing_email_is_never_an_admin() -> None:
    """An empty entry in the list must not match an absent email."""
    admins = gate.parse_admin_emails("a@b.com,,")
    assert gate.is_admin(None, admins) is False
    assert gate.is_admin("", admins) is False


# ------------------------------------------------------------- anon ip hash


def test_the_client_address_is_the_first_forwarded_entry() -> None:
    """Everything after the first entry is our own proxies, not the caller."""
    salt = b"salt"
    assert gate.anon_ip_hash("1.2.3.4, 10.0.0.1", salt) == gate.anon_ip_hash(" 1.2.3.4 ", salt)


def test_the_raw_address_never_appears_in_the_key() -> None:
    """An IP is a personal identifier; it is only ever needed as a counter key."""
    assert "1.2.3.4" not in (gate.anon_ip_hash("1.2.3.4", b"salt") or "")


def test_a_missing_forwarded_header_has_no_ip_counter() -> None:
    assert gate.anon_ip_hash(None, b"salt") is None
    assert gate.anon_ip_hash("  ", b"salt") is None


def test_a_different_salt_gives_a_different_key() -> None:
    assert gate.anon_ip_hash("1.2.3.4", b"a") != gate.anon_ip_hash("1.2.3.4", b"b")


# ---------------------------------------------------------------- settings


def test_a_typed_setting_is_fail_safe_not_fail_closed() -> None:
    """An admin typo must not take the product down.

    Deliberately the opposite policy from ADMIN_EMAILS: there, unset means
    closed; here, unparseable means "carry on with the default".
    """
    assert gate.setting_int({"k": "three"}, "k", default=1, lo=0, hi=100) == 1
    assert gate.setting_int({}, "k", default=1, lo=0, hi=100) == 1


def test_settings_are_clamped_but_zero_survives() -> None:
    assert gate.setting_int({"k": "-5"}, "k", default=1, lo=0, hi=100) == 0
    assert gate.setting_int({"k": "999999"}, "k", default=1, lo=0, hi=100) == 100
    assert gate.setting_int({"k": "0"}, "k", default=1, lo=0, hi=100) == 0


# ------------------------------------------------- what a refusal explains


def test_the_signed_out_refusal_carries_no_numbers() -> None:
    """Nothing to explain, so nothing is attached.

    This used to carry both anonymous counters, because which one tripped was
    the whole diagnosis. Being signed out has no such detail - the reason is
    the request itself - and `info` travels to the browser, so inventing a
    payload here would be handing out facts to say nothing with.
    """
    decision = gate.decide(_anon(), State(True), action="search", units=1)
    assert decision.info is None


def test_an_empty_balance_refusal_says_what_was_needed() -> None:
    decision = gate.decide(
        _user(), State(True, "active", balance=0), action="batch", units=10
    )
    assert decision.info == {"balance": 0, "needed": 10}


def test_an_allowed_decision_carries_no_explanation() -> None:
    """Nothing to explain when nothing was refused."""
    assert gate.decide(_anon(), State(True), action="search", units=1).info is None
