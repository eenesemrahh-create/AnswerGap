"""What a plan lets you do.

Until now nothing in this codebase looked at a plan to decide anything: the
gate asks "may this account spend a credit" and stops there, so a Starter
account and a Pro account could do exactly the same things while the pricing
cards sold CSV export, deep search and an API.

These tests are about the two ways an entitlement system goes wrong. One is
granting too little, which produces a support ticket. The other is granting too
much, which produces free Pro accounts - so every failure path here is checked
for what it hands out, not just for not raising.
"""

from __future__ import annotations

import pytest

from answergap import entitlements as ent


# ------------------------------------------------------------ resolution


def test_a_plan_grants_exactly_what_it_lists() -> None:
    plan = {"id": "lite", "capabilities": [ent.CSV_EXPORT, ent.PNG_EXPORT]}
    assert ent.resolve(plan) == {ent.CSV_EXPORT, ent.PNG_EXPORT}


def test_no_plan_grants_the_free_set() -> None:
    """An account on no plan, and the shape the account page renders as
    "This account runs on credits alone"."""
    assert ent.resolve(None) == ent.FREE


def test_a_card_saved_before_capabilities_existed_grants_nothing() -> None:
    """Every plan stored today is one of these - migration 0011 seeded them
    long before this field. They must resolve DOWN to free, not up to
    everything, or the first deploy of this module hands out Pro."""
    assert ent.resolve({"id": "lite", "name": "Lite"}) == ent.FREE


def test_an_unknown_capability_is_dropped_not_granted() -> None:
    """`csv-export` with a hyphen looks identical on screen to `csv_export`
    and grants nothing. Dropping it is the safe half; `unknown` below is what
    makes the mistake visible."""
    plan = {"capabilities": ["csv-export", "CSV_EXPORT", ent.PNG_EXPORT]}
    assert ent.resolve(plan) == {ent.PNG_EXPORT}


def test_unknown_reports_the_typo_so_the_panel_can_show_it() -> None:
    plan = {"capabilities": ["csv-export", ent.PNG_EXPORT, "teleporter"]}
    assert ent.unknown(plan) == ("csv-export", "teleporter")
    assert ent.unknown({"capabilities": [ent.PNG_EXPORT]}) == ()


# --------------------------------------------------- the failure directions
#
# A billing system whose failure mode is generosity will be attacked. Each of
# these feeds `resolve` something malformed and asserts what comes back is the
# FREE set rather than an exception or a full grant.


@pytest.mark.parametrize(
    "plan",
    [
        None,
        {},
        {"capabilities": None},
        {"capabilities": "csv_export"},          # a string, not a list
        {"capabilities": [None, 3, {"a": 1}]},   # a list of non-strings
        "not a dict at all",
        42,
    ],
)
def test_every_malformed_plan_fails_closed(plan) -> None:
    assert ent.resolve(plan) == ent.FREE


def test_unknown_survives_the_same_garbage() -> None:
    """It runs in the admin panel, where the input is by definition whatever
    somebody last saved."""
    for plan in (None, {}, {"capabilities": "x"}, 42):
        assert ent.unknown(plan) == ()


# ------------------------------------------------------------------ admins


def test_an_admin_gets_everything() -> None:
    """The same rule credits already follow - an admin spends without being
    billed. Making an operator buy their own product to reproduce a
    customer's bug is how bugs stop being reproduced."""
    assert ent.resolve(None, is_admin=True) == ent.CAPABILITIES
    assert ent.resolve({"capabilities": []}, is_admin=True) == ent.CAPABILITIES


def test_admin_does_not_leak_into_the_normal_path() -> None:
    """Guards the default. A flag that defaulted to True would grant every
    visitor everything and no test above would notice."""
    assert ent.resolve({"capabilities": []}) == ent.FREE


# ----------------------------------------------------------- the vocabulary


def test_the_vocabulary_is_closed_and_every_name_is_in_it() -> None:
    """The module's constants and the set must not drift: a constant missing
    from `CAPABILITIES` would be a capability that can be checked, can be
    ticked, and can never be granted."""
    named = {
        ent.DEEP_SEARCH, ent.CSV_EXPORT, ent.PNG_EXPORT, ent.BULK_SEARCH,
        ent.API_ACCESS, ent.SCHEDULED_CRAWLS, ent.WHITE_LABEL,
    }
    assert named == ent.CAPABILITIES


def test_capability_names_are_stable_api() -> None:
    """These strings are stored in the database against real plans. Renaming
    one silently disables that feature for every plan already saved with the
    old name, so a rename has to break this test and be done deliberately."""
    assert sorted(ent.CAPABILITIES) == [
        "api_access",
        "bulk_search",
        "csv_export",
        "deep_search",
        "png_export",
        "scheduled_crawls",
        "white_label",
    ]


def test_allows_is_the_single_place_a_check_happens() -> None:
    granted = ent.resolve({"capabilities": [ent.CSV_EXPORT]})
    assert ent.allows(granted, ent.CSV_EXPORT)
    assert not ent.allows(granted, ent.API_ACCESS)


# ------------------------------------------------ the admin model's guard


def test_the_admin_model_refuses_an_unknown_capability() -> None:
    """Dropping a typo silently would be the wrong half of the rule on its
    own: the operator ticks a box, the card saves, and nothing works. The
    save is refused instead, naming the known set."""
    from pydantic import ValidationError

    from api.admin import Plan

    base = dict(id="lite", name="Lite", desc="d", price="$1", per="/mo", cta="Go")
    with pytest.raises(ValidationError) as caught:
        Plan(**base, capabilities=["csv-export"])
    assert "csv-export" in str(caught.value)

    # And a good one is normalised, so two saves of the same ticks produce
    # identical stored JSON rather than a settings history full of non-changes.
    plan = Plan(**base, capabilities=[ent.PNG_EXPORT, ent.CSV_EXPORT, ent.CSV_EXPORT])
    assert plan.capabilities == [ent.CSV_EXPORT, ent.PNG_EXPORT]


# ------------------------------------------- what /api/me resolves them to
#
# `entitlements.resolve` answers "what does THIS PLAN allow". These cover the
# step before it: which plan, if any, an account counts as being on.

PLANS_JSON = (
    '[{"id":"lite","enabled":true,"capabilities":["csv_export"]},'
    ' {"id":"retired","enabled":false,"capabilities":["png_export"]}]'
)


@pytest.fixture
def plans(monkeypatch):
    from answergap import db

    monkeypatch.setattr(db, "settings_all", lambda: {"pricing_plans": PLANS_JSON})


def _sub(plan_id="lite", active=True):
    return {"plan_id": plan_id, "active": active, "status": "active"}


def test_a_live_plan_grants_its_capabilities(plans) -> None:
    from api import auth

    assert auth._capabilities(7, is_admin=False, subscription=_sub()) == ["csv_export"]


def test_a_lapsed_plan_grants_nothing(plans) -> None:
    """`active` is the API's own answer and it is NOT `status == "active"`:
    nothing renews an assigned plan, so one whose period has passed still says
    `active` while `active` here is false. This is the same rule the account
    page uses to render "This plan has ended", so the two cannot disagree."""
    from api import auth

    assert auth._capabilities(7, is_admin=False, subscription=_sub(active=False)) == []


def test_no_subscription_grants_nothing(plans) -> None:
    from api import auth

    assert auth._capabilities(7, is_admin=False, subscription=None) == []


def test_an_unpublished_plan_still_grants_to_whoever_is_on_it(plans) -> None:
    """THE ONE WORTH THE TEST. `_published_plan` filters on `enabled` because
    a draft must not be sellable - right for a checkout, wrong here. Somebody
    on a plan the operator later retired still paid for it, and their export
    must not stop working because a card was hidden from the marketing page.

    Retiring a plan means "stop selling it", not "take it away from the people
    on it" - that is cancelling their subscription, a different act with a
    refund attached."""
    from api import auth

    assert auth._capabilities(
        7, is_admin=False, subscription=_sub("retired")
    ) == ["png_export"]


def test_a_plan_id_matching_no_card_grants_nothing(plans) -> None:
    from api import auth

    assert auth._capabilities(7, is_admin=False, subscription=_sub("ghost")) == []


def test_an_admin_gets_everything_whatever_they_are_on(plans) -> None:
    from api import auth
    from answergap import entitlements as ent

    assert auth._capabilities(7, is_admin=True, subscription=None) == sorted(
        ent.CAPABILITIES
    )


def test_an_unreadable_settings_row_fails_closed(monkeypatch) -> None:
    """A billing system whose failure mode is generosity will be attacked."""
    from answergap import db
    from api import auth

    def boom():
        raise RuntimeError("database on fire")

    monkeypatch.setattr(db, "settings_all", boom)
    assert auth._capabilities(7, is_admin=False, subscription=_sub()) == []
