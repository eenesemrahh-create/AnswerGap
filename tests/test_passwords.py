"""Password hashing, its policy, and the two properties the encoding exists for.

100% pure: no database, no network, no clock. `answergap/passwords.py` is
stdlib-only by design and this file proves it can be exercised that way.

Two of these tests protect decisions rather than behaviour, and should be read
before being "fixed" if they ever go red:

  * `test_parameters_travel_with_the_hash` is why the scrypt cost can be raised
    later without locking out every existing user.
  * `test_nfkc_is_applied_at_both_ends` is why a Turkish or German passphrase
    set on one keyboard still verifies on another.
"""

from __future__ import annotations

import pytest

from answergap import passwords

GOOD = "correct horse battery staple"


# ----------------------------------------------------------------- round trip


def test_hash_and_verify_round_trip():
    encoded = passwords.hash_password(GOOD)
    assert passwords.verify_password(GOOD, encoded)


def test_wrong_password_is_refused():
    encoded = passwords.hash_password(GOOD)
    assert not passwords.verify_password(GOOD + "!", encoded)
    assert not passwords.verify_password("", encoded)


def test_salt_makes_two_hashes_of_one_password_differ():
    """Identical passwords must not produce identical rows.

    Without a per-password salt, a stolen table tells an attacker which
    accounts share a password - and one crack then opens all of them.
    """
    a = passwords.hash_password(GOOD)
    b = passwords.hash_password(GOOD)
    assert a != b
    assert passwords.verify_password(GOOD, a)
    assert passwords.verify_password(GOOD, b)


# ------------------------------------------------------- the encoded form


def test_parameters_travel_with_the_hash():
    """The cost is IN the string, which is what makes raising it survivable.

    A verifier that read today's constant instead would reject every hash made
    under yesterday's numbers - i.e. lock out every existing user on the deploy
    that raised the cost.
    """
    encoded = passwords.hash_password(GOOD)
    prefix, n, r, p, salt, key = encoded.split("$")
    assert prefix == "scrypt"
    assert (int(n), int(r), int(p)) == (
        passwords.SCRYPT_N,
        passwords.SCRYPT_R,
        passwords.SCRYPT_P,
    )
    assert salt and key


def test_a_hash_at_todays_cost_does_not_need_rehashing():
    assert not passwords.needs_rehash(passwords.hash_password(GOOD))


def test_a_weaker_hash_is_flagged_for_upgrade():
    """The upgrade can only happen at sign-in, where the plaintext exists.

    Nothing can re-derive a stronger hash from a weaker one offline, which is
    why this is a flag read on a successful login rather than a migration.
    """
    encoded = passwords.hash_password(GOOD)
    parts = encoded.split("$")
    parts[1] = str(passwords.SCRYPT_N // 4)
    assert passwords.needs_rehash("$".join(parts))


@pytest.mark.parametrize(
    "broken",
    [
        None,
        "",
        "not-a-hash",
        "scrypt$16384$8$1$onlyfiveparts",
        "bcrypt$16384$8$1$c2FsdA$aGFzaA",  # right shape, wrong algorithm
        "scrypt$abc$8$1$c2FsdA$aGFzaA",  # non-numeric cost
        "scrypt$1$8$1$c2FsdA$aGFzaA",  # n must be > 1
        "scrypt$16384$8$1$$aGFzaA",  # empty salt
    ],
)
def test_malformed_hashes_are_a_failed_sign_in_not_a_crash(broken):
    """A corrupt column must refuse, never raise.

    A 500 here would be an oracle: it would tell an attacker which accounts
    have damaged rows, and it would turn a data problem into an outage on the
    sign-in path.
    """
    assert passwords.verify_password(GOOD, broken) is False
    assert passwords.needs_rehash(broken) is True


# ----------------------------------------------------------------- unicode


def test_nfkc_is_applied_at_both_ends():
    """The same passphrase typed two ways must verify.

    `ü` can arrive precomposed or as `u` plus a combining diaeresis. Without
    normalising at BOTH hash and verify, a passphrase set on one keyboard fails
    on another and the user has no way to see why.
    """
    precomposed = "grüne Wiese 2026"
    decomposed = "grüne Wiese 2026"
    assert precomposed != decomposed
    assert passwords.verify_password(
        decomposed, passwords.hash_password(precomposed)
    )


def test_whitespace_and_case_are_password_content():
    """Neither is stripped or folded - doing so would shrink the key space."""
    encoded = passwords.hash_password(" Leading Space ")
    assert not passwords.verify_password("Leading Space", encoded)
    assert not passwords.verify_password(" leading space ", encoded)


# ------------------------------------------------------------------ policy


def test_policy_accepts_a_reasonable_passphrase():
    assert passwords.check_policy(GOOD) is None


@pytest.mark.parametrize("short", ["", "a", "short", "123456789"])
def test_too_short_is_refused_with_a_code(short):
    with pytest.raises(passwords.WeakPassword) as caught:
        passwords.check_policy(short)
    assert caught.value.code == "passwordTooShort"


def test_absurdly_long_is_refused():
    """Not a storage limit - a security one.

    scrypt hashes whatever it is handed, so a megabyte-long password is a
    megabyte of memory-hard work per attempt, with the attacker choosing the
    size.
    """
    with pytest.raises(passwords.WeakPassword) as caught:
        passwords.check_policy("x" * (passwords.MAX_LENGTH + 1))
    assert caught.value.code == "passwordTooLong"


def test_breach_list_entries_are_refused_case_insensitively():
    with pytest.raises(passwords.WeakPassword) as caught:
        passwords.check_policy("PassWord123")
    assert caught.value.code == "passwordTooCommon"


def test_policy_has_no_composition_rules():
    """NIST SP 800-63B: length is the control, composition rules are not.

    A long lowercase passphrase must pass. Rules demanding a symbol measurably
    push people toward `Password1!`, and a predictable shape is worth less than
    four more characters of anything.
    """
    assert passwords.check_policy("all lowercase letters here") is None


def test_hashing_does_not_enforce_the_policy():
    """The two are separate so a fixture or an admin tool can write a known
    value without the policy being the only thing that could refuse."""
    assert passwords.verify_password("short", passwords.hash_password("short"))
