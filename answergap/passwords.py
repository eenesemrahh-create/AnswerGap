"""Password hashing and the policy around it. 100% PURE — stdlib only.

NO NEW DEPENDENCY, DELIBERATELY. `answergap/` is stdlib-only and
`requirements.txt` lists three packages that exist for `api/main.py` alone;
adding bcrypt or argon2 here would be the first crack in that. `hashlib.scrypt`
ships with CPython, is memory-hard, and is what RFC 7914 specifies — it is not
a compromise, it is the right primitive that happens to already be present.

WHY scrypt AND NOT pbkdf2. Both are in hashlib. PBKDF2 is CPU-hard only, so a
GPU or an ASIC attacks it thousands of times faster than the server that
created it. scrypt's cost parameter is MEMORY, which is the thing custom
hardware cannot cheaply multiply. For a store of password hashes — the asset
that is stolen wholesale and cracked offline at leisure — memory-hardness is
the whole point.

THE ENCODED FORM CARRIES ITS OWN PARAMETERS:

    scrypt$16384$8$1$<salt-b64>$<hash-b64>

The cost is written INTO the string rather than read from a constant at verify
time. That is what makes the parameters raisable later: old hashes keep
verifying under the numbers they were made with, and `needs_rehash` says which
ones are behind so they can be upgraded on the next successful sign-in. A
verifier that read today's constant would reject every hash the day the cost
was raised — i.e. lock out every existing user.
"""

from __future__ import annotations

import base64
import hashlib
import hmac
import secrets
import unicodedata

# ---------------------------------------------------------------- parameters

# n=16384, r=8, p=1 is the RFC 7914 "interactive login" set: about 16 MB and
# ~50-100 ms per hash on a small container. Both halves matter. Too cheap and
# an offline crack is affordable; too expensive and the sign-in endpoint
# becomes its own denial-of-service, because this runs synchronously per
# attempt and an attacker chooses how many attempts to make.
SCRYPT_N = 16384
SCRYPT_R = 8
SCRYPT_P = 1
SALT_BYTES = 16
KEY_BYTES = 32

# CPython's scrypt refuses to allocate more than `maxmem` and the default is
# too small for n=16384. Stated explicitly rather than left to the default,
# because the failure is an OSError at sign-in time on some builds and not
# others - exactly the kind of thing that works locally and not in the
# container.
SCRYPT_MAXMEM = 64 * 1024 * 1024

PREFIX = "scrypt"

# --------------------------------------------------------------------- policy

# NIST SP 800-63B: length is the control that matters, composition rules are
# not. No "must contain a symbol" here on purpose - those rules measurably
# push people toward `Password1!` and a predictable shape is worth less than
# four more characters of anything.
MIN_LENGTH = 10

# Upper bound, and it is a SECURITY control rather than a storage one. scrypt
# hashes whatever it is given, so a megabyte-long password is a megabyte of
# memory-hard work per attempt, chosen by the attacker. 200 is far past any
# real passphrase.
MAX_LENGTH = 200

# Refused outright. Not a "strength meter" - the list is short and its only
# job is to catch the handful of strings that appear at the top of every
# breach corpus, where an attacker's first hundred guesses live. A longer
# list belongs in a service, not in a source file.
COMMON = frozenset(
    {
        "password", "password1", "password123", "passw0rd", "p@ssword",
        "12345678", "123456789", "1234567890", "qwertyuiop", "qwerty123",
        "letmein123", "iloveyou1", "welcome123", "admin12345", "abc12345",
        "sifre1234", "parola1234", "123456789a", "1q2w3e4r5t", "asdfghjkl",
        "answergap", "answergap1", "answergap123",
    }
)


class WeakPassword(ValueError):
    """Raised with a machine-readable `code`, never a sentence.

    Same rule as the rest of this API: the server returns state and the UI
    renders words, because a five-language product cannot have the server
    guessing which language to apologise in.
    """

    def __init__(self, code: str) -> None:
        super().__init__(code)
        self.code = code


def normalize(raw: str) -> str:
    """NFKC, and nothing else.

    Unicode lets the same passphrase be typed as different byte sequences - a
    precomposed `ü` versus `u` plus a combining diaeresis. Without normalising,
    a Turkish or German passphrase can be set on one keyboard/OS and then fail
    to verify on another, with no way for the user to tell what is wrong.
    Normalising at BOTH hash and verify is what makes that impossible.

    Whitespace is NOT stripped and case is NOT folded: both are password
    content, and silently discarding either shrinks the key space.
    """
    return unicodedata.normalize("NFKC", raw or "")


def check_policy(raw: str) -> None:
    """Raise `WeakPassword` if this may not be used. Returns None on success."""
    candidate = normalize(raw)
    if len(candidate) < MIN_LENGTH:
        raise WeakPassword("passwordTooShort")
    if len(candidate) > MAX_LENGTH:
        raise WeakPassword("passwordTooLong")
    if candidate.lower() in COMMON:
        raise WeakPassword("passwordTooCommon")
    return None


def hash_password(raw: str) -> str:
    """Encode a password for storage. Policy is NOT checked here.

    Separating the two is deliberate: a password reset and a signup both want
    the policy, but `hash_password` is also how a test fixture or an admin
    tool writes a known value, and coupling them would mean the policy could
    only ever be enforced by refusing to hash.
    """
    salt = secrets.token_bytes(SALT_BYTES)
    key = _derive(normalize(raw), salt, SCRYPT_N, SCRYPT_R, SCRYPT_P)
    return "$".join(
        [PREFIX, str(SCRYPT_N), str(SCRYPT_R), str(SCRYPT_P), _b64(salt), _b64(key)]
    )


def verify_password(raw: str, encoded: str | None) -> bool:
    """Constant-time check of a password against a stored hash.

    Returns False for anything malformed rather than raising. A corrupt or
    truncated hash column is a failed sign-in, not a 500 - and a 500 here
    would be an oracle telling an attacker which accounts have damaged rows.
    """
    parsed = _parse(encoded)
    if not parsed:
        return False
    n, r, p, salt, expected = parsed
    try:
        actual = _derive(normalize(raw), salt, n, r, p)
    except (ValueError, OSError, MemoryError):
        # Absurd stored parameters would otherwise let a crafted row turn
        # every sign-in attempt into an allocation failure.
        return False
    return hmac.compare_digest(actual, expected)


def needs_rehash(encoded: str | None) -> bool:
    """True when a stored hash is weaker than what we would write today.

    The upgrade can only happen where the plaintext is briefly available, i.e.
    immediately after a SUCCESSFUL sign-in. That is the whole reason this
    function exists rather than a migration: nothing can re-derive a stronger
    hash from a weaker one offline.
    """
    parsed = _parse(encoded)
    if not parsed:
        return True
    n, r, p, _salt, _key = parsed
    return n < SCRYPT_N or r < SCRYPT_R or p < SCRYPT_P


# --------------------------------------------------------------------- internals


def _derive(password: str, salt: bytes, n: int, r: int, p: int) -> bytes:
    return hashlib.scrypt(
        password.encode("utf-8"),
        salt=salt,
        n=n,
        r=r,
        p=p,
        dklen=KEY_BYTES,
        maxmem=SCRYPT_MAXMEM,
    )


def _b64(raw: bytes) -> str:
    return base64.urlsafe_b64encode(raw).decode().rstrip("=")


def _unb64(text: str) -> bytes:
    return base64.urlsafe_b64decode(text + "=" * (-len(text) % 4))


def _parse(encoded: str | None) -> tuple[int, int, int, bytes, bytes] | None:
    if not encoded:
        return None
    parts = encoded.split("$")
    if len(parts) != 6 or parts[0] != PREFIX:
        return None
    try:
        n, r, p = int(parts[1]), int(parts[2]), int(parts[3])
        salt, key = _unb64(parts[4]), _unb64(parts[5])
    except (ValueError, TypeError):
        return None
    if n <= 1 or r < 1 or p < 1 or not salt or not key:
        return None
    return n, r, p, salt, key
