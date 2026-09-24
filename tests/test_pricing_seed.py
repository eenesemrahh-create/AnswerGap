"""The seeded pricing cards, and the one duplication they create.

`answergap/pricing_seed.py` is written into `app_setting.pricing_plans` by
migration 0011, so `/pricing` can read its cards from the admin panel. The
same three cards ALSO exist in `web/content/marketing/pricing/en.ts`, which is
what the page renders when the API cannot be reached and what the four
translations are checked against.

Two copies in two languages can drift apart, and the first person to notice
should not be a customer. TypeScript cannot check a Python file and pytest
cannot import a `.ts` module, so this reads the text and compares the numbers
that matter. It is a coarse check on purpose: prose is allowed to differ - the
content file is prose for five languages - but ids, prices and the number of
bullets are the same product fact stated twice.
"""

from __future__ import annotations

import json
import re
from pathlib import Path

from answergap import db, gate
from answergap.pricing_seed import SEED_PLANS

EN = Path(__file__).resolve().parents[1] / "web/content/marketing/pricing/en.ts"


def _content_prices() -> list[str]:
    """Every `priceMonthly` in the English content file, in order."""
    return re.findall(r'priceMonthly:\s*"([^"]+)"', EN.read_text(encoding="utf-8"))


def _content_annual() -> list[str]:
    return re.findall(r'priceAnnual:\s*"([^"]+)"', EN.read_text(encoding="utf-8"))


def test_the_seed_matches_the_english_fallback_on_price() -> None:
    """The page shows one of these two sources depending on whether the API
    answered. Showing a different price depending on that is the failure this
    whole test file exists to prevent."""
    assert _content_prices() == [p["price"] for p in SEED_PLANS]
    assert _content_annual() == [p["price_annual"] for p in SEED_PLANS]


def test_the_seed_matches_the_english_fallback_on_feature_counts() -> None:
    """Bullet counts, not bullet text: the content file is the source the four
    translations mirror, and the wording is allowed to be edited there."""
    source = EN.read_text(encoding="utf-8")
    blocks = re.findall(r"features:\s*\[(.*?)\]", source, re.S)
    counts = [len(re.findall(r'"', block)) // 2 for block in blocks]
    assert counts == [len(p["features"]) for p in SEED_PLANS]


def test_every_seeded_plan_fits_what_the_api_will_accept() -> None:
    """The seed goes in through SQL, not through `POST /api/admin/pricing`, so
    nothing validates it on the way in. A card the API would refuse is a card
    an operator cannot re-save after editing one word of it."""
    from api.admin import PRICING_MAX_FEATURES, PRICING_MAX_PLANS, Plan

    assert len(SEED_PLANS) <= PRICING_MAX_PLANS
    for raw in SEED_PLANS:
        plan = Plan(**raw)
        assert len(plan.features) <= PRICING_MAX_FEATURES
        assert plan.id == raw["id"]


def test_the_seed_ids_are_the_order_the_comparison_table_assumes() -> None:
    """`web/lib/pricing-plans.ts` drops the comparison table when the cards
    stop matching this list, because its rows are three-tuples written against
    Starter / Lite / Pro in that order."""
    assert [p["id"] for p in SEED_PLANS] == ["starter", "lite", "pro"]


def test_the_migration_carries_the_seed_and_refuses_to_overwrite() -> None:
    sql = dict(db.MIGRATIONS)["0011_seed_pricing_plans"]
    assert gate.SETTING_PRICING_PLANS in sql
    # A seed, not an overwrite: an operator's published plans must survive it.
    assert "WHERE NOT EXISTS" in sql
    # The JSON really is in there, and really is parseable.
    body = sql.split("$seed$")[1]
    assert [p["id"] for p in json.loads(body)] == ["starter", "lite", "pro"]


def test_the_second_seed_treats_an_empty_list_as_nothing_set() -> None:
    """0011 did not seed production and was right not to.

    A `pricing_plans` row was already there holding `[]` - what the editor
    saves when somebody opens it and presses Save - so `WHERE NOT EXISTS`
    refused, the migration recorded itself as applied, and the admin editor
    went on showing no cards. 0012 repeats the seed with the condition 0011
    should have had.
    """
    sql = dict(db.MIGRATIONS)["0012_seed_pricing_plans_over_empty"]
    assert gate.SETTING_PRICING_PLANS in sql
    # The distinction that matters: blank and `[]` are "nothing set", and
    # anything else is content that must survive.
    assert "'[]'" in sql and "btrim" in sql
    assert "DISTINCT ON" in sql, "must test the LATEST value, not any value"
    body = sql.split("$seed$")[1]
    assert [p["id"] for p in json.loads(body)] == ["starter", "lite", "pro"]


def test_both_seeds_carry_the_same_plans() -> None:
    """Two migrations, one seed value - built from the same Python constant,
    so they cannot drift into seeding different prices."""
    eleven = dict(db.MIGRATIONS)["0011_seed_pricing_plans"].split("$seed$")[1]
    twelve = dict(db.MIGRATIONS)["0012_seed_pricing_plans_over_empty"].split("$seed$")[1]
    assert json.loads(eleven) == json.loads(twelve) == SEED_PLANS


def test_the_cards_are_seeded_published() -> None:
    """A seed nobody can see looks like a seed that failed."""
    assert all(p["enabled"] for p in SEED_PLANS)
