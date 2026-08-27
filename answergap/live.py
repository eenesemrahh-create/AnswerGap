"""Live crawl: turn a seed keyword into a real question tree, on demand.

WHY ONE REQUEST IS ENOUGH
-------------------------
CLAUDE.md's measured rule is "fill click depth before recursing": with
`people_also_ask_click_depth=4` a single request returns ~15 questions instead
of 4, and collecting those same 15 by recursion would cost four requests.

What makes the single request a *tree* rather than a flat list is the
`seed_question` field on each PAA element. Measured on `probe-A-click4.json`:
elements 0-3 carry `seed_question: null` (Google's original four) and elements
4-14 name the question that was clicked to reveal them. That is a genuine
parent pointer, so one request yields two real levels.

Note the wrinkle the same measurement exposed: three of the four parents named
by `seed_question` were NOT among the original four. Google reflows the block as
it expands. Those parents are therefore added as level-1 nodes in their own
right, otherwise their children would be orphaned.

DISCOVERY AND GAP SCORING ARE SEPARATE - DELIBERATELY
-----------------------------------------------------
CLAUDE.md: discovery is cheap, gap analysis is not. A crawl costs ONE request
and leaves every question `no_data`; scoring one question costs one more
request and is triggered explicitly. That is also the credit model, so the code
and the pricing agree by construction.

Never dress an unscored question up as a gap. `no_data` means unknown, and the
interface has to render it distinctly.

WHY THE LIVE ENDPOINT, NOT THE STANDARD QUEUE
---------------------------------------------
CLAUDE.md mandates the Standard queue for product code and that stays right:
Standard is ~3.3x cheaper. But Standard is async - you post a task, poll
`tasks_ready`, then fetch. Results arrive in minutes, and a webhook cannot reach
a laptop. Behind an interactive search box that is the wrong trade at a
difference of about a tenth of a cent per search. When this moves off a
developer machine, the swap belongs here and nowhere else.

THE ARCHIVE IS EVIDENCE - LIVE DATA STAYS OUT OF IT
---------------------------------------------------
`data/raw/` is the Phase 0 archive that every number in the reports traces back
to, and `tree.py:index_raw` rebuilds the demo trees from whatever it finds
there. Writing crawl responses into it would silently rewrite that evidence and
grow new "saved analyses" out of it. Live data lives under `data/live/`.
"""

from __future__ import annotations

import json
import os
from datetime import datetime, timezone
from pathlib import Path

from . import languages
from .dataforseo import (
    LIVE_COST_PER_REQUEST,
    Client,
    extract_paa,
    load_dotenv,
    slugify,
)
from .text import normalize
from .tree import (
    STATUS_NO_DATA,
    STATUSES,
    STRATEGY,
    THRESHOLD,
    _ai_sources,
    _organic_results,
    score_question,
)

ROOT = Path(__file__).resolve().parent.parent

# Kept apart from data/raw/ on purpose - see the module docstring.
LIVE_DIR = ROOT / "data" / "live"
SERP_DIR = LIVE_DIR / "serp"
TREES_DIR = LIVE_DIR / "trees"

# CLAUDE.md, measured: 4 questions without it, 15 with it, for $0.0006 extra.
CLICK_DEPTH = 4

# DataForSEO's per-click surcharge, used only to price a dry run. A real call
# reports its own cost and that is what gets recorded - see `_spend`.
CLICK_SURCHARGE = 0.00015


class CredentialsMissing(RuntimeError):
    """No DataForSEO login on disk or in the environment."""


# ------------------------------------------------------------------ client


def credentials() -> tuple[str, str]:
    env = load_dotenv(ROOT / ".env")
    login = env.get("DATAFORSEO_LOGIN") or os.environ.get("DATAFORSEO_LOGIN", "")
    password = env.get("DATAFORSEO_PASSWORD") or os.environ.get(
        "DATAFORSEO_PASSWORD", ""
    )
    if not login or not password:
        raise CredentialsMissing(
            "DATAFORSEO_LOGIN / DATAFORSEO_PASSWORD not set. "
            "Copy .env.example to .env and fill it in."
        )
    return login, password


def available() -> bool:
    """Whether a live crawl could run at all. Drives the UI's disabled state."""
    try:
        credentials()
        return True
    except CredentialsMissing:
        return False


def _client(*, max_requests: int, dry_run: bool) -> Client:
    login, password = credentials()
    return Client(
        login,
        password,
        SERP_DIR,
        max_requests=max_requests,
        dry_run=dry_run,
    )


# ------------------------------------------------------------- cache keys


def cache_key(question: str, location_code: int, language_code: str) -> str:
    """CLAUDE.md's key `paa:{location}:{language}:{normalized}`, as a filename.

    The cache unit is the NODE, not the tree. Colons are illegal in Windows
    filenames, so the separator is a dash; the parts are unchanged.
    """
    stem = slugify(normalize(question, language_code))
    return f"paa-{location_code}-{language_code}-{stem}"


def tree_slug(seed: str, location_code: int, language_code: str) -> str:
    """Routing key for a live tree.

    Market-qualified deliberately. `slugify(seed)` alone would let a live crawl
    for "teeth whitening" shadow the archived demo of the same name, and would
    make the same seed in two different markets collide with each other.
    """
    return f"{slugify(seed)}-{language_code}-{location_code}"


# ------------------------------------------------------------- persistence


def _tree_path(slug: str) -> Path:
    return TREES_DIR / f"{slug}.json"


def save_tree(tree: dict) -> None:
    TREES_DIR.mkdir(parents=True, exist_ok=True)
    _tree_path(tree["slug"]).write_text(
        json.dumps(tree, ensure_ascii=False, indent=2), encoding="utf-8"
    )


def load_trees() -> list[dict]:
    """Every live tree on disk. Survives a `--reload` of the API."""
    if not TREES_DIR.exists():
        return []
    trees = []
    for path in sorted(TREES_DIR.glob("*.json")):
        try:
            trees.append(json.loads(path.read_text(encoding="utf-8")))
        except (json.JSONDecodeError, OSError):
            continue  # a half-written tree must not take the whole API down
    return trees


# ------------------------------------------------------------------ build


def _now() -> str:
    return datetime.now(timezone.utc).isoformat(timespec="seconds")


def _spend(response: dict | None, client: Client) -> float:
    """What the call ACTUALLY cost, not what we guessed it would.

    `LIVE_COST_PER_REQUEST` is a flat per-request estimate and it understates a
    crawl: measured, a click-depth request reports 0.0026 against an estimate of
    0.00198, because the estimate does not carry the per-click surcharge. The
    response states its own cost, so use that.

    A cache hit bills nothing, whatever the stored response says it once cost.
    """
    if client.billable_calls == 0:
        return 0.0
    if response:
        reported = response.get("cost")
        if isinstance(reported, (int, float)):
            return round(float(reported), 6)
    return round(client.estimated_spend, 6)


def _carry_scores(fresh: dict, previous: dict | None) -> dict:
    """Carry gap scores across a re-crawl.

    Discovery and scoring are separate purchases. Rebuilding the tree from a new
    PAA response would otherwise reset every question to `no_data` and silently
    throw away scores the user has already paid for - one SERP request each.

    Only unscored nodes in the fresh tree are filled in, so the root (scored
    from the response that just arrived) keeps its new numbers, and a question
    that has disappeared from PAA simply drops out with its score.
    """
    if not previous:
        return fresh

    carried = {
        node["id"]: node
        for node in previous.get("nodes", [])
        if node.get("results_checked")
    }
    if not carried:
        return fresh

    fields = (
        "status",
        "matching_pages",
        "results_checked",
        "results",
        "ai_sources",
        "source_file",
        "updated_at",
    )
    for node in fresh["nodes"]:
        old = carried.get(node["id"])
        if old and not node["results_checked"]:
            for field in fields:
                node[field] = old[field]
    return _recount(fresh)


def _recount(tree: dict) -> dict:
    counts = {s: 0 for s in STATUSES}
    for node in tree["nodes"]:
        counts[node["status"]] += 1
    tree["status_counts"] = counts
    tree["node_count"] = len(tree["nodes"])
    return tree


def _blank_node(
    question: str, depth: int, parent: str | None, language_code: str
) -> dict:
    """An unscored node. Status is `no_data`, never `gap`.

    CLAUDE.md accuracy rule: a question with no fetched results is UNKNOWN, not
    a gap, and the interface must draw the difference.
    """
    return {
        "id": normalize(question, language_code),
        "slug": slugify(question),
        "question": question,
        "depth": depth,
        "parent_id": parent,
        "parents": [parent] if parent else [],
        "repeat_count": 1 if parent else 0,
        "status": STATUS_NO_DATA,
        "matching_pages": 0,
        "results_checked": 0,
        "results": [],
        "ai_sources": [],
        "source_file": None,
        "updated_at": None,
    }


def _dedupe_slugs(nodes: list[dict]) -> None:
    """Slugs are routing keys, and slugify() truncates at 60 characters.

    Two long questions sharing a prefix would otherwise collide and the detail
    page would quietly open the WRONG question. Same guard as `tree.build_tree`.
    """
    seen: dict[str, int] = {}
    for node in nodes:
        base = node["slug"] or "question"
        if base in seen:
            seen[base] += 1
            node["slug"] = f"{base}-{seen[base]}"
        else:
            seen[base] = 1


def build_from_response(
    response: dict, seed: str, location_code: int, language_code: str
) -> dict:
    """Assemble the tree from one click-depth SERP response."""
    lang = languages.get(language_code)
    nodes: dict[str, dict] = {}
    order: list[dict] = []

    def add(question: str, depth: int, parent: str | None) -> str | None:
        key = normalize(question, language_code)
        if not key:
            return None
        existing = nodes.get(key)
        if existing:
            # The same question under another parent. CLAUDE.md's repeat signal:
            # costs nothing extra and is the strongest fallback while search
            # volume is unavailable.
            if parent and parent not in existing["parents"]:
                existing["parents"].append(parent)
                existing["repeat_count"] = len(existing["parents"])
            return key
        node = _blank_node(question, depth, parent, language_code)
        nodes[key] = node
        order.append(node)
        return key

    # The root is the seed, and its organic results are already in this same
    # response - so the root scores for free.
    root_results = _organic_results(response)
    root_id = add(seed, 0, None)
    root = nodes[root_id]
    scored, matching, status = score_question(seed, root_results, language_code)
    root.update(
        {
            "status": status,
            "matching_pages": matching,
            "results_checked": len(root_results),
            "results": scored,
            "ai_sources": _ai_sources(response),
            "updated_at": _now(),
        }
    )

    elements = extract_paa(response)

    # Pass 1 - level 1. Google's original four, plus every question named as a
    # `seed_question`, because expanding the block reveals parents that were not
    # among the original four. Without this their children would be orphaned.
    for element in elements:
        title = (element.get("title") or "").strip()
        if title and not (element.get("seed_question") or "").strip():
            add(title, 1, root_id)
    for element in elements:
        parent_title = (element.get("seed_question") or "").strip()
        if parent_title:
            add(parent_title, 1, root_id)

    # Pass 2 - level 2, hung off the parent named by `seed_question`.
    for element in elements:
        title = (element.get("title") or "").strip()
        parent_title = (element.get("seed_question") or "").strip()
        if not title or not parent_title:
            continue
        parent_key = normalize(parent_title, language_code)
        if parent_key not in nodes:
            continue
        if normalize(title, language_code) == parent_key:
            continue  # cycle breaking: a question is not its own child
        add(title, 2, parent_key)

    node_list = sorted(order, key=lambda n: (n["depth"], n["question"]))
    _dedupe_slugs(node_list)

    tree = {
        "seed": seed,
        "slug": tree_slug(seed, location_code, language_code),
        "language_code": language_code,
        "language_name": lang.name,
        "location_code": location_code,
        "node_count": len(node_list),
        "status_counts": {},
        "threshold": THRESHOLD,
        "strategy": STRATEGY,
        "threshold_validated": False,  # the UI turns this into a warning badge
        "updated_at": _now(),
        "source": "live",
        "nodes": node_list,
    }
    return _recount(tree)


# ------------------------------------------------------------------ crawl


def crawl(
    seed: str,
    location_code: int,
    language_code: str,
    *,
    refresh: bool = False,
    dry_run: bool = False,
) -> dict:
    """Discover a question tree for `seed`. ONE billable request, or zero.

    `refresh` is CLAUDE.md's paid refresh: it drops the cached response so the
    next call re-fetches. Cached results are free; refreshing costs a credit.
    """
    seed = seed.strip()
    if not seed:
        raise ValueError("empty seed")

    key = cache_key(seed, location_code, language_code)
    if refresh:
        cached = SERP_DIR / f"{key}.json"
        if cached.exists():
            cached.unlink()

    client = _client(max_requests=1, dry_run=dry_run)
    response = client.serp(
        seed,
        location_code,
        language_code,
        cache_key=key,
        extra_params={"people_also_ask_click_depth": CLICK_DEPTH},
    )

    if response is None:
        # Dry run: nothing was fetched, so report the plan instead of a tree.
        return {
            "dry_run": True,
            "planned": client.planned,
            # Base request plus the click surcharge. Measured against a real
            # call this lands at 0.00258 versus a reported 0.0026 - close
            # enough to decide with, where the flat estimate alone was 24% low.
            "estimated_spend": round(
                LIVE_COST_PER_REQUEST + CLICK_DEPTH * CLICK_SURCHARGE, 6
            ),
        }

    tree = build_from_response(response, seed, location_code, language_code)

    # A re-crawl must not discard scores the user already bought.
    previous_path = _tree_path(tree["slug"])
    previous = None
    if previous_path.exists():
        try:
            previous = json.loads(previous_path.read_text(encoding="utf-8"))
        except (json.JSONDecodeError, OSError):
            previous = None
    tree = _carry_scores(tree, previous)

    tree["billable_calls"] = client.billable_calls
    tree["estimated_spend"] = _spend(response, client)
    tree["from_cache"] = client.cache_hits > 0
    save_tree(tree)
    return tree


# ------------------------------------------------------------------ score


def score(tree: dict, question_slug: str, *, refresh: bool = False) -> dict:
    """Gap-score ONE question. One billable request, or zero if cached.

    This is the expensive half and stays opt-in: CLAUDE.md prices discovery and
    gap analysis separately precisely because this call is per-question.
    """
    node = next((n for n in tree["nodes"] if n["slug"] == question_slug), None)
    if node is None:
        raise KeyError(question_slug)

    language_code = tree["language_code"]
    location_code = tree["location_code"]
    key = cache_key(node["question"], location_code, language_code)
    if refresh:
        cached = SERP_DIR / f"{key}.json"
        if cached.exists():
            cached.unlink()

    client = _client(max_requests=1, dry_run=False)
    response = client.serp(
        node["question"], location_code, language_code, cache_key=key
    )

    results = _organic_results(response)
    scored, matching, status = score_question(node["question"], results, language_code)
    node.update(
        {
            "status": status,
            "matching_pages": matching,
            "results_checked": len(results),
            "results": scored,
            "ai_sources": _ai_sources(response),
            "source_file": f"data/live/serp/{key}.json",
            "updated_at": _now(),
        }
    )

    _recount(tree)
    tree["updated_at"] = _now()
    tree["billable_calls"] = client.billable_calls
    tree["estimated_spend"] = _spend(response, client)
    save_tree(tree)
    return node
