"""The tree <-> rows translation, which is the risky half of the storage layer.

`decompose` and `recompose` are pure, and that is exactly why they can be
tested: no database, no network, no clock. The fixtures are the Phase 0 archive
under `data/raw/`, which ships in the repository and is read-only - so unlike
the live trees these tests cannot be invalidated by a crawl.

What is being defended here is a specific failure. CLAUDE.md records that on
2026-08-27 a re-crawl destroyed a gap score that had been paid for, because the
tree was stored as one mutable document. The fix was to store edges instead, and
these tests hold the translation to that shape: a node's parents, its depth and
its repeat count must come OUT of the edges, not be carried alongside them.
"""

from __future__ import annotations

import pytest

from answergap import db
from answergap.dataforseo import slugify
from answergap.tree import all_trees


def _archive_trees() -> list[dict]:
    trees = all_trees()
    for tree in trees:
        # The archive predates market-qualified slugs; the row schema needs
        # both, and the demos are all US English.
        tree.setdefault("location_code", 2840)
        tree.setdefault("language_code", "en")
    return trees


ARCHIVE = _archive_trees()
assert ARCHIVE, "data/raw/ is empty - the archive fixtures are missing"


def _roundtrip(tree: dict) -> dict:
    rows = db.decompose(tree)
    return db.recompose(
        rows["crawl"],
        rows["questions"],
        rows["edges"],
        {s["question"]: s for s in rows["scores"]},
        rows["related"],
        slugify,
    )


@pytest.mark.parametrize("tree", ARCHIVE, ids=lambda t: t["slug"])
def test_roundtrip_preserves_every_question(tree: dict) -> None:
    back = _roundtrip(tree)
    assert {n["id"] for n in back["nodes"]} == {n["id"] for n in tree["nodes"]}
    assert back["node_count"] == len(tree["nodes"])


@pytest.mark.parametrize("tree", ARCHIVE, ids=lambda t: t["slug"])
def test_roundtrip_preserves_node_fields(tree: dict) -> None:
    back = {n["id"]: n for n in _roundtrip(tree)["nodes"]}
    for node in tree["nodes"]:
        got = back[node["id"]]
        for field in (
            "question",
            "depth",
            "status",
            "matching_pages",
            "results_checked",
            "relevance",
            "reach",
            "discovered_by",
            "repeat_count",
        ):
            assert got.get(field) == node.get(field), f"{node['id']}.{field}"
        assert got.get("results") or [] == (node.get("results") or [])
        assert sorted(got["parents"]) == sorted(node.get("parents") or [])


@pytest.mark.parametrize("tree", ARCHIVE, ids=lambda t: t["slug"])
def test_roundtrip_preserves_related_searches(tree: dict) -> None:
    # Related searches are not questions and never nodes - CLAUDE.md is
    # explicit - so they hang off the crawl and have to survive separately.
    assert sorted(_roundtrip(tree)["related_searches"]) == sorted(
        tree.get("related_searches") or []
    )


def test_multi_parent_question_is_one_node_and_several_edges() -> None:
    """The shape harvesting produces, and the reason edges beat a document.

    A question found under three parents is ONE question row and three edges.
    That is what makes `repeat_count` - CLAUDE.md's strongest fallback when
    search volume is missing - a count of something rather than a stored number
    that can drift from what it counts.
    """
    tree = {
        "seed": "seed",
        "slug": "seed-en-2840",
        "language_code": "en",
        "location_code": 2840,
        "nodes": [
            {
                "id": "seed",
                "question": "seed",
                "depth": 0,
                "parent_id": None,
                "parents": [],
                "repeat_count": 0,
                "status": "no_data",
                "results_checked": 0,
            },
            {
                "id": "shared",
                "question": "Shared question?",
                "depth": 2,
                "parent_id": "a",
                "parents": ["a", "b", "c"],
                "repeat_count": 3,
                "status": "no_data",
                "results_checked": 0,
            },
        ],
    }
    rows = db.decompose(tree)
    shared_edges = [e for e in rows["edges"] if e["child"] == "shared"]
    assert len(shared_edges) == 3
    assert len(rows["questions"]) == 2

    back = db.recompose(
        rows["crawl"], rows["questions"], rows["edges"], {}, [], slugify
    )
    node = next(n for n in back["nodes"] if n["id"] == "shared")
    assert node["repeat_count"] == 3
    assert sorted(node["parents"]) == ["a", "b", "c"]


def test_shallowest_appearance_wins_the_depth() -> None:
    """A deeper repeat must not demote a question that also sits near the seed.

    CLAUDE.md scores shallow nodes as more central, so when the same question
    turns up at depth 1 and again at depth 3, the node is a depth-1 node.
    """
    edges = [
        {"parent": "seed", "child": "q", "depth": 1, "relevance": 1.0,
         "reach": 1.0, "discovered_by": "paa"},
        {"parent": "deep", "child": "q", "depth": 3, "relevance": 0.5,
         "reach": 0.25, "discovered_by": "harvest"},
    ]
    back = db.recompose(
        {"seed": "seed", "slug": "s", "language_code": "en", "location_code": 2840},
        {"q": "Q?"}, edges, {}, [], slugify,
    )
    node = back["nodes"][0]
    assert node["depth"] == 1
    assert node["parent_id"] == "seed"


def test_unscored_nodes_produce_no_gap_score_row() -> None:
    """`no_data` is UNKNOWN, and unknown must not be written down as a finding.

    CLAUDE.md's accuracy rule. A node with nothing fetched has no claim to
    store, so decompose must not invent a score row for it.
    """
    tree = {
        "seed": "s", "slug": "s-en-2840", "language_code": "en",
        "location_code": 2840,
        "nodes": [
            {"id": "s", "question": "s", "depth": 0, "parent_id": None,
             "parents": [], "status": "no_data", "results_checked": 0},
        ],
    }
    assert db.decompose(tree)["scores"] == []


def test_payload_survives_compression() -> None:
    payload = {"tasks": [{"result": [{"items": [1, 2, 3]}]}], "q": "kaç para?"}
    assert db.unpack(db.pack(payload)) == payload
