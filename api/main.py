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

import gzip
import json
import os
from contextlib import asynccontextmanager
from pathlib import Path

from fastapi import FastAPI, HTTPException, Request
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel, Field

from answergap import db, labels, live
from answergap.dataforseo import (
    LIVE_COST_PER_REQUEST,
    STANDARD_COST_PER_REQUEST,
    BudgetExceeded,
    DataForSEOError,
)
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
        # There is one role today and it is hard-coded. That is deliberate
        # rather than lazy: the developer surface is built behind this flag now,
        # so when sign-in arrives the ONLY change is where the value comes from -
        # a session instead of a constant - and nothing built today is thrown
        # away. A UI that has never had to ask "who is looking?" is much harder
        # to retrofit than one that always asked and always got the same answer.
        "role": "developer",
        # Real per-request prices, measured and reported - not credits. CLAUDE.md
        # prices in credits for customers; a developer needs the underlying cost,
        # because the whole point of the Standard queue is a comparison you can
        # only make in the currency actually being spent.
        "pricing": {
            "live_per_request": round(LIVE_COST_PER_REQUEST, 6),
            "standard_per_request": round(STANDARD_COST_PER_REQUEST, 6),
            "click_surcharge": live.CLICK_SURCHARGE,
            "click_depth": live.CLICK_DEPTH,
        },
        # Storage state. `configured` says whether a DATABASE_URL reached the
        # service at all, which is the difference between "no database yet" and
        # "database present but broken" - two problems with different fixes.
        "storage": _DB,
        # A COUNT, not a rebuild. This used to be `len(_live_all())`, which
        # built every live tree in full to return one number - measured at 8.9
        # seconds for a 612-byte response.
        "tree_count": len(_TREES) + _live_count(),
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


def _live_all() -> list[dict]:
    """Live trees, read fresh from the database when there is one.

    The in-memory `_LIVE` dict is the filesystem backend's cache and it quietly
    assumes a single process. Once the rows are in Postgres the truth is shared,
    so reading per request is both correct and cheap - and it is what stops a
    second replica from serving a stale tree it happens to remember.
    """
    if db.available():
        try:
            return live.load_trees()
        except Exception:  # noqa: BLE001 - reported via /api/meta, never fatal
            pass
    return list(_LIVE.values())


def _live_count() -> int:
    if db.available():
        try:
            return db.live_tree_count()
        except Exception:  # noqa: BLE001
            pass
    return len(_LIVE)


def _live_one(slug: str) -> dict | None:
    if db.available():
        try:
            found = live.load_tree(slug)
            if found:
                return found
        except Exception:  # noqa: BLE001
            pass
    return _LIVE.get(slug)


def _lookup(slug: str) -> dict:
    found = _live_one(slug) or _BY_SLUG.get(slug)
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
        _live_all(), key=lambda t: t.get("updated_at") or "", reverse=True
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


# ------------------------------------------------------- batch scoring
#
# CLAUDE.md's Standard-queue deviation closes here. It was recorded as a
# deliberate trade - "a webhook cannot reach a laptop" - and the laptop is now a
# deployed service, so the reason expired rather than the rule changing.
#
# The seed search stays on Live. Someone is waiting in front of it, and minutes
# of latency to save a tenth of a cent is the wrong trade by CLAUDE.md's own
# reasoning. A batch is the opposite case: nobody watches it, and ten questions
# is where 3.3x stops being a rounding error.

# Where DataForSEO should send finished tasks. Both halves are required, and if
# either is missing the batch falls back to polling rather than silently posting
# tasks with a callback that goes nowhere.
PUBLIC_BASE_URL = os.environ.get("PUBLIC_BASE_URL", "").rstrip("/")
CALLBACK_TOKEN = os.environ.get("CALLBACK_TOKEN", "")


def _postback_url() -> str | None:
    if not (PUBLIC_BASE_URL and CALLBACK_TOKEN):
        return None
    return (
        f"{PUBLIC_BASE_URL}/api/callback/dataforseo"
        f"?token={CALLBACK_TOKEN}&id=$id&tag=$tag"
    )


class BatchScoreRequest(BaseModel):
    """Either an explicit list of questions, or the top N by ranking signal."""

    questions: list[str] | None = None
    # Capped deliberately. This endpoint spends money per item, and an
    # unbounded top_n behind one click is how a batch becomes a bill.
    top_n: int | None = Field(default=None, ge=1, le=50)
    dry_run: bool = False


@app.post("/api/tree/{slug}/score-batch")
def score_batch(slug: str, request: BatchScoreRequest) -> dict:
    """Queue gap scoring for several questions at once, on the Standard queue.

    The reply always carries `estimated_spend`, dry run or not. CLAUDE.md's
    operating rule is that the price is visible before anything is spent, and a
    batch is exactly where a surprise would be expensive.

    Results do NOT come back in this response. Tasks are queued and arrive
    minutes later by postback; poll `/api/tree/{slug}/jobs` for progress.
    """
    found = _lookup(slug)
    if found.get("source") != "live":
        raise HTTPException(
            409,
            "Archived Phase 0 trees are fixed evidence and are not re-scored. "
            "Run a live search for this seed instead.",
        )
    if not db.available():
        raise HTTPException(
            503,
            "Batch scoring needs the database: a queued task is paid for at "
            "post time, so its id has to be written down before the result "
            "can go missing.",
        )
    try:
        result = _run(
            lambda: live.queue_scores(
                found,
                question_slugs=request.questions,
                top_n=request.top_n,
                dry_run=request.dry_run,
                postback_url=_postback_url(),
            )
        )
    except KeyError as e:
        raise HTTPException(404, f"No question: {e}") from e
    result["callback"] = bool(_postback_url())
    return result


@app.get("/api/tree/{slug}/jobs")
def tree_jobs(slug: str) -> dict:
    """Queued scoring for this tree, and what it has cost.

    Sweeps stranded tasks on the way past. There is no job runner yet, and a
    postback can be lost to a deploy landing mid-flight - so the recovery runs
    where something is already polling. `task_get` is free and results live for
    30 days, which makes a lost callback a re-fetch rather than a re-purchase,
    but only if somebody actually goes and looks.
    """
    if not db.available():
        return {"tasks": [], "spend": 0.0, "swept": None}
    # Three, not ten. Each one is a fetch plus scoring plus a tree write, and
    # ten of them inside a GET timed the request out the first time this ran for
    # real. The sweep is the FALLBACK path - with a callback configured it has
    # nothing to do - so it only has to make progress on each poll, not finish.
    swept = live.sweep_pending(older_than_seconds=120, limit=3)
    tasks = db.tasks_for_tree(slug)
    return {
        "tasks": tasks,
        "pending": sum(1 for t in tasks if t["status"] == "posted"),
        "done": sum(1 for t in tasks if t["status"] == "done"),
        "failed": sum(1 for t in tasks if t["status"] == "failed"),
        **db.task_spend(slug),
        "swept": swept,
    }


@app.post("/api/callback/dataforseo")
async def dataforseo_callback(http_request: Request) -> dict:
    """Where finished Standard-queue tasks land.

    This endpoint is public, so it is guarded by a shared token and FAILS
    CLOSED: with no CALLBACK_TOKEN configured every callback is rejected rather
    than trusted. Without that, anyone could POST a fabricated SERP response and
    write a gap score the product would then present as measured evidence.

    DataForSEO sends the payload gzipped. A body that will not decompress is
    answered 400 rather than 500 - it is a malformed request, not our fault, and
    a 500 invites a redelivery that will fail identically.

    Ingestion is idempotent: a task already out of `posted` state is ignored, so
    a redelivered callback cannot double-count a harvest.
    """
    token = http_request.query_params.get("token", "")
    if not CALLBACK_TOKEN or token != CALLBACK_TOKEN:
        raise HTTPException(403, "Bad callback token.")

    raw = await http_request.body()
    try:
        if raw[:2] == b"\x1f\x8b":
            raw = gzip.decompress(raw)
        payload = json.loads(raw.decode("utf-8"))
    except (OSError, UnicodeDecodeError, json.JSONDecodeError) as e:
        raise HTTPException(400, f"Undecodable callback body: {e}") from e

    task_id = http_request.query_params.get("id") or ""
    tasks = payload.get("tasks") or []
    if tasks and tasks[0].get("id"):
        task_id = tasks[0]["id"]  # the body is more trustworthy than the URL
    if not task_id:
        raise HTTPException(400, "Callback carried no task id.")

    result = live.ingest_task(task_id, payload)
    return {
        "task_id": task_id,
        "ingested": bool(result),
        "discovered": len(result["discovered"]) if result else 0,
    }


# --------------------------------------------------------- developer view


@app.get("/api/dev/spend")
def dev_spend(slug: str | None = None) -> dict:
    """Everything spent, and what the queue choice saved.

    Reported figures only. The estimate exists to price a dry run BEFORE a
    request; once one has been made, the number DataForSEO put on it is the
    only honest one, and a developer view filled with plausible guesses would be
    worse than no view at all.
    """
    if not db.available():
        raise HTTPException(503, "No database configured.")
    summary = db.spend_summary(slug)
    summary["storage"] = _DB
    summary["callback_configured"] = bool(_postback_url())
    return summary


# --------------------------------------------------------------- diff


@app.get("/api/tree/{slug}/diff")
def tree_diff(slug: str) -> dict:
    """What Google changed between the two most recent crawls of this seed.

    `null` rather than an empty diff when there is only one crawl. Nothing to
    compare is not "no changes", and rendering it as such would claim a
    measurement that was never made - the same distinction the interface already
    draws between `no_data` and a gap.

    Order changes never appear here. CLAUDE.md: PAA ordering moves for an
    identical query, and notifying on it would drown users in false alarms.
    """
    if not db.available():
        raise HTTPException(503, "No database configured.")
    return db.diff_and_history(slug)
