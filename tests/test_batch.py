"""Which questions a batch spends on first, and in what order.

`scoring_candidates` is the only part of batch scoring that can be tested
without a database or a network: everything else is queueing and ingestion. It
is also the part that decides where money goes, so it is worth pinning.

CLAUDE.md gives the ranking signals and their order. Search volume is not among
them because most long-tail questions return 0 in Ads, which is exactly why
repeat count is called "the strongest fallback signal".
"""

from __future__ import annotations

from answergap.live import scoring_candidates


def _node(slug: str, **kw) -> dict:
    base = {
        "slug": slug,
        "id": slug.replace("-", " "),
        "question": slug,
        "depth": 1,
        "repeat_count": 1,
        "reach": 1.0,
        "results_checked": 0,
    }
    base.update(kw)
    return base


def _tree(*nodes: dict) -> dict:
    return {"slug": "t", "language_code": "en", "location_code": 2840, "nodes": list(nodes)}


def test_already_scored_questions_are_not_candidates() -> None:
    """The money is only worth spending on something not already known.

    `results_checked` rather than `status` is the test, because a question can
    be `no_data` for two different reasons and only one of them means unfetched.
    """
    tree = _tree(
        _node("scored", results_checked=8, status="covered"),
        _node("unscored"),
    )
    assert [n["slug"] for n in scoring_candidates(tree)] == ["unscored"]


def test_repeat_count_outranks_everything_else() -> None:
    """CLAUDE.md's strongest fallback when search volume is missing.

    A question that turned up under five different parents is more central than
    one seen once, whatever their depths.
    """
    tree = _tree(
        _node("seen-once", repeat_count=1, depth=1),
        _node("seen-five-times", repeat_count=5, depth=3),
    )
    assert scoring_candidates(tree)[0]["slug"] == "seen-five-times"


def test_shallower_wins_when_repeat_count_ties() -> None:
    tree = _tree(
        _node("deep", depth=3, repeat_count=2),
        _node("shallow", depth=1, repeat_count=2),
    )
    assert [n["slug"] for n in scoring_candidates(tree)] == ["shallow", "deep"]


def test_reach_breaks_a_full_tie() -> None:
    """Last resort: how much of the seed the question still carries."""
    tree = _tree(
        _node("drifted", reach=0.25),
        _node("on-topic", reach=1.0),
    )
    assert [n["slug"] for n in scoring_candidates(tree)] == ["on-topic", "drifted"]


def test_limit_cuts_from_the_top() -> None:
    """"Collect ~70 questions to show 10, then cut from the top" - CLAUDE.md.

    The cut has to happen after the ranking, not before, or it is not ranking.
    """
    tree = _tree(
        _node("a", repeat_count=1),
        _node("b", repeat_count=9),
        _node("c", repeat_count=5),
    )
    assert [n["slug"] for n in scoring_candidates(tree, 2)] == ["b", "c"]


def test_missing_signals_do_not_crash_the_ranking() -> None:
    """A freshly crawled node has `relevance` and `reach` of None.

    Sorting has to survive that, because the first batch a user runs is always
    against exactly those nodes.
    """
    tree = _tree(
        _node("no-signals", reach=None, repeat_count=None, depth=0),
        _node("normal"),
    )
    assert len(scoring_candidates(tree)) == 2
