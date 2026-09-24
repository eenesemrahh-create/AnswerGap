"""`live.build_from_response` and `live._recount`, against a committed probe.

WHY THIS FILE EXISTS. On 2026-09-24 production answered every search with a
500: `NameError: name 'count_questions' is not defined` in
`build_from_response`. The name had been used in two places and imported in
none, and 373 tests were green over it, because NOTHING CALLED THESE TWO
FUNCTIONS. They sit on the live-crawl path, which costs money, so no test went
near them - and a NameError inside a function body is invisible to an import
check, which is why `test_imports.py` did not catch it either.

There HAD been a test that called `build_from_response`: `test_tree_shape.py`,
written with the click-depth chain fix and deleted with it on 2026-09-23 when
that fix was discarded. Deleting the change took its coverage with it, and the
next edit to the same function went out unexercised. That is the lesson worth
writing down: a revert removes tests that were paying for more than the change
they came with.

These assertions are deliberately about INVARIANTS rather than tree shape. The
shape is the thing the discarded fix would have changed; pinning it here would
re-litigate a settled decision. What is pinned is that the function runs, and
that the numbers it reports agree with the nodes it produced.
"""

from __future__ import annotations

import json
from pathlib import Path

import pytest

from answergap import live
from answergap.tree import STATUSES

PROBE = Path(__file__).resolve().parents[1] / "data" / "raw" / "probe-A-click4.json"


@pytest.fixture(scope="module")
def tree() -> dict:
    response = json.loads(PROBE.read_text(encoding="utf-8"))
    return live.build_from_response(response, "knight online", 2840, "en")


def test_it_builds_a_tree_at_all(tree) -> None:
    """The regression in one line: this raised NameError in production."""
    assert tree["nodes"], "no nodes came out of a probe that has a PAA block"
    assert tree["seed"] == "knight online"


def test_the_seed_is_the_only_root(tree) -> None:
    roots = [n for n in tree["nodes"] if n["parent_id"] is None]
    assert len(roots) == 1
    assert roots[0]["depth"] == 0


def test_question_count_is_the_nodes_minus_the_seed(tree) -> None:
    """The number the NameError was being raised while computing."""
    assert tree["question_count"] == tree["node_count"] - 1
    assert tree["node_count"] == len(tree["nodes"])


def test_the_status_counts_add_up_to_the_questions(tree) -> None:
    """`count_statuses` skips the seed and `count_questions` counts what is
    left, so these two have to agree or the legend and the header disagree on
    screen."""
    assert set(tree["status_counts"]) == set(STATUSES)
    assert sum(tree["status_counts"].values()) == tree["question_count"]


def test_every_node_has_a_parent_that_exists(tree) -> None:
    ids = {n["id"] for n in tree["nodes"]}
    for node in tree["nodes"]:
        if node["parent_id"] is not None:
            assert node["parent_id"] in ids, node["question"]


def test_recount_agrees_with_the_builder(tree) -> None:
    """The other call site of `count_questions`, and the other half of the
    NameError. `_recount` runs after a score harvests new nodes."""
    same = live._recount(dict(tree))
    assert same["question_count"] == tree["question_count"]
    assert same["status_counts"] == tree["status_counts"]


def test_recount_follows_a_node_being_added() -> None:
    """A harvest adds questions; both numbers have to move with them."""
    tree = {
        "nodes": [
            {"depth": 0, "status": "covered"},
            {"depth": 1, "status": "gap"},
        ]
    }
    live._recount(tree)
    assert tree["question_count"] == 1
    assert tree["status_counts"]["gap"] == 1

    tree["nodes"].append({"depth": 2, "status": "no_data"})
    live._recount(tree)
    assert tree["question_count"] == 2
    assert tree["node_count"] == 3
