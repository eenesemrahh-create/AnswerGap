"""The seed is not one of the questions, and the counts have to agree.

`depth == 0` is the keyword the user typed into the box. It is scored like
every other node - the SERP request was paid for and the overlap numbers are
real - but it is not a question Google suggested, and `status_counts` is what
the legend, the status filters and the headline "N unanswered" are read from.

The bug this pins was live and visible: on the `web site` tree the seed itself
scored `gap` and was the ONLY gap, so the screen announced one unanswered
question and the question it meant was the phrase the user had just typed.
The metric asks "do the pages ranking for this actually answer it" - a real
question about a question, and a tautology about a keyword.
"""

from __future__ import annotations

from answergap.tree import (
    STATUS_COVERED,
    STATUS_GAP,
    STATUS_NO_DATA,
    STATUS_WEAK,
    STATUSES,
    count_statuses,
)


def _node(depth: int, status: str) -> dict:
    return {"depth": depth, "status": status}


def test_the_seed_is_not_counted() -> None:
    nodes = [
        _node(0, STATUS_COVERED),  # the seed
        _node(1, STATUS_COVERED),
        _node(1, STATUS_GAP),
    ]
    assert count_statuses(nodes) == {
        STATUS_GAP: 1,
        STATUS_WEAK: 0,
        STATUS_COVERED: 1,
        STATUS_NO_DATA: 0,
    }


def test_a_seed_scored_as_a_gap_does_not_invent_one() -> None:
    """The exact `web site` case: a tree whose only gap was the keyword.

    Reported as one unanswered question until 2026-09-23, on a tree that had
    found none.
    """
    nodes = [_node(0, STATUS_GAP)] + [_node(1, STATUS_NO_DATA) for _ in range(15)]
    counts = count_statuses(nodes)
    assert counts[STATUS_GAP] == 0
    assert counts[STATUS_NO_DATA] == 15


def test_every_status_is_present_even_at_zero() -> None:
    """The legend draws a chip per status and reads its number from here, so a
    missing key would be a missing chip rather than a zero."""
    assert set(count_statuses([])) == set(STATUSES)
    assert all(v == 0 for v in count_statuses([]).values())


def test_the_counts_no_longer_sum_to_node_count() -> None:
    """Stated out loud because it is the surprising consequence.

    `node_count` counts the nodes on the canvas, which includes the seed;
    these count the questions, which do not. Anything adding the four together
    and expecting `node_count` is now wrong by exactly one, and should be.
    """
    nodes = [_node(0, STATUS_COVERED), _node(1, STATUS_GAP), _node(2, STATUS_WEAK)]
    assert sum(count_statuses(nodes).values()) == len(nodes) - 1
