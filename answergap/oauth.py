"""Google sign-in, with zero new dependencies.

Everything above the fence is PURE - URL building, the signed `state`, the
redirect allowlist, and reading the ID token's claims. Only `exchange_code`
touches the network, and it uses `urllib.request` like the rest of this package
(`answergap/` is deliberately stdlib-only; see the comment in requirements.txt).

WHY THE ID TOKEN'S SIGNATURE IS NOT VERIFIED
--------------------------------------------
`claims_from_id_token` decodes the payload without checking its RS256
signature, and that is legitimate rather than lazy in exactly one situation,
which is the situation here: the token was handed to us in the response body of
a direct TLS connection to `oauth2.googleapis.com`, authenticated with our own
client secret. OpenID Connect Core section 3.1.3.7 says so explicitly - a token
obtained straight from the token endpoint over a protected channel may skip
signature validation, because the channel already proves the issuer.

It stops being safe the instant anyone passes an ID token in from anywhere else
- a request body, a query parameter, a header. Do not add such a path. Verifying
RS256 would mean an RSA implementation, which the standard library does not
have, and therefore a dependency this package does not want.
"""

from __future__ import annotations

import base64
import hashlib
import json
import secrets
import urllib.error
import urllib.parse
import urllib.request

from . import tokens

AUTH_ENDPOINT = "https://accounts.google.com/o/oauth2/v2/auth"
TOKEN_ENDPOINT = "https://oauth2.googleapis.com/token"
USERINFO_ENDPOINT = "https://www.googleapis.com/oauth2/v3/userinfo"

SCOPES = "openid email profile"
VALID_ISSUERS = frozenset({"accounts.google.com", "https://accounts.google.com"})

# The signed state is a round trip through the user's browser and back. Minutes,
# not hours: it only has to survive one consent screen.
STATE_TTL_SECONDS = 15 * 60


class OAuthError(RuntimeError):
    """Google refused, or could not be reached."""


# --------------------------------------------------------------- pure


def new_verifier() -> str:
    """A fresh PKCE verifier. Random, so not pure - but it takes no input."""
    return secrets.token_urlsafe(64)


def pkce_challenge(verifier: str) -> str:
    """S256 challenge for a verifier. Pure."""
    digest = hashlib.sha256(verifier.encode("ascii")).digest()
    return base64.urlsafe_b64encode(digest).decode("ascii").rstrip("=")


def authorize_url(
    *, client_id: str, redirect_uri: str, state: str, code_challenge: str
) -> str:
    """Where to send the browser to ask Google who this is."""
    query = urllib.parse.urlencode(
        {
            "client_id": client_id,
            "redirect_uri": redirect_uri,
            "response_type": "code",
            "scope": SCOPES,
            "state": state,
            "code_challenge": code_challenge,
            "code_challenge_method": "S256",
            # Google only returns a verified email on an account that has one;
            # asking for consent every time would be noise for a returning user.
            "prompt": "select_account",
        }
    )
    return f"{AUTH_ENDPOINT}?{query}"


def make_state(
    *, return_to: str, verifier: str, secret: str, now: int, mode: str = "token"
) -> str:
    """Sign where to come back to, how to hand the session over, and the verifier.

    The verifier rides inside the signed state rather than in a server-side
    store, which keeps the login path stateless across replicas. It is only
    readable by us - the state is HMAC-signed with SESSION_SECRET - and it is
    useless without the client secret that redeems the code.

    `mode` travels here rather than as a query parameter on the callback so it
    cannot be flipped between the two hand-off styles by editing a URL.
    """
    return tokens.sign(
        {"rt": return_to, "cv": verifier, "md": mode},
        secret,
        now=now,
        ttl_seconds=STATE_TTL_SECONDS,
    )


def read_state(state: str, secret: str, *, now: int) -> dict | None:
    """Verify a state that came back through the browser. None if it did not."""
    payload = tokens.verify(state, secret, now=now)
    if not payload or not isinstance(payload.get("rt"), str):
        return None
    return payload


def parse_origins(raw: str | None) -> frozenset[str]:
    """Normalise AUTH_RETURN_ORIGINS, in the shape ALLOWED_ORIGINS uses."""
    out = set()
    for part in (raw or "").split(","):
        cleaned = part.strip().rstrip("/").lower()
        if cleaned:
            out.add(cleaned)
    return frozenset(out)


def first_origin(raw: str | None) -> str:
    """The first origin as WRITTEN, not as sorted.

    `parse_origins` answers "may a session go here"; a set is exactly right for
    that and loses the one thing a fallback needs - which entry the operator
    put first. Normalised identically, so the answer is always a member of the
    allowlist the same string produced.
    """
    for part in (raw or "").split(","):
        cleaned = part.strip().rstrip("/").lower()
        if cleaned:
            return cleaned
    return ""


def return_allowed(target: str, allowlist: frozenset[str]) -> bool:
    """Is this a place we are willing to hand a session to?

    EXACT ORIGIN MATCH, never a prefix test. `startswith` would wave through
    `https://admin.up.railway.app.evil.com`, which begins with the right
    characters and belongs to someone else. An open redirect here is not a
    cosmetic bug: the thing being redirected IS the session.

    Fails closed - an empty allowlist accepts nothing.
    """
    if not allowlist or not target:
        return False
    try:
        parts = urllib.parse.urlsplit(target)
    except ValueError:
        return False
    if parts.scheme not in ("http", "https") or not parts.netloc:
        return False
    origin = f"{parts.scheme}://{parts.netloc}".lower()
    return origin in allowlist


def claims_from_id_token(id_token: str, *, client_id: str, now: int) -> dict | None:
    """Read the identity out of an ID token. See the module docstring first.

    Checks everything except the signature: the issuer is Google, the audience
    is US (not some other Google app), the token has not expired, and the
    address is VERIFIED. That last check is one line and it is the difference
    between "admin is an allowlist of addresses" and "admin is whatever address
    someone typed into an unverified account".
    """
    parts = id_token.split(".")
    if len(parts) != 3:
        return None
    try:
        claims = json.loads(tokens.unb64u(parts[1]))
    except Exception:  # noqa: BLE001 - an unreadable token is simply not a token
        return None
    if not isinstance(claims, dict):
        return None
    if claims.get("iss") not in VALID_ISSUERS:
        return None
    if claims.get("aud") != client_id:
        return None
    exp = claims.get("exp")
    if not isinstance(exp, (int, float)) or int(exp) <= int(now):
        return None
    if claims.get("email_verified") is not True:
        return None
    if not claims.get("email") or not claims.get("sub"):
        return None
    return claims


# ------------------------------------------------- everything below calls out


def exchange_code(
    *,
    code: str,
    client_id: str,
    client_secret: str,
    redirect_uri: str,
    verifier: str,
    timeout: int = 15,
) -> dict:
    """Trade the one-time code for tokens. The ONLY network call in this module.

    Called from a plain `def` FastAPI handler on purpose - FastAPI runs those in
    a threadpool, whereas an `async def` would block the whole event loop for
    the length of this round trip and stall every concurrent request.
    """
    body = urllib.parse.urlencode(
        {
            "code": code,
            "client_id": client_id,
            "client_secret": client_secret,
            "redirect_uri": redirect_uri,
            "grant_type": "authorization_code",
            "code_verifier": verifier,
        }
    ).encode()
    request = urllib.request.Request(
        TOKEN_ENDPOINT,
        data=body,
        headers={"Content-Type": "application/x-www-form-urlencoded"},
        method="POST",
    )
    try:
        with urllib.request.urlopen(request, timeout=timeout) as response:
            return json.loads(response.read().decode("utf-8"))
    except urllib.error.HTTPError as e:
        # Google's error body names the cause (redirect_uri_mismatch is the
        # usual one). It must not reach the user, but it has to reach the log.
        detail = e.read().decode("utf-8", "replace")[:400]
        raise OAuthError(f"Google rejected the code exchange ({e.code}): {detail}") from e
    except Exception as e:  # noqa: BLE001
        raise OAuthError(f"Could not reach Google: {e}") from e
