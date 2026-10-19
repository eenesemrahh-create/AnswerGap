"""Cloudflare Turnstile: is this signed-out search a person?

Used for ONE thing: a signed-out search (2026-10-19). The daily total in
`gate` is what bounds the bill whatever happens; this is what stops a script
from emptying that total every morning and leaving nothing for people.

The browser runs Cloudflare's widget and gets a one-time token; we send the
token to `siteverify` with our secret. Cloudflare refuses a token used twice
(`timeout-or-duplicate`), so a token cannot be replayed into a second search.

FAILS CLOSED. No secret configured means signed-out searching is off - the
`auth.anon_state` check - and any error reaching Cloudflare is a refusal: a
person can press the button again, a free search we cannot vouch for is the
exact hole this exists to close.

Stdlib only, like `api/stripe.py` and `answergap/mailer.py`. The User-Agent is
set for the same reason the mailer's is: Cloudflare's own edge refuses the
default `Python-urllib` signature (CLAUDE.md, "error code: 1010").
"""

from __future__ import annotations

import json
import os
import urllib.error
import urllib.parse
import urllib.request

VERIFY_URL = "https://challenges.cloudflare.com/turnstile/v0/siteverify"
TIMEOUT_SECONDS = 8
HEADER = "x-ag-turnstile"
# Turnstile tokens are at most 2048 characters; anything longer is not one.
MAX_TOKEN = 2048


def secret_key() -> str | None:
    return os.environ.get("TURNSTILE_SECRET_KEY") or None


def site_key() -> str | None:
    """The PUBLIC half, handed to the browser through /api/meta so the web
    service needs no variable of its own."""
    return os.environ.get("TURNSTILE_SITE_KEY") or None


def configured() -> bool:
    return bool(secret_key() and site_key())


def verify(token: str | None, *, remote_ip: str | None = None) -> bool:
    """True only when Cloudflare says this token is fresh and ours."""
    secret = secret_key()
    token = (token or "").strip()
    if not secret or not token or len(token) > MAX_TOKEN:
        return False
    form = {"secret": secret, "response": token}
    if remote_ip:
        form["remoteip"] = remote_ip
    request = urllib.request.Request(
        VERIFY_URL,
        data=urllib.parse.urlencode(form).encode(),
        method="POST",
        headers={"Content-Type": "application/x-www-form-urlencoded",
                 "User-Agent": "answergap/1.0"},
    )
    try:
        with urllib.request.urlopen(request, timeout=TIMEOUT_SECONDS) as response:
            body = json.loads(response.read() or b"{}")
    except (urllib.error.URLError, TimeoutError, OSError, ValueError) as exc:
        print(f"[turnstile] verify failed: {exc}", flush=True)
        return False
    if not body.get("success"):
        print(f"[turnstile] refused: {body.get('error-codes')}", flush=True)
        return False
    return True
