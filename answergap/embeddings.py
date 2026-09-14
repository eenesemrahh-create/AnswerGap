"""Voyage AI client. Optional layer: no key -> not available, callers fall back.

Same seam as the DB backend and the callback token: `available()` returns False
when the env is missing and the whole product runs exactly as it did before -
which is what keeps a laptop with no Voyage account working.

Stdlib-only, per the rule `answergap/` follows. Voyage's HTTP surface is one
endpoint and one JSON envelope, so `urllib` is enough - adding `voyageai` would
move that rule for no gain and pull in a dependency that is only wanted here.

Why embeddings at all: CLAUDE.md's SETTLED block records the failure. Lexical
matching lands `60 year old` ↔ `senior` at 0.5 and `kredi notu` ↔ `kredi puanı`
at 0.25 - two paraphrases that the pages behind them actually answer, scored
below the threshold and reported as gaps that are not there. `voyage-4-lite` is
multilingual and $0.02/1M tokens; a scored question is ~200 tokens including
its page list, so a thousand scorings costs $0.012 against the ~$0.60 of SERP.
The metric that carries the product's claim now has a way to see meaning that
the words themselves do not share.
"""

from __future__ import annotations

import json
import math
import os
import urllib.error
import urllib.request
from pathlib import Path

# Same reader DataForSEO uses. Kept lazy so a machine with no `.env` still
# works (production reads from real env vars) and so an import does no I/O.
_ROOT = Path(__file__).resolve().parent.parent
_DOTENV_CACHE: dict[str, str] | None = None

# The default is Voyage's cheapest multilingual model, 1024-dim. Overridable so
# a swap does not need a code change - and every `gap_score` row already carries
# `embedding_model`, so a mid-flight change cannot silently reinterpret older
# scores as if they were produced by the new one.
MODEL = os.environ.get("VOYAGE_MODEL", "voyage-4-lite")

_ENDPOINT = "https://api.voyageai.com/v1/embeddings"
_TIMEOUT = 15.0
# Well under Voyage's per-request cap. Batching matters here: scoring one
# question against nine page titles is ONE HTTP call, not ten.
_MAX_BATCH = 128

# Session cache. Same run scores many questions against overlapping page lists;
# a title that appears twice must not turn into two HTTP calls. Cleared
# implicitly when the process ends - long enough for one crawl or one batch,
# and the persistent home for question vectors is `question.embedding` in the
# database, which this file deliberately does not touch (that write path is a
# separate concern and belongs alongside the schema, not the client).
#
# Keyed by (model, input_type, text). The same string embedded as "query" and
# as "document" is intentionally two different vectors - Voyage trains a small
# asymmetry into the two directions - so they cannot share a cache slot.
_CACHE: dict[tuple[str, str, str], list[float]] = {}


def available() -> bool:
    """Is the Voyage layer configured? No key = no.

    Says "the plumbing is wired", NOT "we've decided to use embeddings for
    scoring". That second decision is a separate flag - see `flag()` and
    `matching.active_strategy()`. The split exists because a key can be
    present for tests, batching and one-off scripts while the default
    scoring strategy stays lexical (2026-09-14 measurement, CLAUDE.md).
    """
    return bool(_api_key())


def flag(name: str) -> bool:
    """Truthy check for an env flag. Env first, .env fallback.

    Matches how `_api_key` reads VOYAGE_API_KEY: real env vars WIN over the
    file. Values that turn the flag on: 1, true, yes, on (case-insensitive,
    trimmed). Anything else - including empty and unset - leaves it off.
    Operators flip it on with a deploy and off by dropping the value; no
    code change required.
    """
    from_env = os.environ.get(name)
    if from_env is None:
        from_env = _dotenv().get(name, "")
    return (from_env or "").strip().lower() in ("1", "true", "yes", "on")


def model() -> str:
    """The chosen model. What `gap_score.embedding_model` records.

    Read at call time rather than baked in as a constant so a test can flip
    `VOYAGE_MODEL` and see the change without a reimport. The trailing rule
    still holds: whichever value was in effect for a scoring travels with the
    row, so future you can tell what an old number was measured under.
    """
    return os.environ.get("VOYAGE_MODEL") or _dotenv().get("VOYAGE_MODEL") or "voyage-4-lite"


def embed(texts: list[str], *, input_type: str) -> list[list[float]]:
    """Batch-embed a list of strings. Order preserved.

    `input_type` is "query" for the thing being searched with (the question)
    and "document" for what is being searched OVER (a page title + slug).
    Voyage trains a small asymmetry into the two directions; using them right
    buys accuracy for nothing.

    Empty strings return an empty vector rather than reaching the API - Voyage
    would reject the batch and one blank page title should not fail a whole
    scoring. Values already in the session cache do not touch the network.
    """
    if input_type not in ("query", "document"):
        raise ValueError(f"input_type must be 'query' or 'document', not {input_type!r}")
    key = _api_key()
    if not key:
        raise RuntimeError("VOYAGE_API_KEY is not set")

    active_model = model()
    out: list[list[float]] = [[] for _ in texts]
    to_fetch: list[tuple[int, str]] = []
    for i, text in enumerate(texts):
        clean = (text or "").strip()
        if not clean:
            continue
        cached = _CACHE.get((active_model, input_type, clean))
        if cached is not None:
            out[i] = cached
        else:
            to_fetch.append((i, clean))

    for start in range(0, len(to_fetch), _MAX_BATCH):
        chunk = to_fetch[start : start + _MAX_BATCH]
        vectors = _post(
            [t for _, t in chunk], input_type=input_type, model_name=active_model, key=key
        )
        if len(vectors) != len(chunk):
            raise RuntimeError(
                f"voyage returned {len(vectors)} vectors for {len(chunk)} inputs"
            )
        for (idx, text), vec in zip(chunk, vectors):
            _CACHE[(active_model, input_type, text)] = vec
            out[idx] = vec

    return out


def cosine(a: list[float], b: list[float]) -> float:
    """Cosine similarity in [-1, 1].

    Voyage's vectors are already L2-normalised (their docs say so and the
    measurement agrees), so this is a dot product in practice - but the norms
    stay in for the case where a caller passes in something else, and for the
    empty-vector short-circuit that keeps a blank page from crashing scoring.
    """
    if not a or not b or len(a) != len(b):
        return 0.0
    dot = 0.0
    na = 0.0
    nb = 0.0
    for x, y in zip(a, b):
        dot += x * y
        na += x * x
        nb += y * y
    if na == 0.0 or nb == 0.0:
        return 0.0
    return dot / math.sqrt(na * nb)


def clear_cache() -> None:
    """Drop the session cache. For tests only.

    Also clears the .env cache so a test that flips VOYAGE_API_KEY via
    monkeypatch is not shadowed by a `.env` on disk read earlier.
    """
    global _DOTENV_CACHE
    _CACHE.clear()
    _DOTENV_CACHE = None


# ---------------------------------------------------------------- internals


def _api_key() -> str | None:
    """Read `VOYAGE_API_KEY` from the environment, or from `.env` if present.

    Real env vars WIN over the file (that is how Railway overrides the copy
    stored on disk for local dev). Order: os.environ, then .env, then None.
    The .env read is cached in-process so `active_strategy()` on a hot loop
    does not hit the filesystem per question.
    """
    from_env = os.environ.get("VOYAGE_API_KEY")
    if from_env:
        return from_env
    return _dotenv().get("VOYAGE_API_KEY") or None


def _dotenv() -> dict[str, str]:
    global _DOTENV_CACHE
    if _DOTENV_CACHE is None:
        # Local import: `dataforseo` imports `db`, which is heavier than this
        # module wants to touch at import time. Deferred so the graph is flat.
        from .dataforseo import load_dotenv
        _DOTENV_CACHE = load_dotenv(_ROOT / ".env")
    return _DOTENV_CACHE


def _post(
    inputs: list[str], *, input_type: str, model_name: str, key: str
) -> list[list[float]]:
    """One HTTP round trip. Raises on non-2xx - the caller decides fallback.

    Voyage's response is OpenAI-shaped: `data[i].embedding` in input order.
    The `embeddings` short-form named in the WebFetch summary is NOT what the
    real endpoint returns; verified on the first live call, and the parser
    below reads the actual shape.
    """
    body = json.dumps(
        {"input": inputs, "model": model_name, "input_type": input_type}
    ).encode("utf-8")
    req = urllib.request.Request(
        _ENDPOINT,
        data=body,
        headers={
            "Authorization": f"Bearer {key}",
            "Content-Type": "application/json",
        },
    )
    try:
        with urllib.request.urlopen(req, timeout=_TIMEOUT) as resp:
            payload = json.loads(resp.read().decode("utf-8"))
    except urllib.error.HTTPError as exc:
        detail = exc.read().decode("utf-8", errors="replace")[:500]
        raise RuntimeError(f"voyage {exc.code}: {detail}") from exc

    # Prefer the OpenAI-style envelope, fall back to the flat one. Voyage's
    # docs describe the flat shape in one place and the enveloped one in
    # another; parsing both means a doc drift on their side never breaks this.
    data = payload.get("data")
    if isinstance(data, list) and data and "embedding" in data[0]:
        return [row["embedding"] for row in data]
    flat = payload.get("embeddings")
    if isinstance(flat, list):
        return flat
    raise RuntimeError(f"voyage: unexpected response shape: {list(payload)[:5]}")
