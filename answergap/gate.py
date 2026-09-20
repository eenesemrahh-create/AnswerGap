"""Who is allowed to spend money, and how much. 100% PURE.

Every rule that can refuse a paid request lives in `decide`, and it takes the
answers as arguments rather than fetching them. No database, no environment, no
clock. That is what lets `tests/test_gate.py` cover the whole decision surface -
suspended accounts, empty balances, the anonymous daily limit, batch truncation
- without a Postgres anywhere near it.

The caller gathers `State` in ONE query and then asks. Splitting it this way is
not tidiness: the database is ~150 ms away (see the performance note in
CLAUDE.md), so a decision function that fetched what it needed would have turned
every spending request into several round trips.
"""

from __future__ import annotations

import hashlib
import hmac
from dataclasses import dataclass

# Outcomes recorded on `usage_event`. Refusals are written down too - "how often
# do we turn people away, and why" is a product question, and it cannot be
# answered later from rows that were never inserted.
ALLOWED = "allowed"
REFUSED_NO_CREDITS = "refused_no_credits"
REFUSED_ANON_LIMIT = "refused_anon_limit"
REFUSED_SUSPENDED = "refused_suspended"
REFUSED_SIGNED_OUT = "refused_signed_out"
# Added with password accounts. Distinct from REFUSED_NO_CREDITS on purpose:
# an unverified account HAS no credits, because the signup grant waits for
# verification, so the two would otherwise be indistinguishable - and telling
# someone to buy credits when what they need is to click a link in their inbox
# is advice for a different problem. Same reasoning that gave `noCredits` its
# own code rather than reusing the DataForSEO budget 429.
REFUSED_UNVERIFIED = "refused_unverified"
# The account was erased, by its owner or by an admin. Distinct from
# REFUSED_SUSPENDED because they are opposite situations: a suspension is
# something we did TO someone and may undo, an erasure is usually something
# they asked for. Counting them together would make both numbers useless.
REFUSED_ERASED = "refused_erased"

STATUS_ACTIVE = "active"
STATUS_SUSPENDED = "suspended"
# Set by `db.user_erase`. `app_user.erased_at` is the authoritative record -
# this value exists so that the six places already written as
# `status != STATUS_ACTIVE` (login, reset, verify, require_admin, ...) refuse an
# erased account without any of them having to learn a new concept.
STATUS_ERASED = "erased"

# Runtime settings, with their defaults HERE rather than as seed rows in the
# migration. A default recorded in two places is a default that can disagree
# with itself.
SETTING_ANON_DAILY = "anonymous_daily_searches"
SETTING_SIGNUP_CREDITS = "signup_credits"
# JSON array of pricing plans shown on the marketing landing. Blank/missing
# means "no admin has set it yet" and the landing renders the hardcoded i18n
# defaults for its locale - a fresh install without a manual seed still shows
# a pricing section. See `api/admin.py` for the shape and validation.
SETTING_PRICING_PLANS = "pricing_plans"
DEFAULT_ANON_DAILY = 1
DEFAULT_SIGNUP_CREDITS = 10

# Anonymous visitors may discover, never score. Discovery is one request;
# scoring is per question and a batch is ten. The free tier is a taste of the
# product, not an unmetered door into the expensive half of it.
ANONYMOUS_ACTIONS = frozenset({"search"})


@dataclass(frozen=True)
class Identity:
    """Who is asking. Derived from request headers alone - no query."""

    user_id: int | None = None
    email: str | None = None
    # NOTE: derived from the token's own `ev` claim, NOT from a query - see
    # `api.auth.identity`. An account that has not proven its address is never
    # an admin, because `ADMIN_EMAILS` matches on the address and a password
    # signup can claim ANY address it likes until a mail proves otherwise.
    # Without that rule, signing up as the operator's address and never opening
    # the inbox would be an admin session.
    is_admin: bool = False
    email_verified: bool = True
    anon_id: str | None = None
    ip_hash: str | None = None
    # The epoch the token was signed under. Compared against the row's
    # token_epoch on any path that loads it; a mismatch means an admin pressed
    # "sign out everywhere" and this token is no longer a session.
    token_epoch: int | None = None

    @property
    def signed_in(self) -> bool:
        return self.user_id is not None


@dataclass(frozen=True)
class State:
    """Everything the single gathering query returned."""

    accounts_enabled: bool = False
    status: str | None = None
    # Read LIVE from the row, like `status` and for the same reason: the token
    # carries a claim that was true when it was signed, and this is the spending
    # path where the current fact is what matters. Defaults True so that every
    # caller written before password accounts existed keeps its old behaviour.
    email_verified: bool = True
    balance: int = 0
    anon_limit: int = DEFAULT_ANON_DAILY
    anon_used_browser: int = 0
    anon_used_ip: int = 0


@dataclass(frozen=True)
class Decision:
    allowed: bool
    outcome: str
    code: str | None = None
    http_status: int | None = None
    # How many units the caller may actually buy. Equals the requested count on
    # a plain allow; smaller when a batch was trimmed to what the balance covers.
    affordable_units: int = 0
    # The numbers behind a refusal, for the caller's own reply. Only ever facts
    # about the person asking - their own counter, their own balance - so it
    # tells an attacker nothing they could not already count themselves, and it
    # turns "why was I refused" from a support question into a readable answer.
    info: dict | None = None


def decide(identity: Identity, state: State, *, action: str, units: int) -> Decision:
    """The whole gate. Order matters and each step is here for a stated reason."""
    units = max(0, int(units))

    # Accounts switched off - no SESSION_SECRET, or no DATABASE_URL. The product
    # then behaves EXACTLY as it did before this feature existed. Local
    # development has no Postgres and must keep working; failing closed here
    # would make the laptop the one place the product is broken.
    if not state.accounts_enabled:
        return Decision(True, ALLOWED, affordable_units=units)

    # Not-active outranks everything, including admin and including a full
    # balance. Having credits is not permission to use them.
    #
    # `!= ACTIVE` rather than `== SUSPENDED`, and that is a FIX rather than a
    # tidy-up. Written as an equality test, this gate waved through every status
    # it had not been told about - so adding `erased` without touching this line
    # would have let an erased account keep spending. A gate that only stops the
    # refusals it already knows by name is not a gate. Unknown now fails closed.
    # `status is None` is an ANONYMOUS visitor - there is no account row to have
    # a status - and must fall through to the anonymous allowance below rather
    # than be refused as not-active.
    if state.status is not None and state.status != STATUS_ACTIVE:
        # The OUTCOME distinguishes the two, because it is written to
        # `usage_event` and "how often does an erased account still try" is a
        # question worth being able to answer. The CODE does not: it is what
        # the browser is told, and this branch should be unreachable for an
        # erased account anyway - erasure bumps `token_epoch`, so the session
        # dies before the gate is consulted. Minting a user-facing `erased`
        # code would buy a new ErrorKind and five translations for a message
        # nobody should ever see, and hand whoever did see it an oracle.
        outcome = REFUSED_ERASED if state.status == STATUS_ERASED else REFUSED_SUSPENDED
        return Decision(False, outcome, "suspended", 403)

    # Admins are not billed. They still get a usage_event, so their dollars stay
    # attributed - what they skip is the ledger, because inventing a balance for
    # someone who never bought credits would make the money history a fiction.
    if identity.is_admin:
        return Decision(True, ALLOWED, affordable_units=units)

    if identity.signed_in:
        # BEFORE the balance check, and the order is the message. An unverified
        # account has a balance of zero by construction - the signup grant is
        # paid at verification - so checking the balance first would refuse
        # every one of these with "you are out of credits", which is true and
        # useless. The action they need is in their inbox.
        #
        # Deliberately NOT before the admin branch: `is_admin` already requires
        # a verified address (see Identity), so an unverified admin cannot
        # exist to be refused here.
        if not state.email_verified:
            return Decision(
                False, REFUSED_UNVERIFIED, "emailUnverified", 403,
                info={"email": identity.email},
            )
        if state.balance >= units:
            return Decision(True, ALLOWED, affordable_units=units)
        if state.balance > 0:
            # Trim, do not refuse. A batch of ten against a balance of three
            # should buy three, and say so. Refusing outright would be right
            # only if we knew the exact billable count up front, and we do not -
            # queue_scores filters already-scored questions after this check.
            return Decision(True, ALLOWED, affordable_units=state.balance)
        return Decision(
            False, REFUSED_NO_CREDITS, "noCredits", 402,
            info={"balance": state.balance, "needed": units},
        )

    if action not in ANONYMOUS_ACTIONS:
        return Decision(False, REFUSED_SIGNED_OUT, "signedOut", 401)

    # Either counter refuses. Clearing site data defeats the browser id; a new
    # IP defeats the other; needing both to be under the limit is what makes the
    # cheap bypasses cost something.
    used = max(state.anon_used_browser, state.anon_used_ip)
    if used >= state.anon_limit:
        return Decision(
            False,
            REFUSED_ANON_LIMIT,
            "anonLimit",
            429,
            info={
                "used": used,
                "limit": state.anon_limit,
                "by_browser": state.anon_used_browser,
                "by_ip": state.anon_used_ip,
            },
        )
    return Decision(True, ALLOWED, affordable_units=units)


def credits_for(billable_calls: int | None) -> int:
    """One credit per request that ACTUALLY reached DataForSEO.

    A cache hit reports zero billable calls and therefore costs nothing, which
    is CLAUDE.md's pricing rule ("cached results are free") falling out of the
    measurement rather than being asserted separately.
    """
    try:
        return max(0, int(billable_calls or 0))
    except (TypeError, ValueError):
        return 0


def normalize_email(raw: str | None) -> str:
    return (raw or "").strip().lower()


# Deliberately loose, and the looseness is the design rather than laziness.
#
# `pydantic.EmailStr` would be the obvious choice and it drags in
# `email-validator` - a fourth runtime dependency for a product whose whole
# requirements file is three lines. It buys almost nothing here, because THE
# VERIFICATION MAIL IS THE VALIDATION: an address that does not exist never
# receives its link, never verifies, and never gets credits. A syntactic check
# that accepts a superset is therefore free, while one that is too strict
# silently rejects real addresses - and RFC 5321 permits far stranger local
# parts than most regexes allow, quoted strings and plus-tags included.
#
# So this rejects only what could not possibly be delivered or could break
# something downstream: no `@`, more than one `@`, an empty half, whitespace,
# a dotless domain, or a length no mail system would accept.
EMAIL_MAX_LENGTH = 254  # RFC 5321 path limit.


def looks_like_email(raw: str | None) -> bool:
    """Cheap sanity check on an address. NOT a deliverability claim."""
    value = (raw or "").strip()
    if not value or len(value) > EMAIL_MAX_LENGTH:
        return False
    if any(ch.isspace() for ch in value):
        return False
    local, sep, domain = value.partition("@")
    if not sep or not local or not domain or "@" in domain:
        return False
    # A domain with no dot is either a local hostname or a typo. Neither is an
    # address a verification mail can reach from a third-party sender.
    if "." not in domain or domain.startswith(".") or domain.endswith("."):
        return False
    return ".." not in domain


def parse_admin_emails(raw: str | None) -> frozenset[str]:
    """Parse ADMIN_EMAILS, in the shape ALLOWED_ORIGINS already uses."""
    return frozenset(
        part for part in (normalize_email(p) for p in (raw or "").split(",")) if part
    )


def is_admin(email: str | None, admin_emails: frozenset[str]) -> bool:
    """Fail closed. An empty allowlist means NOBODY is an admin.

    This one function is the whole security model of the admin panel: there is
    no role column, so the only way to become an admin is to appear in an
    environment variable on the api service. No SQL statement in this codebase
    can grant it, which makes privilege escalation structurally absent rather
    than merely forbidden.
    """
    if not admin_emails:
        return False
    normalized = normalize_email(email)
    return bool(normalized) and normalized in admin_emails


def anon_ip_hash(forwarded_for: str | None, salt: bytes) -> str | None:
    """Key an anonymous counter on the caller's address without storing it.

    Takes the FIRST entry of X-Forwarded-For - that is the client, everything
    after it is proxies. Railway terminates in front of uvicorn (started without
    --proxy-headers, see railway.json), so `request.client.host` is the proxy
    and this header is the only address there is.

    The raw address never reaches the database. It is only ever needed as a
    counter key, and hashing costs nothing.
    """
    first = (forwarded_for or "").split(",")[0].strip()
    if not first:
        return None
    return hmac.new(salt, first.encode(), hashlib.sha256).hexdigest()[:32]


def setting_int(
    rows: dict[str, str], key: str, *, default: int, lo: int, hi: int
) -> int:
    """Read a runtime setting, clamped, FAIL-SAFE rather than fail-closed.

    A typo typed into the admin panel must not take the product down. Anything
    unparseable falls back to the code default; anything out of range is
    clamped. Note that 0 is a real, wanted value for the anonymous limit - it
    means "no free searches at all" - so it must survive this function.
    """
    try:
        value = int(str(rows.get(key, "")).strip())
    except (TypeError, ValueError):
        return default
    return max(lo, min(hi, value))
