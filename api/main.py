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
import time
from contextlib import asynccontextmanager
from pathlib import Path

from fastapi import FastAPI, HTTPException, Request
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel, Field

from answergap import db, gate, labels, live
from answergap.dataforseo import (
    LIVE_COST_PER_REQUEST,
    STANDARD_COST_PER_REQUEST,
    BudgetExceeded,
    DataForSEOError,
)
from answergap.languages import DEFAULT_LOCATION_CODE, LANGUAGES
from answergap.tree import STRATEGY, THRESHOLD, all_trees

from . import admin, auth

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

# Two routers, and the split is an AUTH boundary rather than a filing decision:
# everything in `admin` requires ADMIN_EMAILS, nothing in this file does.
app.include_router(auth.router)
app.include_router(admin.router)


def _summary(tree: dict) -> dict:
    return {k: v for k, v in tree.items() if k != "nodes"}


@app.get("/api/meta")
def meta(http_request: Request) -> dict:
    """State flags the UI turns into localized warnings.

    CLAUDE.md accuracy rules: never claim live data, always show when the data
    was last updated, never render an empty cell for missing search volume.
    These flags are how those rules reach the interface.

    THIS ENDPOINT MUST NOT QUERY THE DATABASE, and as of 2026-09-08 it does not
    - `tree_count` was the last one and it is gone. It is Railway's healthcheck
    path (see railway.json), so a per-request SELECT costs ~150 ms on every page
    load in the good case and a restart loop in the bad one. `auth.identity`
    reads headers only, and the balance deliberately lives on `/api/me`, which
    is called only when a token exists.

    `tree_count` was removed rather than made per-user: nothing in `web/` ever
    read it, and once the tree list became private it would have been a count of
    OTHER PEOPLE'S searches sitting in the payload of every page load. The
    landing page counts the list it already fetches.
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
        # The role now comes from the session, exactly as the hard-coded
        # version predicted it would: "when sign-in arrives the ONLY change is
        # where the value comes from". It was right - DevPanel's check moved
        # from "developer" to "admin" and nothing else in that component moved
        # at all.
        #
        # Derived from the token's own email claim against ADMIN_EMAILS, with NO
        # query. It grants nothing: a revoked admin token still reports "admin"
        # to the UI until it expires, but every admin endpoint loads the row and
        # re-checks the epoch, the status and the address.
        "role": auth.role_of(auth.identity(http_request)),
        # Whether sign-in is configured at all. False means the product behaves
        # exactly as it did before accounts existed, which is what a laptop with
        # no Postgres looks like - the UI hides the account menu rather than
        # offering a button that cannot work.
        "accounts_enabled": auth.accounts_enabled(),
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


def _live_all(user_id: int | None = None) -> list[dict]:
    """Live trees, read fresh from the database when there is one.

    The in-memory `_LIVE` dict is the filesystem backend's cache and it quietly
    assumes a single process. Once the rows are in Postgres the truth is shared,
    so reading per request is both correct and cheap - and it is what stops a
    second replica from serving a stale tree it happens to remember.
    """
    if db.available():
        try:
            return live.load_trees(user_id)
        except Exception:  # noqa: BLE001 - reported via /api/meta, never fatal
            pass
    return list(_LIVE.values())


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


def _authorize_tree(slug: str, who: gate.Identity) -> dict:
    """Fetch a tree and confirm this caller may see it.

    The three Phase 0 archive demos are public by design - they carry no
    user data and exist to show what the product does before anyone signs
    in. Everything else - live crawls, whether signed-in or anonymous - is
    gated by ownership: `db.can_access` says whether ANY crawl row on this
    slug matches the caller's identity, and the shared-corpus rule (two
    people searching the same seed both get a crawl row, second person for
    free) is what makes that a workable rule rather than a punishment.

    404, not 403, for an unauthorised access. Existence itself is metadata
    ("someone searched this seed"); a 403 would leak it and 404 does not.
    Aligned with `/api/trees`, which returns an empty list for a signed-out
    caller rather than "you can't see this".

    Filesystem backend (no Postgres) has no ownership concept - `can_access`
    is not called there, and the endpoint behaves as before. Local dev
    without a database was the case that made the whole gate optional at
    the schema level, and it stays optional here for the same reason.
    """
    found = _lookup(slug)
    if found.get("source") != "live":
        return found
    if not db.available():
        return found
    if db.can_access(slug, user_id=who.user_id, anon_id=who.anon_id):
        return found
    raise HTTPException(404, f"No tree: {slug}")


@app.get("/api/trees")
def trees(http_request: Request) -> list[dict]:
    """YOUR live crawls first, then the three public Phase 0 demos.

    Private as of 2026-09-08. A slug is listed only if this person has a crawl
    row for it, so what stays hidden is WHO SEARCHED WHAT - the part that is
    actually sensitive about competitor research. The tree itself is still one
    shared corpus and one shared cache: two people searching the same seed get
    the same tree, and the second one gets it free.

    Signed out, this is the three demos and nothing else. Not "everything" - an
    unauthenticated caller must never be the widest audience.

    A user who just ran a search expects to find it at the top, not below three
    fixtures they did not create.
    """
    who = auth.identity(http_request)
    live_trees = sorted(
        _live_all(who.user_id), key=lambda t: t.get("updated_at") or "", reverse=True
    )
    return [_summary(t) for t in live_trees] + [_summary(t) for t in _TREES]


@app.get("/api/tree/{slug}")
def tree(slug: str, http_request: Request) -> dict:
    """One tree, by slug. Gated as of 2026-09-14.

    The 2026-09-08 design left this endpoint open on the reading that a slug
    reveals the seed, and the seed is the sensitive half; anyone able to
    guess the slug already knew the query, and what the tree added was
    public SERP data. That reading missed what accumulates on top of the
    SERP over time - harvested questions the user paid to reveal, labels
    they gave, gap scores measured under their credit - all private
    judgements that a stranger with only the slug should not see.

    Gate: `db.can_access` matches on `user_id` for signed-in callers and
    `anon_id` for signed-out ones. The shared-corpus rule survives - two
    people searching the same seed both get a crawl row, and the second
    one gets in for free. The anonymous visitor who just completed a
    search gets back in by the same cookie their POST /api/search wrote
    the row under.
    """
    who = auth.identity(http_request)
    return _authorize_tree(slug, who)


@app.get("/api/tree/{slug}/question/{question_slug}")
def question(slug: str, question_slug: str, http_request: Request) -> dict:
    who = auth.identity(http_request)
    found = _authorize_tree(slug, who)
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
def search(request: SearchRequest, http_request: Request) -> dict:
    """Discover a question tree for one seed. ONE billable request, or zero.

    Gap scoring is NOT run here. Discovery is cheap and scoring is per-question,
    so they are priced and triggered separately; every question comes back
    `no_data` until the user asks for it to be scored.

    This is the one paid endpoint anonymous visitors may reach, and the daily
    allowance is set from the admin panel. A dry run never passes the gate: the
    price has to be visible BEFORE anything is spent, and refusing to quote a
    price to someone with no credits would be user-hostile for no gain, since a
    dry run cannot be turned into a purchase.
    """
    _guard(request.language_code)
    who = auth.identity(http_request)
    if not request.dry_run:
        auth.check(who, action="search", units=1)
    result = _run(
        lambda: live.crawl(
            request.seed,
            request.location_code,
            request.language_code,
            refresh=request.refresh,
            dry_run=request.dry_run,
            user_id=who.user_id,
            # The anon cookie is how a signed-out visitor gets back into their
            # own tree after the POST returns. Written on the crawl row here so
            # `_authorize_tree` can recognise them on the follow-up GET.
            anon_id=who.anon_id,
        )
    )
    if not result.get("dry_run"):
        _LIVE[result["slug"]] = result
        # Charged on what was ACTUALLY bought. A cache hit reports zero billable
        # calls and therefore costs no credit - CLAUDE.md's pricing rule falling
        # out of the measurement rather than being asserted separately.
        auth.record(
            who,
            action="search",
            billable_calls=result.get("billable_calls", 0),
            spend=result.get("estimated_spend", 0.0),
            tree_slug=result.get("slug"),
        )
    return result


@app.post("/api/tree/{slug}/question/{question_slug}/score")
def score_question_endpoint(
    slug: str, question_slug: str, http_request: Request, refresh: bool = False
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
    who = auth.identity(http_request)
    found = _authorize_tree(slug, who)
    if found.get("source") != "live":
        raise HTTPException(
            409,
            "Archived Phase 0 trees are fixed evidence and are not re-scored. "
            "Run a live search for this seed instead.",
        )
    # 404 BEFORE the credit gate. The node list is already in memory, so the
    # check is free, and it keeps the errors honest: someone with no credits
    # asking about a question that does not exist should be told it does not
    # exist. Note the ownership gate ran first (via `_authorize_tree`) - a
    # stranger gets the same 404 as "no such tree" and never learns whether
    # this specific question exists on someone else's slug.
    if not any(n.get("slug") == question_slug for n in found.get("nodes", [])):
        raise HTTPException(404, f"No question: {question_slug}")

    auth.check(who, action="score", units=1)
    try:
        result = _run(lambda: live.score(found, question_slug, refresh=refresh))
    except KeyError as e:
        raise HTTPException(404, f"No question: {question_slug}") from e
    _LIVE[found["slug"]] = found
    auth.record(
        who,
        action="score",
        billable_calls=result.get("billable_calls", 0),
        spend=result.get("spent", 0.0),
        tree_slug=slug,
        question_slug=question_slug,
    )
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
def tree_labels(slug: str, http_request: Request) -> dict[str, str]:
    """Verdicts already given on this tree's questions, by question slug.

    Resolved through the question text, not the tree, so a verdict given on the
    same question in another tree shows up here too. The judgement is about the
    question against its results; which branch it was reached through is not
    part of it.

    Gated as of 2026-09-14: labels are private judgements the owner gave on
    their own SERP data. Even though the labels themselves are keyed by
    question text globally, exposing the LIST of a tree's labels reveals
    what verdicts the owner gave on it.
    """
    who = auth.identity(http_request)
    return labels.for_tree(_authorize_tree(slug, who))


@app.post("/api/tree/{slug}/question/{question_slug}/label")
def label_question(
    slug: str,
    question_slug: str,
    request: LabelRequest,
    http_request: Request,
) -> dict:
    """Record a human verdict on one gap score. Free, and never billable.

    Allowed on archived trees as well as live ones. Scoring is refused on the
    archive because it would spend money rewriting fixed evidence; labelling
    spends nothing and the archive is the best-understood data on disk, so
    refusing it would throw away the easiest labels available.

    Refused on an unscored question: with no fetched results there is no claim
    to agree or disagree with, and CLAUDE.md is explicit that unknown must stay
    unknown rather than being recorded as a judgement.

    Gated as of 2026-09-14. Verdicts belong to the owner of the crawl they
    were given on; a stranger cannot label someone else's tree even though
    the underlying label store is keyed by question text and not by tree.
    """
    who = auth.identity(http_request)
    found = _authorize_tree(slug, who)
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
def score_batch(slug: str, request: BatchScoreRequest, http_request: Request) -> dict:
    """Queue gap scoring for several questions at once, on the Standard queue.

    The reply always carries `estimated_spend`, dry run or not. CLAUDE.md's
    operating rule is that the price is visible before anything is spent, and a
    batch is exactly where a surprise would be expensive.

    Results do NOT come back in this response. Tasks are queued and arrive
    minutes later by postback; poll `/api/tree/{slug}/jobs` for progress.

    COSTS N CREDITS, NOT ONE - one per task actually posted.

    The dry run is deliberately ungated, and that is load-bearing rather than an
    oversight: the confirm dialog is built from a dry run, so gating it would
    mean a user with three credits could never see the price of a batch of ten
    and could not reach the confirm step at all.

    A short balance TRIMS the batch instead of refusing it. The exact billable
    count is only known after `queue_scores` filters out questions already
    scored or already in flight, so the pre-check can only work from an upper
    bound - and refusing on an upper bound would refuse batches that would have
    fitted. What it cannot afford is reported through the `skipped` list the UI
    already renders.

    Gated as of 2026-09-14. A batch spends the caller's OWN credits, so
    refusing an unowned tree here is stronger than the read side: even if
    the tree is public evidence, spending someone else's next 10 credits on
    it would be a different kind of leak.
    """
    who = auth.identity(http_request)
    found = _authorize_tree(slug, who)
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
    budget: int | None = None
    if not request.dry_run:
        ceiling = len(request.questions) if request.questions else (request.top_n or 10)
        budget = auth.check(who, action="batch", units=ceiling).affordable_units

    try:
        result = _run(
            lambda: live.queue_scores(
                found,
                question_slugs=request.questions,
                top_n=request.top_n,
                dry_run=request.dry_run,
                postback_url=_postback_url(),
                max_items=budget,
                user_id=who.user_id,
            )
        )
    except KeyError as e:
        raise HTTPException(404, f"No question: {e}") from e
    result["callback"] = bool(_postback_url())
    if not request.dry_run:
        # Only tasks DataForSEO actually accepted. A rejected post comes back
        # with a null task_id and was never charged upstream, so charging a
        # credit for it would be billing for nothing.
        posted = sum(1 for p in (result.get("posted") or []) if p.get("task_id"))
        auth.record(
            who,
            action="batch",
            billable_calls=posted,
            spend=result.get("spend", 0.0),
            tree_slug=slug,
        )
    return result


# Per-slug cooldown for the fallback sweep. Ownership gating (2026-09-14)
# already keeps strangers off `/jobs`, but a legitimate owner polling hard is
# still request amplification: every call runs `sweep_pending(limit=3)`, and
# each swept task is a `task_get` on DataForSEO. Free per call but the ratio
# is 3-to-1, so a per-second poll on a stuck tree pushes 180 upstream calls
# per minute per slug. The cooldown breaks the ratio: at most one sweep per
# slug per SWEEP_COOLDOWN_SECONDS, regardless of who is polling.
#
# The endpoint STILL SERVES on cooldown - it just returns `swept: null` and
# reads the current task status from Postgres, which is what the UI actually
# needs to render progress. The sweep is the FALLBACK path; with callbacks
# configured it has nothing to do anyway, and cooldown is a stronger cap for
# the callback-less case than "3 not 10" ever was.
#
# In-memory. Process-local state resets on redeploy, which is a burst of
# sweeps right after restart at worst - much less than the alternative of
# a DB round trip per poll to answer "when did we last sweep this slug".
SWEEP_COOLDOWN_SECONDS = 30
_last_sweep_at: dict[str, float] = {}


def _should_sweep(slug: str, *, now: float | None = None) -> bool:
    """Return True if this slug is due for a sweep, and mark it swept.

    Optimistic: if this returns True, the caller MUST call `sweep_pending` -
    or the cooldown holds against a sweep that never ran. Failing the sweep
    afterwards is fine (the next call will simply see no progress), which is
    why the mark-first-then-sweep order beats rollback-on-failure.

    `now` is injectable for tests, so a cooldown boundary can be walked
    without touching `time.time` (and without threading a fake clock through
    the whole module).

    "Never swept" is None, not 0.0. A `.get(slug, 0.0)` default would collide
    with a real `now=0.0` in tests - and, less obviously, with a genuine
    epoch-zero clock reading on a broken machine. None means "no timestamp",
    which is what "first time this slug is seen" actually is.
    """
    t = now if now is not None else time.time()
    last = _last_sweep_at.get(slug)
    if last is not None and t - last < SWEEP_COOLDOWN_SECONDS:
        return False
    _last_sweep_at[slug] = t
    return True


@app.get("/api/tree/{slug}/jobs")
def tree_jobs(slug: str, http_request: Request) -> dict:
    """Queued scoring for this tree, and what it has cost.

    Sweeps stranded tasks on the way past, at most once per
    SWEEP_COOLDOWN_SECONDS per slug (see `_should_sweep`). There is no job
    runner yet, and a postback can be lost to a deploy landing mid-flight -
    so the recovery runs where something is already polling. `task_get` is
    free and results live for 30 days, which makes a lost callback a
    re-fetch rather than a re-purchase, but only if somebody actually goes
    and looks.

    Gated as of 2026-09-14. Queued tasks are the caller's paid work - the ids
    and spend numbers here are the same evidence a stranger should not see on
    the read side. Ownership check is up front, so `sweep_pending` never runs
    for someone who has no business polling this tree.
    """
    if not db.available():
        return {"tasks": [], "spend": 0.0, "swept": None}
    who = auth.identity(http_request)
    _authorize_tree(slug, who)
    # Three, not ten. Each one is a fetch plus scoring plus a tree write, and
    # ten of them inside a GET timed the request out the first time this ran for
    # real. The sweep is the FALLBACK path - with a callback configured it has
    # nothing to do - so it only has to make progress on each poll, not finish.
    # Cooldown further caps the fallback: at most one sweep per slug per window.
    swept = live.sweep_pending(older_than_seconds=120, limit=3) if _should_sweep(slug) else None
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
def dev_spend(http_request: Request, slug: str | None = None) -> dict:
    """Everything spent, and what the queue choice saved. ADMIN ONLY.

    Reported figures only. The estimate exists to price a dry run BEFORE a
    request; once one has been made, the number DataForSEO put on it is the
    only honest one, and a developer view filled with plausible guesses would be
    worse than no view at all.

    Nothing breaks by locking this down: DevPanel is the only caller and it
    already returns null before fetching when the role does not match.
    """
    auth.require_admin(http_request)
    if not db.available():
        raise HTTPException(503, "No database configured.")
    summary = db.spend_summary(slug)
    summary["storage"] = _DB
    summary["callback_configured"] = bool(_postback_url())
    return summary


# --------------------------------------------------------------- diff


@app.get("/api/tree/{slug}/diff")
def tree_diff(slug: str, http_request: Request) -> dict:
    """What Google changed between the two most recent crawls of this seed.

    `null` rather than an empty diff when there is only one crawl. Nothing to
    compare is not "no changes", and rendering it as such would claim a
    measurement that was never made - the same distinction the interface already
    draws between `no_data` and a gap.

    Order changes never appear here. CLAUDE.md: PAA ordering moves for an
    identical query, and notifying on it would drown users in false alarms.

    Gated as of 2026-09-14. A diff describes CHANGES someone else may have
    caused to the shared corpus - a stranger reading it would learn when the
    seed was last re-crawled by anyone. That is exactly the metadata leak
    `/api/tree/{slug}` was closed to stop.
    """
    if not db.available():
        raise HTTPException(503, "No database configured.")
    who = auth.identity(http_request)
    _authorize_tree(slug, who)
    return db.diff_and_history(slug)


@app.get("/api/dev/timing")
def dev_timing(http_request: Request) -> dict:
    """Where a request's time actually goes, measured on the server. ADMIN ONLY.

    Added because a client-side stopwatch cannot tell "the database is far away"
    from "we are doing something stupid", and the two have opposite fixes. The
    first round of optimisation was aimed correctly only because the numbers
    said the Atlantic was innocent; this endpoint is what makes the next round
    equally cheap to aim.
    """
    auth.require_admin(http_request)
    import time

    marks: dict[str, float] = {}

    def timed(name: str, fn):
        start = time.perf_counter()
        try:
            value = fn()
        except Exception as exc:  # noqa: BLE001 - a probe must not fail the probe
            value = f"{type(exc).__name__}"
        marks[name] = round((time.perf_counter() - start) * 1000, 1)
        return value

    timed("credentials_env_read", live.available)
    timed("checkout_plus_one_query", lambda: _select_one())
    # Five queries inside ONE checkout. The difference between this and the
    # line above is what a pooled checkout costs; this divided by five is the
    # raw round trip to the database, which is the number that says whether the
    # database is in the same region as the service.
    timed("five_queries_one_connection", lambda: _select_many(5))
    timed("live_tree_count", db.live_tree_count)
    timed("label_counts", labels.counts)
    timed("archive_trees_len", lambda: len(_TREES))
    return {"ms": marks, "note": "server-side only; excludes network"}


def _select_many(n: int) -> int:
    with db.connect() as conn, conn.cursor() as cur:
        for _ in range(n):
            cur.execute("SELECT 1 AS n")
            cur.fetchone()
    return n


def _select_one() -> int:
    """The cheapest possible query. Measures one pooled round trip and nothing else."""
    with db.connect() as conn, conn.cursor() as cur:
        cur.execute("SELECT 1 AS n")
        return cur.fetchone()["n"]
