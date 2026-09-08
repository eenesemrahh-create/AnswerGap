"""Session tokens: sign one, verify one, and nothing else.

This module is 100% PURE. No database, no environment, no clock - `now` is
always an argument. That is the same split `db.decompose`/`db.recompose` keeps,
and it exists for the same reason: the risky half of a feature should be
testable without standing anything up. Every rule that decides whether a
stranger gets a session lives here, and `tests/test_tokens.py` reaches all of it
with no fixtures.

There is deliberately NO session table. A token carries its own claims and its
own signature, so the common path costs zero queries. Revocation is the one
thing that shape cannot express for free, so it is bought with `ep` - the
`token_epoch` from the user's row. Bumping that column invalidates every token
already issued to that person, which is what "sign out everywhere" needs, and
the check costs nothing because the row is loaded on the spending path anyway.

Format: `b64url(payload_json).b64url(hmac_sha256(payload_b64, secret))`.

Not a JWT, on purpose. A JWT would drag in an `alg` header field, and the entire
history of JWT vulnerabilities is that field being honoured. Here the algorithm
is not negotiable because it is not written down.
"""

from __future__ import annotations

import base64
import hashlib
import hmac
import json

# Long enough that a stolen token stops working on its own, short enough that a
# suspension nobody notices is not permanent. The row's status is re-read on
# every spending request, so this is the backstop, not the gate.
DEFAULT_TTL_SECONDS = 14 * 24 * 60 * 60


def b64u(raw: bytes) -> str:
    """Base64url without padding. Padding is `=`, which is noise in a URL."""
    return base64.urlsafe_b64encode(raw).decode("ascii").rstrip("=")


def unb64u(text: str) -> bytes:
    """Inverse of `b64u`. Raises on anything that is not valid base64url."""
    pad = "=" * (-len(text) % 4)
    return base64.urlsafe_b64decode(text + pad)


def sign(
    payload: dict,
    secret: str,
    *,
    now: int,
    ttl_seconds: int = DEFAULT_TTL_SECONDS,
) -> str:
    """Sign a payload, stamping `iat` and `exp` onto it.

    Raises ValueError on an empty secret rather than signing with `b""`. An
    unset SESSION_SECRET must be a loud misconfiguration, not a system where
    every forged token verifies.
    """
    if not secret:
        raise ValueError("SESSION_SECRET is empty; refusing to sign a token.")
    body = dict(payload)
    body["iat"] = int(now)
    body["exp"] = int(now) + int(ttl_seconds)
    encoded = b64u(json.dumps(body, separators=(",", ":"), sort_keys=True).encode())
    return f"{encoded}.{_mac(encoded, secret)}"


def verify(token: str, secret: str, *, now: int) -> dict | None:
    """Return the payload, or None. Never raises, never partially trusts.

    One return value for every kind of failure - bad shape, bad signature,
    expired, unparseable - because the caller has exactly one thing to do about
    any of them, and distinguishing them in a reply would tell an attacker which
    half of the token to keep working on.
    """
    if not secret or not token:
        return None
    encoded, _, mac = token.partition(".")
    if not encoded or not mac:
        return None
    # compare_digest, not ==, so the reply time does not leak how much of the
    # signature was guessed correctly.
    if not hmac.compare_digest(mac, _mac(encoded, secret)):
        return None
    try:
        payload = json.loads(unb64u(encoded))
    except Exception:  # noqa: BLE001 - any malformed token is simply not a token
        return None
    if not isinstance(payload, dict):
        return None
    exp = payload.get("exp")
    if not isinstance(exp, int) or exp <= int(now):
        return None
    return payload


def _mac(encoded: str, secret: str) -> str:
    return b64u(
        hmac.new(secret.encode(), encoded.encode("ascii"), hashlib.sha256).digest()
    )
