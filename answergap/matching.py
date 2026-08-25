"""Question ↔ page matching strategies.

THE PROBLEM THIS SOLVES
-----------------------
Phase 0 measured a concrete failure of plain word overlap:

    "Diş beyazlatma işlemi kaç TL?"  vs  "Diş Beyazlatma Fiyatları 2026"

Same question, no shared word for the important part ("TL" vs "fiyatları").
Overlap scored 0.67. Had the threshold been 0.80, this well-covered question
would have been reported as a GAP — a false positive in the product's central
claim. English has the identical problem: "how much does it cost" vs "Prices".

Three candidate strategies are defined so the right one can be MEASURED against
human labels rather than guessed:

    words     Plain overlap. Baseline.
    stems     Tokens truncated to the language's stem length. Absorbs
              inflection: whitening / whiten / whitened -> whit
    synonyms  stems + semantic classes from the language pack. "tl" and "fiyat"
              land in the same class; so do "cost" and "price".

`synonyms` is the current default. It is NOT validated — the Phase 0.5 labeling
round was started and not finished. `scripts/phase05_evaluate.py` exists to
settle it against real labels.
"""

from __future__ import annotations

from . import languages
from .languages import Language
from .text import content_tokens, coverage, url_tokens

STRATEGIES = ("words", "stems", "synonyms")
DEFAULT_STRATEGY = "synonyms"


def _lang(code: str | Language | None) -> Language:
    return code if isinstance(code, Language) else languages.get(code)


def page_tokens(title: str, url: str, language: str | Language | None = None) -> set[str]:
    """What a search result offers: its title plus its URL slug.

    The slug matters. A page at /teeth-whitening-cost/ is targeting that
    question even if its title is dressed up for humans.
    """
    lang = _lang(language)
    return content_tokens(title, lang) | url_tokens(url, lang)


def overlap(
    question: str,
    title: str,
    url: str,
    language: str | Language | None = None,
    strategy: str = DEFAULT_STRATEGY,
) -> float:
    """How much of the question this page covers. 0.0 - 1.0"""
    lang = _lang(language)
    q_words = content_tokens(question, lang)
    if not q_words:
        return 0.0
    p_words = page_tokens(title, url, lang)

    if strategy == "words":
        return coverage(
            {languages.fold(t, lang) for t in q_words},
            {languages.fold(t, lang) for t in p_words},
        )

    q_stems = {languages.stem(t, lang) for t in q_words}
    p_stems = {languages.stem(t, lang) for t in p_words}

    if strategy == "stems":
        return coverage(q_stems, p_stems)

    if strategy == "synonyms":
        page_classes = {
            c
            for c in (languages.synonym_class(s, lang) for s in p_stems)
            if c
        }
        hits = 0
        for s in q_stems:
            if s in p_stems:
                hits += 1
                continue
            klass = languages.synonym_class(s, lang)
            if klass and klass in page_classes:
                hits += 1
        return hits / len(q_stems)

    raise ValueError(f"unknown strategy: {strategy}")


def score_results(
    question: str,
    results: list[dict],
    language: str | Language | None = None,
    strategy: str = DEFAULT_STRATEGY,
) -> list[float]:
    """Overlap for each organic result, in SERP order."""
    return [
        overlap(
            question,
            r.get("title") or "",
            r.get("url") or "",
            language,
            strategy,
        )
        for r in results
    ]


def features(scores: list[float], threshold: float) -> dict:
    """Candidate gap signals for one question.

    Phase 0 finding: "highest overlap" is the WRONG metric. The genuinely
    unanswered question "Dişleri en çabuk ne beyazlatır?" had a maximum of 1.00
    because exactly one page matched perfectly, while the well-covered "kaç TL?"
    peaked at only 0.67 — across EIGHT pages. The signal is in the COUNT of
    pages clearing the bar, not in the best single page.
    """
    if not scores:
        return {"max": 0.0, "matching": 0, "top3_mean": 0.0, "checked": 0}
    ranked = sorted(scores, reverse=True)
    return {
        "max": ranked[0],
        "matching": sum(1 for s in scores if s >= threshold),
        "top3_mean": sum(ranked[:3]) / min(3, len(ranked)),
        "checked": len(scores),
    }
