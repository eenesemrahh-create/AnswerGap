"""The shape of the tree the product is named after.

`people_also_ask_click_depth=4` is FOUR SUCCESSIVE CLICKS, not two levels.
DataForSEO clicks a question, clicks one of the questions that reveals, and so
on four times, so one response is a CHAIN of real depth 5. `seed_question`
names the question that was clicked, which makes it a parent pointer.

The first version of `build_from_response` promoted every named parent straight
to level 1 and hung its children at level 2. Measured on the committed probe,
that turned {1:4, 2:2, 3:3, 4:3, 5:3} into {1:7, 2:8} - seven questions drawn
as direct children of the seed when only four are. Nothing caught it: the
builder had no test at all, and a wrong tree still renders, still scores and
still sells.

These tests read the response we actually paid for rather than a mock, because
the bug was a misreading of that response and a mock would have encoded the
misreading.
"""

from __future__ import annotations

import collections
import json
import pathlib

import pytest

from answergap.dataforseo import extract_paa
from answergap.live import _blank_node, _carry_previous, build_from_response
from answergap.text import normalize

PROBES = ["probe-A-click4.json", "probe-C-both.json"]
RAW = pathlib.Path(__file__).resolve().parent.parent / "data" / "raw"

SEED = "dis beyazlatma"
LOCATION = 2792
LANGUAGE = "tr"


def _probe(name: str) -> dict:
    path = RAW / name
    if not path.exists():  # pragma: no cover - the fixture is committed
        pytest.skip(f"{name} is not on disk")
    return json.loads(path.read_text(encoding="utf-8"))


def _tree(name: str) -> dict:
    return build_from_response(_probe(name), SEED, LOCATION, LANGUAGE)


def _by_depth(tree: dict) -> dict[int, int]:
    return dict(sorted(collections.Counter(n["depth"] for n in tree["nodes"]).items()))


def _fake(pairs: list[tuple[str, str | None]]) -> dict:
    """A response carrying just the PAA elements, in DataForSEO's own shape."""
    return {
        "tasks": [
            {
                "result": [
                    {
                        "items": [
                            {
                                "type": "people_also_ask_element",
                                "title": title,
                                "seed_question": parent,
                            }
                            for title, parent in pairs
                        ]
                    }
                ]
            }
        ]
    }


# ----------------------------------------------------------------- the bug


@pytest.mark.parametrize("name", PROBES)
def test_a_click_depth_response_is_a_chain_not_two_levels(name: str) -> None:
    """THE test. Both probes decode identically, which is why there are two."""
    assert _by_depth(_tree(name)) == {0: 1, 1: 4, 2: 2, 3: 3, 4: 3, 5: 3}


@pytest.mark.parametrize("name", PROBES)
def test_only_googles_originals_are_level_one(name: str) -> None:
    """Four, not seven. A `seed_question` is a parent pointer, not a promotion.

    An original is exactly an element that names nothing as clicked, so the
    claim is checked against the response rather than against a constant.
    """
    elements = extract_paa(_probe(name))
    originals = {
        normalize((e.get("title") or "").strip(), LANGUAGE)
        for e in elements
        if not (e.get("seed_question") or "").strip()
    }
    level_one = {n["id"] for n in _tree(name)["nodes"] if n["depth"] == 1}
    assert level_one == originals
    assert len(level_one) == 4


@pytest.mark.parametrize("name", PROBES)
def test_an_interior_question_hangs_from_its_real_parent(name: str) -> None:
    """Every node below level 1 points at a parent exactly one level above it.

    NOT ONE OF THE TESTS THAT CATCHES THE FLATTENING - it passes on the broken
    code too, because a flattened tree is still internally consistent: its
    level-2 nodes really do hang off level-1 nodes, just the wrong ones. It is
    here as the structural invariant the chain walk must not break, and the
    distinction is worth stating so nobody reads a green tick as proof of shape.
    """
    tree = _tree(name)
    by_id = {n["id"]: n for n in tree["nodes"]}
    root = next(n for n in tree["nodes"] if n["depth"] == 0)
    for node in tree["nodes"]:
        if node["depth"] <= 1:
            continue
        parent = by_id[node["parent_id"]]
        assert parent["id"] != root["id"], node["question"]
        assert parent["depth"] == node["depth"] - 1, node["question"]


@pytest.mark.parametrize("name", PROBES)
def test_reach_decays_along_the_real_chain(name: str) -> None:
    """Drift compounds along a path, so the score has to compound with it.

    Also passes on the broken code, for the same reason as the test above: the
    flattened tree decayed `reach` correctly along the WRONG path. What this
    pins is that walking the chain did not break the monotonicity the harvest
    gate depends on - a child can never carry more of the seed than its parent.
    The chain fix changes the VALUES (a level-5 question now decays five times,
    not two); nothing measured them before, so there is no baseline to assert.
    """
    tree = _tree(name)
    by_id = {n["id"]: n for n in tree["nodes"]}
    for node in tree["nodes"]:
        if node["depth"] == 0:
            continue
        parent = by_id[node["parent_id"]]
        assert node["reach"] <= parent["reach"] + 1e-9, node["question"]


# ------------------------------------------------- placement, on fixtures


def test_a_question_cited_only_as_a_parent_is_still_placed() -> None:
    """CLAUDE.md's orphan rule, kept: dropping it would strand its children.

    `ghost` is named as a parent but is no element's title. It belongs at level
    1 - there is nothing else to hang it from - and its child belongs under it,
    not under the root.
    """
    tree = build_from_response(
        _fake([("first question", None), ("child question", "ghost question")]),
        SEED,
        LOCATION,
        LANGUAGE,
    )
    by_question = {n["question"]: n for n in tree["nodes"]}
    assert "ghost question" in by_question
    assert by_question["ghost question"]["depth"] == 1
    child = by_question["child question"]
    assert child["depth"] == 2
    assert child["parent_id"] == by_question["ghost question"]["id"]


def test_a_question_is_never_its_own_child() -> None:
    tree = build_from_response(
        _fake([("same question", "same question")]), SEED, LOCATION, LANGUAGE
    )
    node = next(n for n in tree["nodes"] if n["question"] == "same question")
    assert node["depth"] == 1
    assert node["id"] != node["parent_id"]


def test_a_parent_cycle_terminates() -> None:
    """An A->B->A loop in the parent pointers must not be walked forever.

    CLAUDE.md states the rule for the crawl; the same loop can arrive inside a
    single response, where the cost is a hang rather than money.
    """
    tree = build_from_response(
        _fake([("question a", "question b"), ("question b", "question a")]),
        SEED,
        LOCATION,
        LANGUAGE,
    )
    assert {n["question"] for n in tree["nodes"]} == {SEED, "question a", "question b"}
    assert max(n["depth"] for n in tree["nodes"]) <= 2


def test_a_carried_harvest_node_is_re_depthed_against_its_fresh_parent() -> None:
    """A carried node must never come back shallower than its own parent.

    The chain fix moves questions from level 2 to level 4 or 5. `_carry_previous`
    copies harvested nodes across a re-crawl wholesale, so a node carried with
    its STORED depth would land above the parent it hangs from - on every tree
    crawled before the fix and re-crawled after it. The failure is silent: the
    tree still renders, with an arrow pointing backwards.
    """
    fresh = build_from_response(
        _fake(
            [
                ("top question", None),
                ("middle question", "top question"),
                ("deep question", "middle question"),
            ]
        ),
        SEED,
        LOCATION,
        LANGUAGE,
    )
    deep = next(n for n in fresh["nodes"] if n["question"] == "deep question")
    assert deep["depth"] == 3  # the parent the carried node will hang from

    # The previous crawl saw the same parent at level 2 - the flattened shape -
    # and harvested a child under it at level 3.
    child = _blank_node("harvested question", 3, deep["id"], LANGUAGE)
    child.update({"discovered_by": "harvest", "relevance": 1.0, "reach": 0.5})
    previous = {
        "nodes": [dict(deep, depth=2), child],
        "related_searches": [],
    }

    carried = _carry_previous(fresh, previous)
    by_id = {n["id"]: n for n in carried["nodes"]}
    landed = by_id[child["id"]]
    assert landed["depth"] == deep["depth"] + 1 == 4
    assert landed["reach"] <= by_id[landed["parent_id"]]["reach"] + 1e-9


def test_a_response_with_no_chain_still_builds_a_flat_level_one() -> None:
    """A plain scoring response has four elements and no `seed_question` at all.

    That shape must keep producing four level-1 nodes - the chain walk is an
    addition, not a replacement.
    """
    tree = build_from_response(
        _fake([(f"question {i}", None) for i in range(4)]), SEED, LOCATION, LANGUAGE
    )
    assert _by_depth(tree) == {0: 1, 1: 4}
