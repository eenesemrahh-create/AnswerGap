"""The diff engine's rules, and the one it exists to NOT break.

CLAUDE.md's diff section is three lines and the third is the important one:

    Added questions      -> notify. The most valuable signal.
    Disappeared          -> a content-refresh signal.
    Order changes        -> noise, DO NOT NOTIFY.

The third is the easiest to break by accident, because comparing sequences is
the obvious implementation and it is wrong: PAA ordering moves for an identical
query, so a sequence diff reports a change every single run and the alerts are
worthless inside a week. Comparing sets makes that structurally impossible, and
this file is what keeps it that way.
"""

from __future__ import annotations

from answergap.db import compare_questions


def q(normalized: str, text: str | None = None, depth: int = 1) -> dict:
    return {"normalized": normalized, "text": text or f"{normalized}?", "depth": depth}


def _set(*rows: dict) -> dict[str, dict]:
    return {r["normalized"]: r for r in rows}


def test_reordering_alone_is_not_a_change() -> None:
    """THE rule. Same questions, different order, nothing to report.

    A dict preserves insertion order in Python, so an implementation that
    compared sequences would pass every other test in this file and fail only
    this one.
    """
    before = _set(q("a"), q("b"), q("c"))
    now = _set(q("c"), q("a"), q("b"))
    result = compare_questions(now, before)
    assert result["added"] == []
    assert result["removed"] == []
    assert result["unchanged"] == 3


def test_a_new_question_is_reported() -> None:
    result = compare_questions(_set(q("a"), q("new")), _set(q("a")))
    assert [r["normalized"] for r in result["added"]] == ["new"]
    assert result["removed"] == []


def test_a_disappeared_question_is_reported() -> None:
    """Not a gap, a content-refresh signal: a page aimed at it now aims at nothing."""
    result = compare_questions(_set(q("a")), _set(q("a"), q("gone")))
    assert [r["normalized"] for r in result["removed"]] == ["gone"]
    assert result["added"] == []


def test_added_and_removed_at_once() -> None:
    result = compare_questions(_set(q("keep"), q("fresh")), _set(q("keep"), q("stale")))
    assert [r["normalized"] for r in result["added"]] == ["fresh"]
    assert [r["normalized"] for r in result["removed"]] == ["stale"]
    assert result["unchanged"] == 1


def test_identical_crawls_produce_an_empty_diff() -> None:
    same = _set(q("a"), q("b"))
    result = compare_questions(same, dict(same))
    assert result == {"added": [], "removed": [], "unchanged": 2}


def test_results_are_ordered_shallowest_first() -> None:
    """Shallow questions are more central - CLAUDE.md's depth signal.

    A notification listing the deepest change first buries the useful one.
    """
    now = _set(q("deep", "Deep?", depth=3), q("shallow", "Shallow?", depth=1))
    result = compare_questions(now, {})
    assert [r["depth"] for r in result["added"]] == [1, 3]


def test_the_same_question_reworded_by_google_is_not_a_change() -> None:
    """Keyed on normalized text, so casing and punctuation do not fire an alert.

    Google re-cases and re-punctuates PAA entries between crawls. Reporting
    "How do I start?" -> "How Do I Start?" as a new question would be exactly
    the false alarm the ordering rule exists to prevent, arriving by a different
    door.
    """
    before = _set(q("how do i start", "How do I start?"))
    now = _set(q("how do i start", "How Do I Start?"))
    result = compare_questions(now, before)
    assert result["added"] == []
    assert result["removed"] == []
    assert result["unchanged"] == 1
