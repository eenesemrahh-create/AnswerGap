"""`live.check_question`: one credit searches a question as its own seed.

Since 2026-10-07 "Check this question" does not score a question in place. It
searches it, which buys both halves at once - the organic results are the
question's gap score, the PAA block is the question's own tree - and sends the
reader there. The verdict has to show in the tree it was clicked from too.

These run with no database and no DataForSEO. `FakeClient` caches through
`live.SERP_DIR` the way the real client does on disk, so `_invalidate` really
does empty the cache it is meant to empty.
"""

from __future__ import annotations

import copy
import json
from pathlib import Path

import pytest

from answergap import db, live

PROBE = Path(__file__).resolve().parents[1] / "data" / "raw" / "probe-A-click4.json"


def _response(*, click_depth: bool = True) -> dict:
    response = json.loads(PROBE.read_text(encoding="utf-8"))
    if not click_depth:
        del response["tasks"][0]["data"]["people_also_ask_click_depth"]
    return response


class FakeClient:
    """The two counters `crawl` reads, and a cache on disk under SERP_DIR."""

    def __init__(self, fresh: dict, calls: list) -> None:
        self.fresh = fresh
        self.calls = calls
        self.billable_calls = 0
        self.cache_hits = 0
        self.estimated_spend = 0.0

    def serp(self, keyword, location_code, language_code, *, cache_key, extra_params=None):
        path = live.SERP_DIR / f"{cache_key}.json"
        if path.exists():
            self.cache_hits += 1
            return json.loads(path.read_text(encoding="utf-8"))
        self.billable_calls += 1
        self.calls.append((keyword, extra_params))
        response = copy.deepcopy(self.fresh)
        live.SERP_DIR.mkdir(parents=True, exist_ok=True)
        path.write_text(json.dumps(response), encoding="utf-8")
        return response


@pytest.fixture
def env(tmp_path, monkeypatch):
    monkeypatch.setattr(db, "available", lambda: False)
    monkeypatch.setattr(live, "SERP_DIR", tmp_path / "serp")
    monkeypatch.setattr(live, "TREES_DIR", tmp_path / "trees")
    calls: list = []
    monkeypatch.setattr(
        live, "_client", lambda **_: FakeClient(_response(), calls)
    )
    return calls


def _old_tree(env) -> dict:
    """A tree the reader is looking at, from an ordinary search."""
    return live.crawl("knight online", 2840, "en")


def _a_question(tree: dict) -> dict:
    return next(n for n in tree["nodes"] if n["depth"] == 1)


def test_checking_a_question_opens_its_own_tree(env) -> None:
    old = _old_tree(env)
    question = _a_question(old)

    result = live.check_question(old, question["slug"])

    fresh = live.load_tree(result["slug"])
    assert fresh is not None
    assert result["slug"] != old["slug"]
    assert fresh["seed"] == question["question"]


def test_one_request_buys_it_with_click_depth(env) -> None:
    old = _old_tree(env)
    env.clear()

    result = live.check_question(old, _a_question(old)["slug"])

    assert len(env) == 1
    assert env[0][1] == {"people_also_ask_click_depth": live.CLICK_DEPTH}
    assert result["billable_calls"] == 1


def test_the_verdict_lands_on_the_box_that_was_clicked(env) -> None:
    old = _old_tree(env)
    question = _a_question(old)
    assert not question.get("results_checked")

    result = live.check_question(old, question["slug"])

    assert result["node"]["results_checked"] > 0
    assert result["node"]["status"] != "no_data"
    # On disk nothing joins scores across trees, so the old tree is saved
    # with the verdict on it - a reload must still show it.
    reloaded = live.load_tree(old["slug"])
    again = next(n for n in reloaded["nodes"] if n["slug"] == question["slug"])
    assert again["status"] == result["node"]["status"]
    assert again["results_checked"] == result["node"]["results_checked"]


def test_the_new_trees_seed_carries_the_same_verdict(env) -> None:
    old = _old_tree(env)
    result = live.check_question(old, _a_question(old)["slug"])

    fresh = live.load_tree(result["slug"])
    root = next(n for n in fresh["nodes"] if n["depth"] == 0)
    assert root["status"] == result["node"]["status"]


def test_checking_again_is_free(env) -> None:
    old = _old_tree(env)
    slug = _a_question(old)["slug"]
    live.check_question(old, slug)

    again = live.check_question(old, slug)

    assert again["billable_calls"] == 0
    assert again["estimated_spend"] == 0.0
    assert again["from_cache"] is True


def test_a_cached_answer_without_clicks_is_bought_again(env) -> None:
    """The single-question score path cached responses with no click depth
    under the same key. Building a tree from one gives 4 questions, not 15."""
    old = _old_tree(env)
    question = _a_question(old)
    key = live.cache_key(question["question"], 2840, "en")
    live.SERP_DIR.mkdir(parents=True, exist_ok=True)
    (live.SERP_DIR / f"{key}.json").write_text(
        json.dumps(_response(click_depth=False)), encoding="utf-8"
    )
    env.clear()

    result = live.check_question(old, question["slug"])

    assert len(env) == 1, "the click-less cache entry should have been a miss"
    assert result["billable_calls"] == 1
    assert result["from_cache"] is False


def test_an_unknown_question_is_a_key_error(env) -> None:
    old = _old_tree(env)
    with pytest.raises(KeyError):
        live.check_question(old, "no-such-question")


def test_has_click_depth_trusts_a_response_that_cannot_say() -> None:
    assert live._has_click_depth({}) is True
    assert live._has_click_depth({"tasks": [{"data": None}]}) is True
    assert live._has_click_depth(_response()) is True
    assert live._has_click_depth(_response(click_depth=False)) is False
