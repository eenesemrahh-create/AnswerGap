"""The gap metric: the rules the whole product rests on, plus its known wall.

Two kinds of test live here and they should not be confused.

The first kind pins behaviour that must not change by accident - the status
thresholds, and the rule that an unfetched question is `no_data` rather than a
gap. CLAUDE.md calls the latter an accuracy rule: unknown is not a finding.

The second kind, under KNOWN FAILURES, asserts what the metric currently gets
WRONG. Those are not aspirations written as tests; they are a baseline. CLAUDE.md
settled on 2026-08-28 that lexical matching cannot separate paraphrase and that
embeddings are required, and these are the cases that settled it. When the
embedding layer lands, these assertions are the ones that should start failing -
and each `pytest.approx` here becomes the measurement of how much it bought.
"""

from __future__ import annotations

import pytest

from answergap.matching import overlap, seed_relevance
from answergap.tree import (
    STATUS_COVERED,
    STATUS_GAP,
    STATUS_NO_DATA,
    STATUS_WEAK,
    THRESHOLD,
    score_question,
)


def _results(*titles: str) -> list[dict]:
    return [{"title": t, "url": f"https://example.com/{i}"} for i, t in enumerate(titles)]


# --------------------------------------------------------- status rules


def test_no_results_is_no_data_not_a_gap() -> None:
    """CLAUDE.md's accuracy rule, and the one most expensive to get wrong.

    A question nobody fetched results for is UNKNOWN. Calling it a gap would
    manufacture the product's central claim out of an absence of evidence.
    """
    scored, matching, status = score_question("anything at all?", [], "en")
    assert status == STATUS_NO_DATA
    assert scored == []
    assert matching == 0


def test_zero_matching_pages_is_a_gap() -> None:
    """Few pages clearing the threshold is the metric - not highest overlap.

    CLAUDE.md's Phase 0 finding: the question with the single 1.00 result was
    the real gap, and the one where all eight sat near 0.67 was well covered.
    Ranking by best match would have inverted both.
    """
    _, matching, status = score_question(
        "how do I refinish a walnut veneer dresser?",
        _results("Cat breeds", "Weather today", "Stock prices"),
        "en",
    )
    assert matching == 0
    assert status == STATUS_GAP


@pytest.mark.parametrize(
    "count,expected",
    [(1, STATUS_WEAK), (2, STATUS_WEAK), (3, STATUS_COVERED), (5, STATUS_COVERED)],
)
def test_status_boundary_between_weak_and_covered(count: int, expected: str) -> None:
    """One or two pages is weak; three is covered. The boundary is load-bearing."""
    titles = ["Teeth whitening cost"] * count + ["Unrelated page"] * 4
    _, matching, status = score_question("teeth whitening cost", _results(*titles), "en")
    assert matching == count
    assert status == expected


def test_threshold_is_the_documented_value() -> None:
    # Not settled, and deliberately so - CLAUDE.md keeps it open until ~200
    # labels exist. Pinned here so a change to it is a deliberate act with a
    # failing test attached, rather than a silent re-interpretation of every
    # score already recorded.
    assert THRESHOLD == 0.60


# ------------------------------------------------------- KNOWN FAILURES
#
# Each of these is a page that DOES answer the question, scored by a metric that
# says it does not - or the reverse. They are the four rows from CLAUDE.md's
# SETTLED block, and the reason the answer there was "embeddings, not a bigger
# dictionary": three of them are paraphrase, which no word-to-word map reaches.


def test_open_class_paraphrase_is_missed() -> None:
    """`60 year old` vs `senior`: an open class a dictionary cannot enumerate.

    60/70/80 year old, elderly, aging, older adults - the list has no end. The
    page answers the question; the metric scores it below the threshold and the
    question is reported as unanswered when it is not.
    """
    score = overlap(
        "Can 60 year old teeth be whitened?", "Can Senior Teeth be Whitened?", "", "en"
    )
    assert score == pytest.approx(0.5)
    assert score < THRESHOLD  # <- the failure. Should be >= once embeddings land.


def test_multi_word_paraphrase_currently_clears_the_bar() -> None:
    """`whitened` vs `become white again`, and it happens to work.

    Worth pinning precisely because it is luck, not design: the shared tokens
    carry it over the line. If a tokenizer change quietly drops it, that is a
    regression the product would otherwise only notice as a wrong answer.
    """
    score = overlap(
        "Can yellow teeth actually be whitened?",
        "Can Yellow Teeth Become White Again?",
        "",
        "en",
    )
    assert score == pytest.approx(0.75)
    assert score >= THRESHOLD


# ------------------------------------------------------- seed relevance


def test_seed_relevance_separates_the_extremes() -> None:
    on_topic = seed_relevance("knight online", "Is Knight Online still popular?", "en")
    drifted = seed_relevance("knight online", "Are MMOs a dying genre?", "en")
    assert on_topic == pytest.approx(1.0)
    assert drifted == pytest.approx(0.0)


def test_seed_relevance_cannot_split_the_middle_band() -> None:
    """The undecidable 0.50 band, and why EXPANSION_FLOOR is 0.25 rather than 0.5.

    A competitor question and a medieval-history question score identically.
    CLAUDE.md's measurement across 44 harvested questions found 23 of them here.
    Gating at 0.5 would throw away the competitor question - exactly what this
    product exists to find - so the band is kept and drift is caught by `reach`
    compounding along the path instead.
    """
    competitor = seed_relevance(
        "knight online", "Is there a free-to-play knight game available?", "en"
    )
    medieval = seed_relevance("knight online", "Did any peasants become knights?", "en")
    assert competitor == pytest.approx(medieval)
    assert competitor == pytest.approx(0.5)
