"""AnswerGap prototype API.

Builds its data at startup from the Phase 0 archive under `data/raw/`. There is
**no database and no live DataForSEO call** — deliberately. The schema belongs to
the live-crawl phase; committing to one now would be binding an unvalidated
product to a shape we would have to unpick.

THE API RETURNS CODES, NOT PROSE
--------------------------------
An earlier version returned human sentences ("The gap threshold has not been
validated yet…"). That cannot work in a five-language product: the server would
have to know the viewer's language. Instead the API returns machine-readable
state (`status: "gap"`, `threshold_validated: false`) and the UI renders words.

Run:
    python -m uvicorn api.main:app --reload --port 8000
"""

from __future__ import annotations

import json
from contextlib import asynccontextmanager
from pathlib import Path

from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware

from answergap.languages import DEFAULT_LOCATION_CODE, LANGUAGES
from answergap.tree import STRATEGY, THRESHOLD, all_trees

ROOT = Path(__file__).resolve().parent.parent
COUNTRIES_PATH = ROOT / "data" / "locations" / "countries.json"

_TREES: list[dict] = []
_BY_SLUG: dict[str, dict] = {}
_COUNTRIES: list[dict] = []


@asynccontextmanager
async def lifespan(_: FastAPI):
    global _TREES, _BY_SLUG, _COUNTRIES
    _TREES = all_trees()
    _BY_SLUG = {t["slug"]: t for t in _TREES}
    if COUNTRIES_PATH.exists():
        _COUNTRIES = json.loads(COUNTRIES_PATH.read_text(encoding="utf-8"))
    yield


app = FastAPI(
    title="AnswerGap API (prototype)",
    description="Question trees built from the Phase 0 archive. Not live data.",
    version="0.2.0",
    lifespan=lifespan,
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000", "http://127.0.0.1:3000"],
    allow_methods=["GET"],
    allow_headers=["*"],
)


def _summary(tree: dict) -> dict:
    return {k: v for k, v in tree.items() if k != "nodes"}


@app.get("/api/meta")
def meta() -> dict:
    """State flags the UI turns into localized warnings.

    CLAUDE.md accuracy rules: never claim live data, always show when the data
    was last updated, never render an empty cell for missing search volume.
    These flags are how those rules reach the interface.
    """
    return {
        "source": "archive",
        "live": False,
        "threshold": THRESHOLD,
        "strategy": STRATEGY,
        "threshold_validated": False,
        "search_volume_available": False,
        "live_crawl_available": False,
        "tree_count": len(_TREES),
        "default_location_code": DEFAULT_LOCATION_CODE,
        "default_language_code": "en",
    }


@app.get("/api/languages")
def languages() -> list[dict]:
    """Languages we can actually score gaps in.

    Bounded by `answergap/languages.py`. Offering a language without a pack
    would mean scoring its questions with English stop words and synonyms, which
    produces confident nonsense — worse than declining.
    """
    return [
        {"code": lang.code, "name": lang.name} for lang in LANGUAGES.values()
    ]


@app.get("/api/countries")
def countries() -> list[dict]:
    if not _COUNTRIES:
        raise HTTPException(
            503,
            "Country list not built. Run: python scripts/fetch_countries.py",
        )
    return _COUNTRIES


@app.get("/api/trees")
def trees() -> list[dict]:
    return [_summary(t) for t in _TREES]


@app.get("/api/tree/{slug}")
def tree(slug: str) -> dict:
    found = _BY_SLUG.get(slug)
    if not found:
        raise HTTPException(404, f"No tree: {slug}")
    return found


@app.get("/api/tree/{slug}/question/{question_slug}")
def question(slug: str, question_slug: str) -> dict:
    found = _BY_SLUG.get(slug)
    if not found:
        raise HTTPException(404, f"No tree: {slug}")
    for node in found["nodes"]:
        if node["slug"] == question_slug:
            return node
    raise HTTPException(404, f"No question: {question_slug}")
