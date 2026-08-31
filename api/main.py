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
import os
from contextlib import asynccontextmanager
from pathlib import Path

from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel, Field

from answergap import db, labels, live
from answergap.dataforseo import BudgetExceeded, DataForSEOError
from answergap.languages import DEFAULT_LOCATION_CODE, LANGUAGES
from answergap.tree import STRATEGY, THRESHOLD, all_trees

ROOT = Path(__file__).resolve().parent.parent
COUNTRIES_PATH = ROOT / "data" / "locations" / "countries.json"

# Who may call this API from a browser. Every screen in `web/` is a client
# component, so the fetch comes from the visitor's browser, not from Next's
# server - which makes CORS load-bearing the moment the two halves stop sharing
# localhost. Comma-separated; the default keeps local development working with
# no environment set.
ALLOWED_ORIGINS = [
    origin.strip()
    for origin in os.environ.get(
        "ALLOWED_ORIGINS", "http://localhost:3000,http://127.0.0.1:3000"
    ).split(",")
    if origin.strip()
]

# Archive and live trees are held apart. The archive is Phase 0 evidence and is
# rebuilt from data/raw/ at startup; live trees are user crawls under data/live/
# and change while the process runs. Live slugs are market-qualified
# (`{seed}-{lang}-{location}`), so the two namespaces cannot collide.
_TREES: list[dict] = []
_BY_SLUG: dict[str, dict] = {}
_LIVE: dict[str, dict] = {}
_COUNTRIES: list[dict] = []

# What the storage layer actually did at boot. Reported by /api/meta so the
# schema can be verified from outside without anyone handling the database
# password - the migration runs inside Railway, over the private DATABASE_URL.
_DB: dict = {"configured": False, "ok": False, "tables": [], "applied": [], "error": None}


def _migrate() -> None:
    """Bring the schema up to date, if a database is configured at all.

    Idempotent: every statement is CREATE ... IF NOT EXISTS and each migration
    is recorded once in `schema_migration`, so a redeploy re-running this is a
    no-op. A failure here must NOT take the API down - without Postgres the
    filesystem backend still serves the archive and the demo trees, and a
    storage outage that blanks the whole product would be a worse failure than
    the one it is reporting.
    """
    global _DB
    _DB = {"configured": bool(db.url()), "ok": False, "tables": [], "applied": [], "error": None}
    if not db.available():
        return
    try:
        _DB["applied"] = db.migrate()
        _DB["tables"] = db.tables()
        _DB["ok"] = True
    except Exception as exc:  # noqa: BLE001 - reported, never fatal
        _DB["error"] = f"{type(exc).__name__}: {exc}"[:300]


@asynccontextmanager
async def lifespan(_: FastAPI):
    global _TREES, _BY_SLUG, _LIVE, _COUNTRIES
    _TREES = all_trees()
    _BY_SLUG = {t["slug"]: t for t in _TREES}
    # Live trees are persisted, so a --reload does not lose a crawl the user
    # already paid for.
    _LIVE = {t["slug"]: t for t in live.load_trees()}
    if COUNTRIES_PATH.exists():
        _COUNTRIES = json.loads(COUNTRIES_PATH.read_text(encoding="utf-8"))
    _migrate()
    yield


app = FastAPI(
    title="AnswerGap API (prototype)",
    description="Question trees built from the Phase 0 archive. Not live data.",
    version="0.2.0",
    lifespan=lifespan,
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=ALLOWED_ORIGINS,
    allow_methods=["GET", "POST"],
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
        # Drives the search box's disabled state. False means no credentials on
        # disk, which is a setup problem the UI should say out loud rather than
        # letting the user click into a 503.
        "live_crawl_available": live.available(),
        # Storage state. `configured` says whether a DATABASE_URL reached the
        # service at all, which is the difference between "no database yet" and
        # "database present but broken" - two problems with different fixes.
        "storage": _DB,
        "tree_count": len(_TREES) + len(_LIVE),
        # How much labelled data the threshold question has to work with.
        # Phase 0.5 settled it with 14 rows and could not separate the one
        # real gap from four false ones; the UI says so out loud, and this
        # is the number it says.
        "labels": labels.counts(),
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


def _lookup(slug: str) -> dict:
    found = _LIVE.get(slug) or _BY_SLUG.get(slug)
    if not found:
        raise HTTPException(404, f"No tree: {slug}")
    return found


@app.get("/api/trees")
def trees() -> list[dict]:
    """Live crawls first, then the Phase 0 demos.

    A user who just ran a search expects to find it at the top, not below three
    fixtures they did not create.
    """
    live_trees = sorted(
        _LIVE.values(), key=lambda t: t.get("updated_at") or "", reverse=True
    )
    return [_summary(t) for t in live_trees] + [_summary(t) for t in _TREES]


@app.get("/api/tree/{slug}")
def tree(slug: str) -> dict:
    return _lookup(slug)


@app.get("/api/tree/{slug}/question/{question_slug}")
def question(slug: str, question_slug: str) -> dict:
    found = _lookup(slug)
    for node in found["nodes"]:
        if node["slug"] == question_slug:
            return node
    raise HTTPException(404, f"No question: {question_slug}")


# --------------------------------------------------------------- live crawl


class SearchRequest(BaseModel):
    seed: str = Field(min_length=1, max_length=200)
    location_code: int = DEFAULT_LOCATION_CODE
    language_code: str = "en"
    # CLAUDE.md pricing: cached results are free, "refresh now" costs a credit.
    refresh: bool = False
    # CLAUDE.md operating rule: always be able to see the plan and the cost
    # before spending anything.
    dry_run: bool = False


def _guard(language_code: str) -> None:
    if language_code not in LANGUAGES:
        raise HTTPException(
            400,
            f"No language pack for '{language_code}'. Scoring it would mean "
            f"using English stop words on another language, which produces "
            f"confident nonsense. Supported: {', '.join(sorted(LANGUAGES))}.",
        )


def _run(action):
    """Translate crawler failures into honest HTTP codes.

    Node-level fault tolerance is mandatory (CLAUDE.md), and the first half of
    that is not pretending a transient upstream failure is our own 500.
    """
    try:
        return action()
    except live.CredentialsMissing as e:
        raise HTTPException(503, str(e)) from e
    except BudgetExceeded as e:
        raise HTTPException(429, str(e)) from e
    except DataForSEOError as e:
        raise HTTPException(502, str(e)) from e


@app.post("/api/search")
def search(request: SearchRequest) -> dict:
    """Discover a question tree for one seed. ONE billable request, or zero.

    Gap scoring is NOT run here. Discovery is cheap and scoring is per-question,
    so they are priced and triggered separately; every question comes back
    `no_data` until the user asks for it to be scored.
    """
    _guard(request.language_code)
    result = _run(
        lambda: live.crawl(
            request.seed,
            request.location_code,
            request.language_code,
            refresh=request.refresh,
            dry_run=request.dry_run,
        )
    )
    if not result.get("dry_run"):
        _LIVE[result["slug"]] = result
    return result


@app.post("/api/tree/{slug}/question/{question_slug}/score")
def score_question_endpoint(
    slug: str, question_slug: str, refresh: bool = False
) -> dict:
    """Gap-score one question. ONE billable request, or zero if cached.

    This is the expensive half of the product: one SERP call per question. It
    stays explicit so the cost is always something the user chose.

    The same request is also a discovery call, so the reply carries more than
    the scored node: `live.score` mines the response for its own PAA block and
    related searches. `nodes` therefore comes back whole rather than as a single
    node to swap in - the harvest can add a parent to a question already on
    screen, which no single-node reply could express.

    `dropped` is part of the contract, not debug output. A crawl that bounds its
    own coverage has to say so, or it reads as complete when it is not.
    """
    found = _lookup(slug)
    if found.get("source") != "live":
        raise HTTPException(
            409,
            "Archived Phase 0 trees are fixed evidence and are not re-scored. "
            "Run a live search for this seed instead.",
        )
    try:
        result = _run(lambda: live.score(found, question_slug, refresh=refresh))
    except KeyError as e:
        raise HTTPException(404, f"No question: {question_slug}") from e
    _LIVE[found["slug"]] = found
    return {
        "node": result["node"],
        "nodes": found["nodes"],
        "discovered": result["discovered"],
        "dropped": result["dropped"],
        "related_searches": found.get("related_searches", []),
        "status_counts": found["status_counts"],
        "node_count": found["node_count"],
    }


# ------------------------------------------------------------------ labels


class LabelRequest(BaseModel):
    """`G` gap · `N` not a gap · `?` retract a previous verdict."""

    label: str = Field(pattern="^[GNgn?]$")


@app.get("/api/tree/{slug}/labels")
def tree_labels(slug: str) -> dict[str, str]:
    """Verdicts already given on this tree's questions, by question slug.

    Resolved through the question text, not the tree, so a verdict given on the
    same question in another tree shows up here too. The judgement is about the
    question against its results; which branch it was reached through is not
    part of it.
    """
    return labels.for_tree(_lookup(slug))


@app.post("/api/tree/{slug}/question/{question_slug}/label")
def label_question(slug: str, question_slug: str, request: LabelRequest) -> dict:
    """Record a human verdict on one gap score. Free, and never billable.

    Allowed on archived trees as well as live ones. Scoring is refused on the
    archive because it would spend money rewriting fixed evidence; labelling
    spends nothing and the archive is the best-understood data on disk, so
    refusing it would throw away the easiest labels available.

    Refused on an unscored question: with no fetched results there is no claim
    to agree or disagree with, and CLAUDE.md is explicit that unknown must stay
    unknown rather than being recorded as a judgement.
    """
    found = _lookup(slug)
    node = next(
        (n for n in found["nodes"] if n["slug"] == question_slug), None
    )
    if node is None:
        raise HTTPException(404, f"No question: {question_slug}")
    if not node.get("results_checked"):
        raise HTTPException(
            409,
            "This question has no fetched results, so there is no gap verdict "
            "to agree or disagree with. Score it first.",
        )

    try:
        labels.record(
            question=node["question"],
            language_code=found.get("language_code") or "en",
            location_code=found.get("location_code"),
            label=request.label,
            tree_slug=found["slug"],
            question_slug=question_slug,
            predicted=node.get("status"),
            threshold=found.get("threshold", THRESHOLD),
            strategy=found.get("strategy", STRATEGY),
            matching_pages=node.get("matching_pages"),
            results_checked=node.get("results_checked"),
            overlaps=[r["overlap"] for r in node.get("results", [])],
        )
    except labels.InvalidLabel as e:
        raise HTTPException(400, str(e)) from e

    return {
        "labels": labels.for_tree(found),
        "counts": labels.counts(),
    }
