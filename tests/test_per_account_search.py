"""Per-account search pricing and the 30-day cache (operator's rules, 2026-10-12).

- An account's FIRST search of a seed costs one credit, even from the cache.
  It used to be free whenever anybody else had searched the seed before.
- Asking again for a search the account already has is refused with
  `alreadySearched`: reopening is free and needs no search; updating is
  `refresh`, which re-buys the data and costs a credit.
- A cached response older than 30 days is bought again.
"""

from __future__ import annotations

from datetime import datetime, timedelta, timezone
from types import SimpleNamespace

import pytest
from fastapi import HTTPException

from answergap import db, live
from api import auth, main

WHEN = datetime(2026, 10, 1, tzinfo=timezone.utc)


@pytest.fixture
def wired(monkeypatch):
    state = {"owned": {}, "crawls": [], "records": []}
    monkeypatch.setattr(auth, "identity",
                        lambda request: SimpleNamespace(user_id=7, anon_id=None,
                                                        is_admin=False, ip_hash="x"))
    monkeypatch.setattr(auth, "check", lambda who, **kw: None)
    monkeypatch.setattr(auth, "record", lambda who, **kw: state["records"].append(kw))
    monkeypatch.setattr(db, "available", lambda: True)
    monkeypatch.setattr(db, "user_searched_at",
                        lambda slug, uid: state["owned"].get((slug, uid)))

    def crawl(seed, location_code, language_code, **kw):
        state["crawls"].append({"seed": seed, **kw})
        return {"slug": live.tree_slug(seed.strip(), location_code, language_code),
                "billable_calls": 0, "estimated_spend": 0.0, "from_cache": True}

    monkeypatch.setattr(main.live, "crawl", crawl)
    return state


def _search(**over) -> dict:
    body = {"seed": "white code", "location_code": 2840, "language_code": "en"}
    body.update(over)
    return main.search(main.SearchRequest(**body), SimpleNamespace())


def test_a_first_search_from_the_cache_still_costs_one_credit(wired) -> None:
    _search()
    assert wired["records"][0]["credits"] == 1
    assert wired["records"][0]["billable_calls"] == 0, "Reports must still see no provider call"


def test_searching_again_asks_instead_of_charging(wired) -> None:
    slug = live.tree_slug("white code", 2840, "en")
    wired["owned"][(slug, 7)] = WHEN
    with pytest.raises(HTTPException) as exc:
        _search(seed="  white code ")
    assert exc.value.status_code == 409
    assert exc.value.detail["code"] == "alreadySearched"
    assert exc.value.detail["slug"] == slug
    assert wired["crawls"] == [] and wired["records"] == []


def test_the_owned_check_uses_the_same_slug_crawl_builds(wired) -> None:
    """Pins the argument order: location before language. Swapped, the check
    looks for a slug nothing ever writes and every repeat is charged again."""
    _search()
    built = live.tree_slug("white code", 2840, "en")
    assert built == "white-code-en-2840"
    wired["owned"][(built, 7)] = WHEN
    with pytest.raises(HTTPException):
        _search()


def test_updating_rebuys_and_costs_a_credit(wired) -> None:
    wired["owned"][(live.tree_slug("white code", 2840, "en"), 7)] = WHEN
    _search(refresh=True)
    assert wired["crawls"][0]["refresh"] is True
    assert wired["records"][0]["credits"] == 1


def test_a_dry_run_never_asks_and_never_charges(wired) -> None:
    wired["owned"][(live.tree_slug("white code", 2840, "en"), 7)] = WHEN

    def plan(seed, location_code, language_code, **kw):
        return {"dry_run": True, "planned": [], "estimated_spend": 0.0026}

    main.live.crawl = plan  # restored by monkeypatch in `wired`
    assert _search(dry_run=True)["dry_run"] is True
    assert wired["records"] == []


# ------------------------------------------------------------ the 30-day cache


@pytest.mark.parametrize("age_days, stale", [(None, False), (3, False), (31, True)])
def test_a_response_older_than_thirty_days_is_stale(monkeypatch, age_days, stale) -> None:
    fetched = None if age_days is None else datetime.now(timezone.utc) - timedelta(days=age_days)
    monkeypatch.setattr(live, "fetched_at", lambda key: fetched)
    assert live._stale("paa-2840-en-white-code") is stale


def test_a_stale_response_is_dropped_before_the_crawl(monkeypatch) -> None:
    dropped = []
    monkeypatch.setattr(live, "_stale", lambda key: True)
    monkeypatch.setattr(live, "_invalidate", lambda key: dropped.append(key))

    class Stop(Exception):
        pass

    def no_client(**kw):
        raise Stop

    monkeypatch.setattr(live, "_client", no_client)
    with pytest.raises(Stop):
        live.crawl("white code", 2840, "en")
    assert dropped == [live.cache_key("white code", 2840, "en")]


# ------------------------------------------------- "Check this question"


@pytest.fixture
def checking(monkeypatch, wired):
    tree = {"slug": "white-code-en-2840", "source": "live", "location_code": 2840,
            "language_code": "en", "status_counts": {},
            "nodes": [{"slug": "is-white-code-free", "question": "Is white code free?"}]}
    monkeypatch.setattr(main, "_authorize_tree", lambda slug, who: tree)
    monkeypatch.setattr(main.live, "check_question", lambda found, qslug, **kw: {
        "slug": live.tree_slug("Is white code free?", 2840, "en"),
        "node": found["nodes"][0], "billable_calls": 0, "estimated_spend": 0.0})
    return wired


def test_checking_a_new_question_costs_a_credit_even_from_the_cache(checking) -> None:
    main.check_question_endpoint("white-code-en-2840", "is-white-code-free", SimpleNamespace())
    assert checking["records"][0]["credits"] == 1


def test_checking_a_question_already_searched_is_free(checking) -> None:
    checking["owned"][(live.tree_slug("Is white code free?", 2840, "en"), 7)] = WHEN
    main.check_question_endpoint("white-code-en-2840", "is-white-code-free", SimpleNamespace())
    assert checking["records"][0]["credits"] == 0
