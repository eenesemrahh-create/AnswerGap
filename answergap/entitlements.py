"""What a plan lets you do, as opposed to how much it lets you spend.

`gate.decide` answers "may this account spend a credit". That is the only
question the product has ever asked, and it is why a Starter account and a Pro
account can today do exactly the same things - the pricing cards sell CSV
export, deep search and an API, and nothing in the codebase has ever looked at
a plan to decide anything.

This module is the missing half: a plan names CAPABILITIES, and a capability is
checked before a feature runs.

THREE RULES, and each one is a decision rather than a detail.

1. THE VOCABULARY IS CLOSED. `CAPABILITIES` below is the whole list. An admin
   can tick capabilities onto a plan; they cannot invent one by typing it,
   because a typo that silently becomes a capability nobody checks is a feature
   that looks enabled and is not. `resolve` drops anything unrecognised and
   `unknown` reports it, so the admin panel can say so instead of pretending.

2. IT FAILS CLOSED. No plan, a lapsed plan, an unreadable settings row, a plan
   id that matches no card - every one of them resolves to `FREE`. The
   alternative is an error path that hands somebody Pro, and a billing system
   whose failure mode is generosity is a billing system that will be attacked.

3. ADMINS GET EVERYTHING, and it is the same rule credits already follow: an
   admin spends without being billed. Making an operator buy their own product
   to reproduce a customer's bug is how bugs stop being reproduced.

WHAT THIS IS NOT. It is not a licence check and not a security boundary on its
own - every endpoint still does its own work. It answers one question, in one
place, so that five screens and four endpoints cannot disagree about who is
allowed what.
"""

from __future__ import annotations

# ---------------------------------------------------------------- vocabulary
#
# One entry per thing a plan can unlock. The string is what an admin ticks and
# what an endpoint checks, so it is stable API: renaming one silently disables
# the feature for every plan already saved with the old name.
#
# Deliberately NOT here: credits. How many credits a plan grants is a NUMBER on
# the subscription, copied at purchase so a price change cannot re-price an
# existing agreement. A capability is a yes/no about behaviour; a credit count
# is an amount, and collapsing the two would lose that distinction.

DEEP_SEARCH = "deep_search"
CSV_EXPORT = "csv_export"
PNG_EXPORT = "png_export"
BULK_SEARCH = "bulk_search"
API_ACCESS = "api_access"
SCHEDULED_CRAWLS = "scheduled_crawls"
WHITE_LABEL = "white_label"

#: Every capability this build understands. An admin config naming anything
#: else is reporting a typo, not granting a feature.
CAPABILITIES: frozenset[str] = frozenset(
    {
        DEEP_SEARCH,
        CSV_EXPORT,
        PNG_EXPORT,
        BULK_SEARCH,
        API_ACCESS,
        SCHEDULED_CRAWLS,
        WHITE_LABEL,
    }
)

#: What an account with no live plan can do.
#:
#: EMPTY, and that is a starting position rather than a conclusion. Searching,
#: scoring and reading your own trees are not capabilities - they are the
#: product, and they are governed by credits. This set exists for the day
#: something currently paid becomes free; moving a capability here is then a
#: one-line change rather than a hunt through endpoints.
FREE: frozenset[str] = frozenset()


def resolve(plan: dict | None, *, is_admin: bool = False) -> frozenset[str]:
    """What this plan allows. Never raises, never guesses upward.

    `plan` is a card out of `pricing_plans`, or None for an account with no
    live subscription. A card carries `capabilities` as a list of strings; a
    card saved before this field existed carries nothing, which correctly
    resolves to `FREE` rather than to everything.

    `is_admin` short-circuits to the full set, matching how credits already
    work - an admin is not billed, and cannot be asked to buy their own
    product to reproduce a customer's bug.
    """
    if is_admin:
        return CAPABILITIES
    if not isinstance(plan, dict):
        return FREE
    raw = plan.get("capabilities")
    if not isinstance(raw, list):
        return FREE
    # Intersection, not iteration: an unrecognised string is dropped here and
    # reported by `unknown` rather than carried around as a capability nothing
    # will ever check.
    return frozenset(c for c in raw if isinstance(c, str) and c in CAPABILITIES) | FREE


def unknown(plan: dict | None) -> tuple[str, ...]:
    """Capability names on this plan that this build does not understand.

    For the admin panel. A card listing `csv-export` (hyphen) grants nothing
    and looks identical to one listing `csv_export`, so the difference has to
    be visible somewhere - otherwise the first report is a customer saying a
    feature they paid for does not work.
    """
    if not isinstance(plan, dict):
        return ()
    raw = plan.get("capabilities")
    if not isinstance(raw, list):
        return ()
    return tuple(
        sorted({c for c in raw if isinstance(c, str) and c not in CAPABILITIES})
    )


def allows(capabilities: frozenset[str], capability: str) -> bool:
    """Whether a resolved set permits one capability.

    A function rather than `capability in capabilities` at each call site, so
    that a future rule - a trial that grants everything for a week, a
    capability implied by another - has exactly one place to live.
    """
    return capability in capabilities
