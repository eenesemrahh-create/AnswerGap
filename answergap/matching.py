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

from . import embeddings, languages
from .languages import Language
from .text import content_tokens, coverage, url_tokens

# "embeddings" is the strategy CLAUDE.md's SETTLED block landed on for the
# dictionary-vs-embeddings question: paraphrase is out of reach of a word-level
# metric. Whether it is ACTUALLY used at scoring time is `active_strategy()`
# below - a separate decision from "is the Voyage layer configured".
STRATEGIES = ("words", "stems", "synonyms", "embeddings")
DEFAULT_STRATEGY = "synonyms"

# The env flag that unlocks embeddings as the default strategy. See
# `active_strategy()` for the two-gate reasoning.
USE_EMBEDDINGS_FLAG = "ANSWERGAP_USE_EMBEDDINGS"


def active_strategy() -> str:
    """The strategy the product should USE right now.

    Returns `embeddings` only when BOTH conditions hold: a Voyage key is
    configured AND `ANSWERGAP_USE_EMBEDDINGS` is truthy. Falls back to the
    lexical baseline otherwise.

    Two gates because "key present" is not the same as "we've decided to use
    it". The 2026-09-14 measurement recorded in CLAUDE.md ran the four
    strategies over the same 14 Phase 0.5 labels and landed embeddings
    BELOW lexical (F1 0.18 vs 0.33). Across voyage-4-lite / voyage-4 /
    voyage-4-large, none could separate the four collision rows the SETTLED
    block called out - the ordering was wrong in every tier, with the one
    real gap sitting in the middle of the three false positives rather than
    apart from them. The plumbing works; the DECISION to use it needs more
    labels than n=14 can supply.

    Keeping the key present but the flag off lets tests, batching and
    one-off scripts exercise the embedding path without changing what the
    product scores with. Callers read at call time, not import time - so a
    test flipping the flag takes effect without a reimport, and the
    `gap_score` row records what was in effect for THAT score.
    """
    if not embeddings.available():
        return DEFAULT_STRATEGY
    if not embeddings.flag(USE_EMBEDDINGS_FLAG):
        return DEFAULT_STRATEGY
    return "embeddings"


def _lang(code: str | Language | None) -> Language:
    return code if isinstance(code, Language) else languages.get(code)


def page_tokens(title: str, url: str, language: str | Language | None = None) -> set[str]:
    """What a search result offers: its title plus its URL slug.

    The slug matters. A page at /teeth-whitening-cost/ is targeting that
    question even if its title is dressed up for humans.
    """
    lang = _lang(language)
    return content_tokens(title, lang) | url_tokens(url, lang)


def page_document(
    title: str, url: str, language: str | Language | None = None
) -> str:
    """Natural-language rendering of a search result, for a semantic model.

    Embeddings work on text, not token sets, so `page_tokens` cannot be handed
    to them directly - and CLAUDE.md's rule about slugs still applies (a page
    at /teeth-whitening-cost/ is targeting that even if the title is dressed
    up for humans). The slug is written back to natural words rather than
    dropped: joined with the title, separated by a period the tokenizer will
    treat as a sentence break.

    Empty title with a slug still produces text; empty of both produces "".
    """
    title = (title or "").strip()
    lang = _lang(language)
    slug_words = " ".join(sorted(url_tokens(url, lang) - content_tokens(title, lang)))
    if title and slug_words:
        return f"{title}. {slug_words}"
    return title or slug_words


def overlap(
    question: str,
    title: str,
    url: str,
    language: str | Language | None = None,
    strategy: str = DEFAULT_STRATEGY,
) -> float:
    """How much of the question this page covers. 0.0 - 1.0

    `embeddings` is supported here too, but not batched - each call is a
    round trip to Voyage. Fine for single-pair use (tests, one-off checks);
    the scored-tree path goes through `score_results`, which batches.
    """
    if strategy == "embeddings":
        # Two calls, deliberately: Voyage returns different vectors for the
        # same string embedded as "query" vs "document", and cosine between a
        # query-vector and a document-vector is what the retrieval score is
        # meant to be. Batching happens one level up in `score_results` for
        # the multi-result case.
        doc = page_document(title, url, language)
        if not question.strip() or not doc:
            return 0.0
        q_vec = embeddings.embed([question], input_type="query")[0]
        p_vec = embeddings.embed([doc], input_type="document")[0]
        return max(0.0, embeddings.cosine(q_vec, p_vec))

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
    """Overlap for each organic result, in SERP order.

    The embeddings path is BATCHED: one HTTP call for the question, one for
    all the pages together, N-way cosine. Scoring one question against nine
    pages is two round trips, not ten - which is the difference between
    "cheap enough to be always on" and "please don't run this in a loop".
    """
    if strategy == "embeddings":
        return _score_embeddings(question, results, language)
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


def _score_embeddings(
    question: str,
    results: list[dict],
    language: str | Language | None,
) -> list[float]:
    """One call for the question, one for all pages, cosine per page.

    Blank documents get a 0.0 without touching the API - Voyage rejects empty
    input, and a page with neither title nor slug carries no signal to embed.
    Cosine is clamped at zero: a negative similarity means "opposite meaning"
    and the metric downstream is `>= threshold`, where a negative number is
    already correctly under the bar.
    """
    if not question.strip() or not results:
        return [0.0] * len(results)
    docs = [page_document(r.get("title") or "", r.get("url") or "", language) for r in results]
    q_vec = embeddings.embed([question], input_type="query")[0]
    p_vecs = embeddings.embed(docs, input_type="document")
    return [max(0.0, embeddings.cosine(q_vec, p)) for p in p_vecs]


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


def seed_relevance(
    seed: str,
    question: str,
    language: str | Language | None = None,
    strategy: str = DEFAULT_STRATEGY,
) -> float:
    """How much of the SEED's meaning a discovered question still carries.

    CLAUDE.md's crawler rule — "stop expanding nodes whose semantic similarity
    to the seed has dropped" — needs a number, and this is it. Same machinery as
    `overlap`, pointed the other way: there we ask how much of a question a PAGE
    covers, here how much of the seed a QUESTION still covers. A question with
    an empty URL is exactly a page with a title and no slug, so `overlap` does
    the work and there is no second scoring path to keep in step.

    Deliberately STAYS LEXICAL by default. `EXPANSION_FLOOR = 0.25` was
    measured against lexical scores (the 1.0/0.5/0.25/0.125/0 ladder in the
    `knight online` crawl); switching the metric under it shifts the whole
    distribution and the floor no longer marks the same boundary. Embeddings
    on the relevance gate is a follow-up that needs its own measurement, not
    a free ride on the gap-metric change.

    MEASURED on the `knight online` crawl, 44 harvested questions:

        1.00   9 questions   on topic      "Is Knight Online still popular?"
        0.50  23 questions   UNDECIDABLE   "Is there a free-to-play knight
                                            game available?" sits beside
                                            "Did any peasants become knights?"
        0.00  12 questions   drifted       "Are MMOs a dying genre?"

    So it separates the extremes cleanly and cannot split the middle band. The
    same lexical wall CLAUDE.md records against the gap threshold applies
    here too - ONE embedding layer would eventually settle both - but the gap
    metric is where the money is, so that is where it lands first.
    """
    return overlap(seed, question, "", language, strategy)
