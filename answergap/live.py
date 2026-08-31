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

GAP SCORING IS ALSO A DISCOVERY CALL - HARVEST IT
-------------------------------------------------
Separating discovery from scoring is right, but it was costing us the larger
half of every scoring request. Measured across the eleven `knight online`
responses already on disk: each one carries its own PAA block (4 questions) and
its own related searches (8 phrases) alongside the organic results we read.
Reading only `organic` threw away 27 unseen questions and 71 phrases that had
already been paid for - the tree was 14 nodes where the same money had bought
41.

So `score` now harvests what it fetched. The extra questions cost nothing: they
arrive in a response the user already bought.

The catch is drift, and it is not hypothetical. "knight online" is a game;
"knight" is a medieval soldier, and Google slides between the two. Harvesting
without a gate widens the tree with "Did any peasants become knights?". Every
harvested question is therefore scored against the seed by
`matching.seed_relevance` and has to clear `EXPANSION_FLOOR`.

The gate applies to the HARVEST ONLY, never to the seed response. Google's
answer to the seed itself is the primary data; filtering that would be
second-guessing the source and would shrink the very tree this is meant to
widen. Harvest is our own expansion decision, and drift compounds there.

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

from . import db, languages, paths
from .dataforseo import (
    LIVE_COST_PER_REQUEST,
    Client,
    extract_paa,
    load_dotenv,
    slugify,
    walk,
)
from .matching import seed_relevance
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

ROOT = paths.ROOT

# Kept apart from data/raw/ on purpose - see the module docstring. Relocatable
# via ANSWERGAP_DATA_DIR, because this is the directory a container redeploy
# would otherwise wipe - and it holds SERP responses that were paid for.
LIVE_DIR = paths.LIVE_DIR
SERP_DIR = LIVE_DIR / "serp"
TREES_DIR = LIVE_DIR / "trees"

# CLAUDE.md, measured: 4 questions without it, 15 with it, for $0.0006 extra.
CLICK_DEPTH = 4

# DataForSEO's per-click surcharge, used only to price a dry run. A real call
# reports its own cost and that is what gets recorded - see `_spend`.
CLICK_SURCHARGE = 0.00015

# How much of the seed a harvested question must still carry to enter the tree,
# measured along its whole path. CLAUDE.md's "expansion threshold" rule, given
# a number.
#
# 0.5 is deliberately generous, and the measurement in `matching.seed_relevance`
# says why: the lexical score separates the extremes and leaves a wide middle
# band it cannot split. A stricter floor would drop "Is there a free-to-play
# knight game available?" along with the drift. Until embeddings can tell those
# apart, keep the band and record each node's `relevance` so the interface can
# show what was a judgement call. Anything below the floor is dropped, and
# counted - a silently truncated crawl reads as complete coverage when it is not.
#
# The floor is applied to `reach`, not to `relevance`, and the first harvest run
# is what forced the distinction. Gating each question on its own score let
# drift COMPOUND: "Why did knights end?" scores 0.5 against "knight online", and
# so does every medieval-history question Google hangs under it, so the whole
# branch walked in - peasants, Vikings, the life expectancy of a knight.
#
# Drift accumulates along a path, so the score has to as well. `reach` is the
# product of a node's own relevance and its parent's reach, which reads exactly
# as CLAUDE.md states the rule: stop expanding NODES that have drifted, rather
# than judging each child alone.
#
# 0.25 is where the floor sits, and it was measured rather than picked. A
# two-word seed makes the lexical score coarse - a question shares both of the
# seed's words, one, or neither - so `reach` only ever lands on 1.0, 0.5, 0.25,
# 0.125 or 0. Every threshold between 0.125 and 0.25 behaves identically, and
# the two candidates split the harvest like this:

# floor  kept  cut   what the cut removes
# 0.50      8   25   the medieval branch AND the knight-game alternatives
# 0.25     14   19   the medieval branch only
#
# At 0.5 the gate also throws away "What is the best knight game?" and "Is there
# a knight game app?" - competitor questions, and exactly the kind of gap this
# product exists to find. At 0.25 those survive while "Did any peasants become
# knights?" and "What was the average life expectancy of a medieval knight?" do
# not. Read as a rule: two hops of half-drift is adjacency, three is a different
# subject.
EXPANSION_FLOOR = 0.25

# SERP surfaces that carry query phrases rather than questions. Not questions,
# so they are NOT nodes - they are the next seeds, and AlsoAsked shows nothing
# like them.
PHRASE_ITEM_TYPES = ("related_searches", "people_also_search_for")


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


def save_tree(tree: dict, *, new_crawl: bool = False) -> None:
    """Persist a tree, to Postgres when one is configured and to disk when not.

    `new_crawl` distinguishes a fresh search from a scoring pass. In the row
    backend it decides whether a new `crawl` row is opened; on disk it means
    nothing, because a file has no way to keep the previous version anyway -
    which is precisely the failure CLAUDE.md records for 2026-08-27.
    """
    if db.available():
        db.save_tree(tree, new_crawl=new_crawl)
        return
    TREES_DIR.mkdir(parents=True, exist_ok=True)
    _tree_path(tree["slug"]).write_text(
        json.dumps(tree, ensure_ascii=False, indent=2), encoding="utf-8"
    )


def _hydrate(tree: dict | None) -> dict | None:
    """Put back everything that is derived rather than stored.

    None of these belong in a column. Slugs are a function of the question text,
    the status counts are a function of the nodes, and the threshold, strategy
    and language name are properties of the code that is reading - not of the
    crawl that was written. Persisting any of them would mean keeping a copy in
    sync with its source, which is the same class of mistake as storing the tree
    as a document.

    Note what `threshold` here does NOT do: it does not reinterpret old scores.
    Each `gap_score` row carries the threshold it was measured under, so this
    value describes the current setting, not the ones already recorded.

    `_dedupe_slugs` has to run over the whole tree at once: a slug is only
    unique relative to the others, and slugify() truncates at 60 characters, so
    two long questions sharing a prefix would otherwise route to each other.
    """
    if tree is None:
        return None
    _dedupe_slugs(tree["nodes"])
    lang = languages.get(tree["language_code"])
    tree["language_name"] = lang.name if lang else tree["language_code"]
    tree["threshold"] = THRESHOLD
    tree["strategy"] = STRATEGY
    tree["threshold_validated"] = False  # the UI turns this into a warning badge
    _recount(tree)
    return tree


def load_tree(slug: str) -> dict | None:
    """One live tree by slug."""
    if db.available():
        return _hydrate(db.load_tree(slug, slugify))
    path = _tree_path(slug)
    if not path.exists():
        return None
    try:
        return json.loads(path.read_text(encoding="utf-8"))
    except (json.JSONDecodeError, OSError):
        return None


def load_trees() -> list[dict]:
    """Every live tree. Survives a restart, and now a redeploy."""
    if db.available():
        return [_hydrate(t) for t in db.load_trees(slugify)]
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


def _carry_previous(fresh: dict, previous: dict | None) -> dict:
    """Carry everything a re-crawl would otherwise destroy.

    `build_from_response` rebuilds the tree from the seed response alone, so on
    its own a re-crawl resets every question to `no_data` and deletes every
    node the seed response does not happen to repeat. Both are things the user
    has already paid for, one SERP request each. This is the exact failure
    CLAUDE.md records for 2026-08-27, and it is a symptom of storing the tree as
    a document; the storage migration to edge rows is the actual cure.

    Three things survive:

    1. Gap scores, onto fresh nodes that are still unscored - so the root, just
       scored from the response that arrived, keeps its NEW numbers.
    2. Harvested nodes. They came out of scoring responses, not the seed
       response, so nothing in a re-crawl can rediscover them. Carried
       parents-first, and only where the parent still exists; a child of a
       question that has dropped out of PAA would be an orphan.
    3. Related searches, which accumulate across every response ever fetched
       for this tree.
    """
    if not previous:
        return fresh

    carried = {
        node["id"]: node
        for node in previous.get("nodes", [])
        if node.get("results_checked")
    }
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

    known = {node["id"] for node in fresh["nodes"]}
    taken = {node["slug"] for node in fresh["nodes"]}
    harvested = [
        node
        for node in previous.get("nodes", [])
        if node.get("discovered_by") == "harvest"
    ]
    for node in sorted(harvested, key=lambda n: n["depth"]):
        if node["id"] in known or node["parent_id"] not in known:
            continue
        node = dict(node)
        node["slug"] = _unique_slug(slugify(node["question"]), taken)
        fresh["nodes"].append(node)
        known.add(node["id"])
    fresh["nodes"].sort(key=lambda n: (n["depth"], n["question"]))

    _merge_related(fresh, previous.get("related_searches", []))
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
        # How much of the seed this question still carries. Recorded on every
        # node, enforced only on harvested ones - see the module docstring.
        #
        # `relevance` is this question against the seed alone; `reach` is the
        # same measure carried along the whole path from the root, and it is
        # `reach` that the expansion floor tests. See EXPANSION_FLOOR.
        "relevance": None,
        "reach": None,
        # "paa" - Google's answer to the seed. "harvest" - pulled out of a
        # response bought for gap scoring.
        "discovered_by": "paa",
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


def _unique_slug(base: str, taken: set[str]) -> str:
    """A routing key that is free, given the ones already handed out.

    Counts up until the slug is genuinely unused rather than appending the
    occurrence number: with nodes arriving after the tree was built, a plain
    counter can hand out `foo-2` when some earlier node already holds it.
    """
    slug = base or "question"
    n = 1
    while slug in taken:
        n += 1
        slug = f"{base or 'question'}-{n}"
    taken.add(slug)
    return slug


def _dedupe_slugs(nodes: list[dict]) -> None:
    """Slugs are routing keys, and slugify() truncates at 60 characters.

    Two long questions sharing a prefix would otherwise collide and the detail
    page would quietly open the WRONG question. Same guard as `tree.build_tree`.
    """
    taken: set[str] = set()
    for node in nodes:
        node["slug"] = _unique_slug(node["slug"], taken)


def _paa_titles(response: dict | None) -> list[str]:
    """Every question in a response's PAA block, in order."""
    if not response:
        return []
    titles = []
    for element in extract_paa(response):
        title = (element.get("title") or "").strip()
        if title:
            titles.append(title)
    return titles


def _related_searches(response: dict | None) -> list[str]:
    """Query phrases Google hangs off the same page.

    Measured: 8 per response, and they are not duplicates of the PAA block -
    "Knight Online private server", "Knight Online player count". They are not
    questions, so they must never become nodes; they are candidate SEEDS, and
    they arrive free with a response bought for something else.
    """
    if not response:
        return []
    found: list[str] = []
    for item in walk(response.get("tasks")):
        if item.get("type") not in PHRASE_ITEM_TYPES:
            continue
        for entry in item.get("items") or []:
            phrase = entry if isinstance(entry, str) else (entry.get("title") or "")
            phrase = phrase.strip()
            if phrase:
                found.append(phrase)
    return found


def _merge_related(tree: dict, phrases: list[str]) -> int:
    """Fold new phrases into the tree, deduped on the normalized form."""
    language_code = tree["language_code"]
    current = tree.setdefault("related_searches", [])
    seen = {normalize(p, language_code) for p in current}
    added = 0
    for phrase in phrases:
        key = normalize(phrase, language_code)
        if not key or key in seen:
            continue
        seen.add(key)
        current.append(phrase)
        added += 1
    current.sort(key=str.casefold)
    return added


def _reach(node: dict) -> float:
    """A node's path-decayed relevance, defaulting to fully on topic.

    The default matters for trees built before `reach` existed: an absent value
    must not silently gate their harvest down to nothing.
    """
    value = node.get("reach")
    return 1.0 if value is None else float(value)


def _ancestors(node: dict, by_id: dict[str, dict]) -> set[str]:
    """Every id on the path from `node` up to the root."""
    found: set[str] = set()
    current = node.get("parent_id")
    while current and current not in found:
        found.add(current)
        parent = by_id.get(current)
        current = parent.get("parent_id") if parent else None
    return found


def _attach_harvest(tree: dict, parent: dict, questions: list[str]) -> dict:
    """Hang questions from an already-paid response underneath `parent`.

    Returns what was added and what the relevance gate dropped. The dropped
    list is not diagnostics - CLAUDE.md's rule is that a crawl which bounds its
    own coverage has to say so, or it reads as complete when it is not.
    """
    language_code = tree["language_code"]
    seed = tree["seed"]
    by_id = {n["id"]: n for n in tree["nodes"]}
    taken = {n["slug"] for n in tree["nodes"]}

    # Cycle breaking (CLAUDE.md: an A->B->A loop burns money). A question may
    # not be hung under itself or under any of its own descendants' parents.
    blocked = _ancestors(parent, by_id) | {parent["id"]}

    added: list[dict] = []
    dropped: list[dict] = []

    for question in questions:
        key = normalize(question, language_code)
        if not key or key in blocked:
            continue
        relevance = round(seed_relevance(seed, question, language_code), 3)
        reach = round(relevance * _reach(parent), 3)

        existing = by_id.get(key)
        if existing:
            # Already in the tree under another parent. CLAUDE.md's repeat
            # signal: the strongest fallback while search volume is missing,
            # and harvesting is what finally makes it move.
            if parent["id"] not in existing["parents"]:
                existing["parents"].append(parent["id"])
                existing["repeat_count"] = len(existing["parents"])
            continue

        if reach < EXPANSION_FLOOR:
            dropped.append(
                {"question": question, "relevance": relevance, "reach": reach}
            )
            continue

        node = _blank_node(question, parent["depth"] + 1, parent["id"], language_code)
        node["relevance"] = relevance
        node["reach"] = reach
        node["discovered_by"] = "harvest"
        node["slug"] = _unique_slug(slugify(question), taken)
        by_id[key] = node
        tree["nodes"].append(node)
        added.append(node)

    if added:
        # Existing slugs are routing keys the interface may already be showing,
        # so they are left alone; only the new nodes were given free ones above.
        tree["nodes"].sort(key=lambda n: (n["depth"], n["question"]))
    return {"added": added, "dropped": dropped}


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
        # Recorded for every node, enforced only on harvested ones. Google's
        # answer to the seed is the primary data and is not second-guessed.
        node["relevance"] = (
            1.0
            if depth == 0
            else round(seed_relevance(seed, question, language_code), 3)
        )
        parent_node = nodes.get(parent) if parent else None
        node["reach"] = round(
            node["relevance"] * (_reach(parent_node) if parent_node else 1.0), 3
        )
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
        # Free with this response and shown as its own surface - see
        # `_related_searches`.
        "related_searches": [],
        "nodes": node_list,
    }
    _merge_related(tree, _related_searches(response))
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

    # A re-crawl must not discard what the user already bought. On the row
    # backend the old data is not at risk - the previous crawl keeps its own
    # rows - so this carry has shrunk from preventing data LOSS to preserving
    # the current VIEW: harvested nodes live under the crawl that discovered
    # them, and a fresh crawl built from the seed response alone would not show
    # them again. Gap scores need no carry at all now; they are keyed by
    # question and market, so they are simply found.
    previous = load_tree(tree["slug"])
    tree = _carry_previous(tree, previous)

    tree["billable_calls"] = client.billable_calls
    tree["estimated_spend"] = _spend(response, client)
    tree["from_cache"] = client.cache_hits > 0
    save_tree(tree, new_crawl=True)
    return tree


# ------------------------------------------------------------------ score


def score(tree: dict, question_slug: str, *, refresh: bool = False) -> dict:
    """Gap-score ONE question, and harvest the rest of the response.

    This is the expensive half and stays opt-in: CLAUDE.md prices discovery and
    gap analysis separately precisely because this call is per-question.

    The price does not change, but the yield does. The response bought for the
    organic results also carries a PAA block and a set of related searches, and
    reading only the organic results discarded them - measured at 27 unseen
    questions and 71 phrases across eleven `knight online` responses. Both are
    now folded into the tree, questions through the relevance gate.

    Returns the scored node plus what the harvest found and what it dropped.
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
    ai_sources = _ai_sources(response)
    node.update(
        {
            "status": status,
            "matching_pages": matching,
            "results_checked": len(results),
            "results": scored,
            "ai_sources": ai_sources,
            # Where this score can be traced back to. On the row backend the
            # response is a `serp_snapshot`, addressed by the same cache key the
            # filesystem used as a filename.
            "source_file": key if db.available() else f"data/live/serp/{key}.json",
            "updated_at": _now(),
        }
    )

    # The score is its own row, keyed by question and market rather than by
    # tree. That is what makes a re-crawl unable to lose it - and what lets the
    # same verdict show up under every tree the question appears in, which is
    # already how CLAUDE.md keys the label log.
    if db.available():
        db.save_score(
            normalized=node["id"],
            question=node["question"],
            language_code=tree["language_code"],
            location_code=tree["location_code"],
            status=status,
            matching_pages=matching,
            results_checked=len(results),
            results=scored,
            ai_sources=ai_sources,
            threshold=THRESHOLD,
            strategy=STRATEGY,
            source_key=key,
        )

    # The same response, mined for everything else it carries. Free: it is
    # already bought and, on a cache hit, already on disk.
    harvest = _attach_harvest(tree, node, _paa_titles(response))
    related_added = _merge_related(tree, _related_searches(response))

    _recount(tree)
    tree["updated_at"] = _now()
    tree["billable_calls"] = client.billable_calls
    tree["estimated_spend"] = _spend(response, client)
    save_tree(tree)
    return {
        "node": node,
        "discovered": harvest["added"],
        "dropped": harvest["dropped"],
        "related_searches_added": related_added,
    }
