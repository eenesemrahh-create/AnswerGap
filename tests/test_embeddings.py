"""The Voyage layer: the seam, the batching, and what the strategy chooser picks.

Deliberately does NOT hit the network. `_post` is patched to return canned
vectors so every test is offline and repeatable - the point here is to cover
plumbing, not to prove the model settles paraphrase (that measurement is what
`scripts/phase05_evaluate.py` under the embeddings strategy is for, and it
costs real Voyage tokens).

The same pattern as `test_gate.py`: the decision surface is exercised without
any of the systems it decides ABOUT being present.
"""

from __future__ import annotations

import math

import pytest

from answergap import embeddings, matching
from answergap.matching import (
    DEFAULT_STRATEGY,
    USE_EMBEDDINGS_FLAG,
    active_strategy,
    page_document,
    score_results,
)


# --------------------------------------------------------------- helpers


def _vector(seed: int, dim: int = 8) -> list[float]:
    """A deterministic pseudo-vector for a given seed. L2-normalised.

    Not a real embedding - just enough structure to make cosine similarities
    behave the way a real model would: two vectors derived from the same seed
    are identical (cosine 1.0), different seeds land far apart. Kept tiny so
    the tests stay readable when the values are inspected.
    """
    rng = [((seed * 2654435761) >> (i * 3)) & 0xFF for i in range(dim)]
    norm = math.sqrt(sum(x * x for x in rng)) or 1.0
    return [x / norm for x in rng]


class FakeVoyage:
    """Records every _post call and hands back canned vectors.

    The vector for a given (input_type, text) is stable across calls, so the
    session cache in `embeddings.py` can be exercised too - a repeat call with
    the same text should not add to `calls`.
    """

    def __init__(self, mapping: dict[tuple[str, str], list[float]] | None = None):
        self.calls: list[dict] = []
        self.mapping = mapping or {}

    def __call__(self, inputs, *, input_type, model_name, key):
        self.calls.append(
            {"inputs": list(inputs), "input_type": input_type, "model_name": model_name}
        )
        out = []
        for text in inputs:
            v = self.mapping.get((input_type, text))
            if v is None:
                # Fallback: seed from the text so identical strings match.
                v = _vector(hash((input_type, text)) & 0xFFFF)
            out.append(v)
        return out


@pytest.fixture(autouse=True)
def _clean_env(monkeypatch):
    """Every test starts without a key OR the strategy flag. Set as needed.

    The session cache is also cleared - a value cached in one test must not
    leak into another that expects an HTTP call. The flag is unset for the
    same reason the key is: state from a previous test would silently
    change what `active_strategy()` returns here.

    The .env fallback is also stubbed out. A developer with a real
    VOYAGE_API_KEY on disk (which is how the client is meant to run locally)
    would otherwise see `available()` return True in every test that expects
    "no key present" - a nasty environment-dependent failure. Tests that
    NEED a key set it via `monkeypatch.setenv`, which the real reader
    prefers over .env anyway.
    """
    monkeypatch.delenv("VOYAGE_API_KEY", raising=False)
    monkeypatch.delenv("VOYAGE_MODEL", raising=False)
    monkeypatch.delenv(USE_EMBEDDINGS_FLAG, raising=False)
    monkeypatch.setattr(embeddings, "_dotenv", lambda: {})
    embeddings.clear_cache()


# --------------------------------------------------------------- the seam


def test_available_is_false_without_a_key() -> None:
    """No key = the whole layer is dormant, per CLAUDE.md's fallback rule."""
    assert embeddings.available() is False


def test_available_is_true_with_a_key(monkeypatch) -> None:
    monkeypatch.setenv("VOYAGE_API_KEY", "test-key")
    assert embeddings.available() is True


def test_active_strategy_falls_back_to_lexical_baseline() -> None:
    """No key = lexical. The same rule as `db.available()` gating Postgres."""
    assert active_strategy() == DEFAULT_STRATEGY


def test_active_strategy_stays_lexical_with_key_but_no_flag(monkeypatch) -> None:
    """The 2026-09-14 default: key present, flag off, strategy stays lexical.

    The plumbing is wired (so tests, batch scripts and one-off measurements
    can use embeddings) but the product's default scoring is still lexical
    until ~200 real labels settle the "is embeddings actually better" question
    that n=14 cannot answer. See CLAUDE.md's 2026-09-14 section.
    """
    monkeypatch.setenv("VOYAGE_API_KEY", "test-key")
    assert active_strategy() == DEFAULT_STRATEGY


def test_active_strategy_switches_to_embeddings_when_flag_set(monkeypatch) -> None:
    """Both gates required. Key without flag is silent, flag without key is silent."""
    monkeypatch.setenv("VOYAGE_API_KEY", "test-key")
    monkeypatch.setenv(USE_EMBEDDINGS_FLAG, "1")
    assert active_strategy() == "embeddings"


def test_active_strategy_flag_alone_does_not_enable(monkeypatch) -> None:
    """A truthy flag without a key still falls back - can't call an API that isn't there."""
    monkeypatch.setenv(USE_EMBEDDINGS_FLAG, "1")
    assert active_strategy() == DEFAULT_STRATEGY


@pytest.mark.parametrize("value", ["1", "true", "TRUE", "yes", "on", "  true  "])
def test_flag_truthy_values(monkeypatch, value) -> None:
    monkeypatch.setenv("A_FLAG", value)
    assert embeddings.flag("A_FLAG")


@pytest.mark.parametrize("value", ["", "0", "false", "no", "off", "maybe"])
def test_flag_falsy_values(monkeypatch, value) -> None:
    monkeypatch.setenv("A_FLAG", value)
    assert not embeddings.flag("A_FLAG")


def test_flag_unset_is_false(monkeypatch) -> None:
    monkeypatch.delenv("A_FLAG", raising=False)
    assert not embeddings.flag("A_FLAG")


def test_model_respects_env_override(monkeypatch) -> None:
    """A model swap needs no code change. The gap_score row records what was used."""
    monkeypatch.setenv("VOYAGE_MODEL", "voyage-4-large")
    assert embeddings.model() == "voyage-4-large"


# --------------------------------------------------------------- batching


def test_score_results_batches_one_call_per_direction(monkeypatch) -> None:
    """Nine pages against one question is TWO round trips, not ten.

    One call for the question (embedded as `query`), one call for all nine
    pages (embedded as `document`). The distinction matters: Voyage trains a
    small asymmetry into the directions and a document-vector cosined with a
    document-vector is a different retrieval score.
    """
    monkeypatch.setenv("VOYAGE_API_KEY", "test-key")
    fake = FakeVoyage()
    monkeypatch.setattr(embeddings, "_post", fake)

    results = [{"title": f"page {i}", "url": f"/p/{i}"} for i in range(9)]
    scores = score_results("teeth whitening cost", results, "en", strategy="embeddings")

    assert len(scores) == 9
    assert len(fake.calls) == 2
    types = {c["input_type"] for c in fake.calls}
    assert types == {"query", "document"}
    doc_call = next(c for c in fake.calls if c["input_type"] == "document")
    assert len(doc_call["inputs"]) == 9


def test_empty_pages_do_not_reach_the_api(monkeypatch) -> None:
    """A blank page title with no URL is a 0.0, not a rejected batch.

    Voyage 400s on empty strings, and one missing page must not fail a whole
    scoring - so the client skips them and returns an empty vector, which the
    cosine below reads as 0.
    """
    monkeypatch.setenv("VOYAGE_API_KEY", "test-key")
    fake = FakeVoyage()
    monkeypatch.setattr(embeddings, "_post", fake)

    scores = score_results(
        "a question",
        [{"title": "", "url": ""}, {"title": "real page", "url": "https://x/details"}],
        "en",
        strategy="embeddings",
    )
    # The blank one gets 0 and never reaches the API. The real one produces
    # exactly one input in the document batch.
    assert scores[0] == 0.0
    doc_call = next(c for c in fake.calls if c["input_type"] == "document")
    assert len(doc_call["inputs"]) == 1
    assert doc_call["inputs"][0].startswith("real page")


def test_cache_prevents_a_repeat_call(monkeypatch) -> None:
    """The same text within one process is embedded ONCE.

    Titles overlap across scorings within a session and a repeat title must
    not double the bill. The persistent home for question vectors is
    `question.embedding` in the schema; this cache is the cheap in-memory
    layer above it.
    """
    monkeypatch.setenv("VOYAGE_API_KEY", "test-key")
    fake = FakeVoyage()
    monkeypatch.setattr(embeddings, "_post", fake)

    first = embeddings.embed(["hello world"], input_type="query")
    second = embeddings.embed(["hello world"], input_type="query")
    assert first == second
    assert len(fake.calls) == 1  # the second call did not touch the API


def test_query_and_document_are_different_cache_slots(monkeypatch) -> None:
    """Same text, different `input_type`, different vector - and different cache key.

    Voyage's asymmetry means a document-vector for "teeth whitening" is not
    the same as its query-vector. Sharing a cache slot would silently corrupt
    the retrieval score.
    """
    monkeypatch.setenv("VOYAGE_API_KEY", "test-key")
    fake = FakeVoyage()
    monkeypatch.setattr(embeddings, "_post", fake)

    embeddings.embed(["teeth whitening"], input_type="query")
    embeddings.embed(["teeth whitening"], input_type="document")
    assert len(fake.calls) == 2


# --------------------------------------------------------------- page_document


def test_page_document_combines_title_and_slug() -> None:
    """The slug is not decoration - CLAUDE.md's rule about /teeth-whitening-cost/.

    Embeddings work on natural text, not token sets, so the slug goes in as
    words rather than being folded away. Words already in the title are not
    repeated - Voyage's tokenizer would eat the duplication anyway and it
    reads badly.
    """
    doc = page_document("Teeth Whitening Options", "https://example.com/teeth-whitening-cost/", "en")
    assert doc.startswith("Teeth Whitening Options.")
    assert "cost" in doc
    # `whitening` is in the title, so the slug half omits it - no double-billing
    # the tokenizer on a word already present. Case-insensitive because the
    # title preserves capitals and the slug is lowercased.
    assert doc.lower().count("whitening") == 1


def test_page_document_handles_missing_pieces() -> None:
    assert page_document("", "", "en") == ""
    assert page_document("just a title", "", "en") == "just a title"
    assert "product" in page_document("", "https://example.com/best-product/", "en")


# --------------------------------------------------------------- cosine


def test_cosine_matches_self_at_one() -> None:
    v = _vector(1)
    assert embeddings.cosine(v, v) == pytest.approx(1.0)


def test_cosine_empty_is_zero_not_a_crash() -> None:
    """Empty vectors are how the client signals 'skipped' - a scoring path
    that crashed on them would take one blank title down with a whole tree."""
    assert embeddings.cosine([], [1.0, 0.0]) == 0.0
    assert embeddings.cosine([1.0], [1.0, 0.0]) == 0.0  # length mismatch


# ---------------------------------------------------------- known-failure repair


def test_paraphrase_can_be_separated_with_the_right_vectors(monkeypatch) -> None:
    """The mock says paraphrase CAN separate - proving the plumbing carries a signal.

    Under lexical, `60 year old` ↔ `senior` scores 0.50 and the four rows in
    CLAUDE.md's SETTLED block collapse to identical numbers. Here the mock
    hands identical vectors to the paraphrase pair and a different one to the
    unrelated page, and the scoring wire carries that signal through cleanly.
    Whether the REAL model does this on the archive is a separate measurement.
    """
    monkeypatch.setenv("VOYAGE_API_KEY", "test-key")

    question = "Can 60 year old teeth be whitened?"
    paraphrase_title = "Can Senior Teeth be Whitened?"
    paraphrase_url = "https://x/senior-teeth"
    unrelated_title = "Random page about cats"
    unrelated_url = "https://x/cat-facts"

    # The mapping keys are the ACTUAL document text page_document produces -
    # it decides which slug words survive, not the caller, so guessing them by
    # hand is what made the first draft fall back to the seed-based vectors.
    # Orthogonal canned vectors: identical means cosine 1.0, different axis
    # means cosine 0.0. Fake enough that the assertions are exact rather than
    # sensitive to a pseudo-random distribution.
    q_vec = [1.0, 0.0, 0.0, 0.0]
    paraphrase_vec = [1.0, 0.0, 0.0, 0.0]  # deliberately identical -> cosine 1.0
    unrelated_vec = [0.0, 1.0, 0.0, 0.0]  # orthogonal -> cosine 0.0
    fake = FakeVoyage(
        mapping={
            ("query", question): q_vec,
            (
                "document",
                page_document(paraphrase_title, paraphrase_url, "en"),
            ): paraphrase_vec,
            (
                "document",
                page_document(unrelated_title, unrelated_url, "en"),
            ): unrelated_vec,
        }
    )
    monkeypatch.setattr(embeddings, "_post", fake)

    scores = score_results(
        question,
        [
            {"title": paraphrase_title, "url": paraphrase_url},
            {"title": unrelated_title, "url": unrelated_url},
        ],
        "en",
        strategy="embeddings",
    )
    assert scores[0] == pytest.approx(1.0)
    assert scores[1] < 0.5
