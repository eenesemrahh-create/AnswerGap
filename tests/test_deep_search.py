"""Deep search: opening the branches Google left closed.

One click-depth response is a CHAIN of depth 5 - Google returns four top-level
questions and expands exactly ONE of them. Deep search asks the other three the
same question the seed was asked, and hangs what comes back underneath them.

Two things have to be true for that to be worth buying, and both are pinned
here rather than described:

1. THE CHAIN SURVIVES THE HARVEST. `build_from_response` was fixed on
   2026-09-22 to walk `seed_question` transitively instead of flattening it.
   `_attach_harvest` had no such walk, because until now it only ever saw
   ordinary 4-question blocks where there is nothing to walk. Routing a
   click-depth response through the old flat path would have put the same bug
   back under a different function's name - one branch of 15 questions drawn as
   15 siblings.

2. THE PRICE IS THE ONE THAT WAS AGREED. Six expansions is what four credits
   buys, and that arithmetic is the product decision; a change to it has to
   break a test rather than quietly re-price the feature.
"""

from __future__ import annotations

import json
import pathlib

import pytest

from answergap import gate, live
from answergap.dataforseo import extract_paa
from answergap.live import _attach_harvest, _blank_node, _chain
from answergap.text import normalize

RAW = pathlib.Path(__file__).resolve().parent.parent / "data" / "raw"
PROBES = ["probe-A-click4.json", "probe-C-both.json"]
LANGUAGE = "tr"


def _probe(name: str) -> dict:
    path = RAW / name
    if not path.exists():  # pragma: no cover - the fixture is committed
        pytest.skip(f"{name} is not on disk")
    return json.loads(path.read_text(encoding="utf-8"))


def _depths(pairs: list[tuple[str, str | None]]) -> dict[int, int]:
    """Depth of each emitted question, counted from its top-level ancestor."""
    depth: dict[str, int] = {}
    for question, parent in pairs:
        key = normalize(question, LANGUAGE)
        parent_key = normalize(parent, LANGUAGE) if parent else None
        depth[key] = depth[parent_key] + 1 if parent_key else 1
    counts: dict[int, int] = {}
    for value in depth.values():
        counts[value] = counts.get(value, 0) + 1
    return dict(sorted(counts.items()))


# ------------------------------------------------------------- the chain


@pytest.mark.parametrize("name", PROBES)
def test_the_chain_walk_recovers_the_measured_shape(name: str) -> None:
    """The same {4, 2, 3, 3, 3} the tree builder gets, from the shared walk.

    `build_from_response` and the harvest now run the same function, so a
    question found by deep search lands where it would have landed if Google
    had returned it in the seed response.
    """
    pairs = _chain(extract_paa(_probe(name)), LANGUAGE)
    assert _depths(pairs) == {1: 4, 2: 2, 3: 3, 4: 3, 5: 3}


@pytest.mark.parametrize("name", PROBES)
def test_every_parent_is_emitted_before_its_children(name: str) -> None:
    """What lets the caller resolve a parent with a plain dict lookup.

    Without it the harvest would have to defer unresolved children and re-walk,
    which is the complexity the ordering exists to remove.
    """
    seen: set[str] = set()
    for question, parent in _chain(extract_paa(_probe(name)), LANGUAGE):
        if parent:
            assert normalize(parent, LANGUAGE) in seen
        seen.add(normalize(question, LANGUAGE))


def test_a_response_with_no_clicks_is_every_question_at_the_top() -> None:
    """An ordinary scoring response names no parents, so the generalisation
    costs the existing path nothing: it is still a flat harvest."""
    elements = [{"title": "one?"}, {"title": "two?"}, {"title": "three?"}]
    assert _chain(elements, "en") == [("one?", None), ("two?", None), ("three?", None)]


def test_a_parent_pointer_that_loops_does_not_hang() -> None:
    """CLAUDE.md's A->B->A rule, applied to parent pointers. A cycle resolves
    to the top level rather than being followed forever."""
    elements = [
        {"title": "a?", "seed_question": "b?"},
        {"title": "b?", "seed_question": "a?"},
    ]
    pairs = _chain(elements, "en")
    # Two questions, each emitted ONCE. The cycle terminates by placing
    # whichever question the walk re-entered, and it heads the chain.
    assert pairs == [("a?", None), ("b?", "a?")]


# ------------------------------------------------------- attaching it


def _tree() -> dict:
    root = _blank_node("teeth whitening", 0, None, "en")
    branch = _blank_node("does it hurt?", 1, root["id"], "en")
    branch["slug"] = "does-it-hurt"
    branch["reach"] = 1.0
    return {
        "seed": "teeth whitening",
        "slug": "t",
        "language_code": "en",
        "location_code": 2840,
        "nodes": [root, branch],
    }


def test_the_harvest_rebuilds_the_chain_under_the_expanded_question() -> None:
    """The point of the whole feature. Three questions in a chain arrive under
    a level-1 branch and land at depths 2, 3, 4 - not all three at 2."""
    tree = _tree()
    branch = tree["nodes"][1]
    added = _attach_harvest(
        tree,
        branch,
        # All three carry the whole seed, so the relevance gate is not what is
        # under test here - the placement is.
        [
            ("does teeth whitening hurt?", None),
            ("how long does teeth whitening hurt?", "does teeth whitening hurt?"),
            (
                "is teeth whitening pain normal?",
                "how long does teeth whitening hurt?",
            ),
        ],
    )["added"]
    assert [n["depth"] for n in added] == [2, 3, 4]
    assert added[1]["parent_id"] == added[0]["id"]
    assert added[2]["parent_id"] == added[1]["id"]


def test_a_named_parent_the_gate_dropped_does_not_strand_its_children() -> None:
    """CLAUDE.md's orphan rule. A question whose parent never entered the tree
    hangs off the expanded question instead of disappearing with it."""
    tree = _tree()
    branch = tree["nodes"][1]
    added = _attach_harvest(
        tree, branch, [("teeth whitening cost?", "who invented the harpsichord?")]
    )["added"]
    assert len(added) == 1
    assert added[0]["parent_id"] == branch["id"]
    assert added[0]["depth"] == 2


# -------------------------------------------------------------- the price


def test_six_expansions_cost_three_credits() -> None:
    """Which, with the 1-credit Live seed, is the four credits the deep search
    was priced at. Measured yield at that budget: 83 questions."""
    assert live.DEFAULT_EXPANSIONS == 6
    assert gate.credit_cost("deep", 6) == 3


def test_a_deep_request_is_queued_and_therefore_half_price() -> None:
    assert "deep" in gate.QUEUED_ACTIONS
    assert gate.credit_cost("deep", 1) == 1  # rounded up; one is not a batch
    assert gate.credit_cost("deep", 0) == 0


def test_a_short_balance_buys_what_it_covers_rather_than_refusing() -> None:
    """Same rule the batch already follows: trim, do not refuse."""
    assert gate.requests_for("deep", 2) == 4
    assert gate.requests_for("deep", 0) == 0


# ------------------------------------------------------- choosing branches


def test_only_unexpanded_unscored_leaves_are_candidates() -> None:
    """An expansion IS a scoring request, so proposing one for a question
    already scored would buy a response we hold. And a question with children
    is a branch Google already opened."""
    root = _blank_node("s", 0, None, "en")
    opened = _blank_node("opened?", 1, root["id"], "en")
    child = _blank_node("child?", 2, opened["id"], "en")
    scored = _blank_node("scored?", 1, root["id"], "en")
    scored["results_checked"] = 8
    closed = _blank_node("closed?", 1, root["id"], "en")
    tree = {"nodes": [root, opened, child, scored, closed]}

    chosen = live.expansion_candidates(tree, 10)
    # Shallower first once `reach` ties: CLAUDE.md's scoring rule is that a
    # shallow node is more central, and it is also the branch Google itself
    # chose not to open.
    assert [n["question"] for n in chosen] == ["closed?", "child?"]


def test_drifted_branches_are_not_expanded() -> None:
    """The expansion floor is not a new rule - it is the crawl rule, wired to
    a second caller. Spending a credit to go deeper into a branch that has
    already left the subject is the drift this product measures, bought."""
    root = _blank_node("s", 0, None, "en")
    near = _blank_node("near?", 1, root["id"], "en")
    near["reach"] = 1.0
    far = _blank_node("far?", 1, root["id"], "en")
    far["reach"] = live.EXPANSION_FLOOR / 2
    tree = {"nodes": [root, near, far]}

    assert [n["question"] for n in live.expansion_candidates(tree, 10)] == ["near?"]
