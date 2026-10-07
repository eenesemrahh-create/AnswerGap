"""Live crawl: turn a seed keyword into a real question tree, on demand.

WHY ONE REQUEST IS ENOUGH
-------------------------
CLAUDE.md's measured rule is "fill click depth before recursing": with
`people_also_ask_click_depth=4` a single request returns ~15 questions instead
of 4, and collecting those same 15 by recursion would cost four requests.

What makes the single request a *tree* rather than a flat list is the
`seed_question` field on each PAA element: it names the question that was
clicked to reveal this one, which is a genuine parent pointer.

AND `click_depth=4` IS FOUR SUCCESSIVE CLICKS, so one request is a CHAIN of
real depth 5 - not two levels. Re-measured 2026-09-22 on `probe-A-click4.json`
and `probe-C-both.json`, identically: four originals, one clicked to reveal 2,
one of those clicked to reveal 3, and so on four times - {1:4, 2:2, 3:3, 4:3,
5:3}.

The earlier reading of the same file said two levels, and promoted every named
parent to level 1 - flattening that shape into {1:7, 2:8}, seven questions drawn
as direct children of the seed when only four are. The "wrinkle" it recorded,
that three named parents were not among the original four because Google
reflows the block, was the same mistake: those three are the interior of the
chain. `build_from_response` therefore resolves parents TRANSITIVELY.

The orphan rule survives, corrected: a `seed_question` naming a question that is
no element's own title is still added, but under its real parent, and only at
level 1 when there is nothing else to hang it from.

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

LIVE FOR THE SEARCH BOX, STANDARD FOR THE BATCH
-----------------------------------------------
CLAUDE.md mandates the Standard queue for product code - it is ~3.3x cheaper -
and recorded the deviation honestly: Standard is async, results arrive in
minutes, and "a webhook cannot reach a laptop". That was a fact about the
laptop, and it expired the day this moved onto a server.

What remains is a split rather than a compromise:

  seed search   Live       one request, and a PERSON IS WAITING for it. Minutes
                           of latency to save a tenth of a cent is the wrong
                           trade - CLAUDE.md's own reasoning, unchanged.
  batch scoring Standard   nobody watches a batch. Ten questions is where 3.3x
                           stops being a rounding error: $0.020 becomes $0.006.

The money is spent at task_post, not at fetch, so a queued task is paid for
whether or not the result ever reaches us. That is why `serp_task` rows are
written before anything else can fail, and why `sweep_pending` exists at all -
results stay retrievable for 30 days, which makes a lost callback a re-fetch
instead of a re-purchase, but only if the id was recorded.

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

from . import db, embeddings, languages, paths
from .dataforseo import (
    LIVE_COST_PER_REQUEST,
    STANDARD_COST_PER_REQUEST,
    Client,
    extract_paa,
    load_dotenv,
    slugify,
    walk,
)
from .matching import active_strategy, seed_relevance
from .text import normalize
from .tree import (
    STATUS_NO_DATA,
    THRESHOLD,
    ai_overview,
    count_questions,
    count_statuses,
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
# The floor is deliberately generous - see the number it settled on below - and
# the measurement in `matching.seed_relevance`
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


def save_tree(
    tree: dict,
    *,
    new_crawl: bool = False,
    add_spend: float = 0.0,
    add_calls: int = 0,
    user_id: int | None = None,
    anon_id: str | None = None,
) -> None:
    """Persist a tree, to Postgres when one is configured and to disk when not.

    `new_crawl` distinguishes a fresh search from a scoring pass. In the row
    backend it decides whether a new `crawl` row is opened; on disk it means
    nothing, because a file has no way to keep the previous version anyway -
    which is precisely the failure CLAUDE.md records for 2026-08-27.
    """
    if db.available():
        db.save_tree(
            tree,
            new_crawl=new_crawl,
            add_spend=add_spend,
            add_calls=add_calls,
            user_id=user_id,
            anon_id=anon_id,
        )
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
    # The CURRENT default, not what any particular score was measured under.
    # Per-row authority stays on `gap_score.strategy` / `embedding_model`; this
    # is the badge the UI shows for "what would a new score use right now".
    tree["strategy"] = active_strategy()
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


def load_trees(user_id: int | None = None) -> list[dict]:
    """This person's live trees. Survives a restart, and now a redeploy.

    Private by slug ownership - see `db.load_trees`. The filesystem backend
    below cannot express ownership (a file has no owner column), so it returns
    everything; that is local development, where there is one person.
    """
    if db.available():
        return [_hydrate(t) for t in db.load_trees(slugify, user_id=user_id)]
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


def _invalidate(key: str) -> None:
    """Make `refresh` actually refresh, in BOTH cache backends.

    `Client._cached` reads Postgres first whenever `db.available()` and returns
    without ever consulting the filesystem. Deleting only the file therefore did
    nothing on the deployed service: the snapshot came back, `billable_calls`
    stayed 0, and the caller was handed the old answer as a fresh one.

    Both are cleared, unconditionally and in that order, because which backend
    is live is not this function's business - and a stale row left behind in the
    one that happens to be inactive today is a trap for the day it is not.
    """
    if db.available():
        try:
            db.snapshot_delete(key)
        except Exception:  # noqa: BLE001 - a failed purge must not kill the crawl
            pass
    cached = SERP_DIR / f"{key}.json"
    if cached.exists():
        cached.unlink()


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
        "ai_state",
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
    by_id = {node["id"]: node for node in fresh["nodes"]}
    # Old depth order, which is still ancestor-first: a carried parent always
    # sat shallower than its carried child, whatever the new numbers turn out
    # to be. That is what lets the depth below be read off a parent already
    # placed.
    for node in sorted(harvested, key=lambda n: n["depth"]):
        if node["id"] in known or node["parent_id"] not in known:
            continue
        node = dict(node)
        # RE-DEPTHED AGAINST THE FRESH PARENT, never carried verbatim. The
        # correction that made `build_from_response` walk the click-depth chain
        # moved questions from level 2 to level 4 or 5, and a node carried with
        # its stored depth would come back SHALLOWER THAN ITS OWN PARENT. Reach
        # travels with it for the same reason: it is a product down the path,
        # so a path that got longer has to be re-multiplied.
        parent = by_id[node["parent_id"]]
        node["depth"] = parent["depth"] + 1
        node["reach"] = round((node.get("relevance") or 0.0) * _reach(parent), 3)
        node["slug"] = _unique_slug(slugify(node["question"]), taken)
        fresh["nodes"].append(node)
        by_id[node["id"]] = node
        known.add(node["id"])
    fresh["nodes"].sort(key=lambda n: (n["depth"], n["question"]))

    _merge_related(fresh, previous.get("related_searches", []))
    return _recount(fresh)


def _recount(tree: dict) -> dict:
    # `count_statuses` skips the seed - see its docstring. Shared with the
    # archive builder so a live tree and an archived one cannot disagree about
    # what counts as a question.
    tree["status_counts"] = count_statuses(tree["nodes"])
    tree["node_count"] = len(tree["nodes"])
    tree["question_count"] = count_questions(tree["nodes"])
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
        "ai_state": None,
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


def _paa_chain(response: dict | None, language_code: str) -> list[tuple[str, str | None]]:
    """The PAA block as parent/child pairs. See `_chain`."""
    if not response:
        return []
    return _chain(extract_paa(response), language_code)


def _chain(elements: list[dict], language_code: str) -> list[tuple[str, str | None]]:
    """Order PAA elements parent-before-child, each paired with its real parent.

    A `click_depth` response is a CHAIN, not a flat list. `seed_question` names
    the question that was clicked to reveal this one, so it is a parent pointer
    and it has to be walked TRANSITIVELY - flattening it is precisely the bug
    taken out of `build_from_response` on 2026-09-22, and harvesting a
    click-depth response through the old flat path would have reintroduced it
    under a different function's name. This is that walk, extracted so both
    callers run the same one.

    Returns `(question, parent_question)`, parents always emitted before their
    children, `None` meaning "hang this at the top of whatever it is being
    attached to". An ordinary scoring response carries no `seed_question` at
    all and comes back as every question with parent `None` - which is exactly
    the flat harvest this already was, so the generalisation costs the existing
    path nothing.
    """
    named: dict[str, str] = {}
    titles: list[str] = []
    for element in elements:
        title = (element.get("title") or "").strip()
        if not title:
            continue
        titles.append(title)
        key = normalize(title, language_code)
        parent_title = (element.get("seed_question") or "").strip()
        if key and parent_title:
            named.setdefault(key, parent_title)

    out: list[tuple[str, str | None]] = []
    placed: set[str] = set()
    # Guards the upward walk: a chain pointing back at itself would otherwise be
    # followed forever. CLAUDE.md's A->B->A rule, applied to parent pointers.
    walking: set[str] = set()

    def emit(question: str) -> str | None:
        key = normalize(question, language_code)
        if not key:
            return None
        if key in placed:
            return key
        parent_title = named.get(key)
        parent_key = normalize(parent_title, language_code) if parent_title else ""
        parent: str | None = None
        # No parent named, self-parenting, or a cycle: all three mean "top
        # level". The middle two collapse into CLAUDE.md's orphan rule, which
        # keeps a question that is only ever CITED as a parent rather than
        # dropping it and stranding its children.
        if parent_key and parent_key != key and key not in walking:
            walking.add(key)
            try:
                resolved = emit(parent_title)
            finally:
                walking.discard(key)
            if resolved and resolved != key:
                parent = parent_title
        # The walk above may have emitted THIS question already: a cycle
        # terminates by placing whichever question it re-entered, and the outer
        # frame is still holding it. Without this it is emitted twice, and the
        # second copy names the cycle as its parent.
        if key in placed:
            return key
        placed.add(key)
        out.append((question, parent))
        return key

    # Google's originals first, so the questions that actually head the block
    # own the top level before any interior one can be walked into it.
    for title in titles:
        if normalize(title, language_code) not in named:
            emit(title)
    for title in titles:
        emit(title)
    return out


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


def _attach_harvest(
    tree: dict, parent: dict, questions: list[tuple[str, str | None]]
) -> dict:
    """Hang questions from an already-paid response underneath `parent`.

    `questions` comes from `_chain`: each one paired with the question that was
    clicked to reveal it, or `None` for the ones Google showed at the top of the
    block. An ordinary scoring response names no parents at all and every
    question hangs directly off `parent`, which is what this always did. A deep
    expansion names them, and the chain is rebuilt under `parent` instead of
    being flattened onto it.

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

    for question, parent_title in questions:
        key = normalize(question, language_code)
        if not key or key in blocked:
            continue

        # Whoever this hangs from, which is `parent` unless the response named
        # somebody nearer. A named parent the gate dropped, or one that landed
        # outside this tree, falls back to `parent` rather than taking its
        # children down with it - the orphan rule again.
        parent_key = normalize(parent_title, language_code) if parent_title else ""
        host = by_id.get(parent_key) if parent_key else None
        if host is None or (host["id"] in blocked and host["id"] != parent["id"]):
            host = parent

        relevance = round(seed_relevance(seed, question, language_code), 3)
        reach = round(relevance * _reach(host), 3)

        existing = by_id.get(key)
        if existing:
            # Already in the tree under another parent. CLAUDE.md's repeat
            # signal: the strongest fallback while search volume is missing,
            # and harvesting is what finally makes it move.
            if host["id"] not in existing["parents"]:
                existing["parents"].append(host["id"])
                existing["repeat_count"] = len(existing["parents"])
            continue

        if reach < EXPANSION_FLOOR:
            dropped.append(
                {"question": question, "relevance": relevance, "reach": reach}
            )
            continue

        node = _blank_node(question, host["depth"] + 1, host["id"], language_code)
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
    # response - so the root scores for free. Same strategy as `apply_response`
    # uses for the per-question path: otherwise the root would be lexical while
    # scored children were embeddings, and the same node's status would depend
    # on which route last touched it.
    root_results = _organic_results(response)
    root_ai = ai_overview(response)
    root_id = add(seed, 0, None)
    root = nodes[root_id]
    scored, matching, status = score_question(
        seed, root_results, language_code, strategy=active_strategy()
    )
    root.update(
        {
            "status": status,
            "matching_pages": matching,
            "results_checked": len(root_results),
            "results": scored,
            "ai_sources": root_ai[0],
            "ai_state": root_ai[1],
            "updated_at": _now(),
        }
    )

    elements = extract_paa(response)

    # `click_depth=4` IS FOUR SUCCESSIVE CLICKS, NOT TWO LEVELS. Measured on
    # `data/raw/probe-A-click4.json` and `probe-C-both.json`, identically: the
    # 15 elements form a CHAIN. Four originals; one of them is clicked and
    # reveals two more; one of THOSE is clicked and reveals three; and so on
    # four times, to a real depth of 5.
    #
    #   {1: 4, 2: 2, 3: 3, 4: 3, 5: 3}
    #
    # The walk that recovers that shape is `_chain`, shared with the harvest so
    # a question discovered by deep search lands in the same place it would
    # have if Google had returned it in the seed response.
    for question, parent_title in _chain(elements, language_code):
        parent_key = normalize(parent_title, language_code) if parent_title else ""
        # `_chain` emits parents first, so this lookup cannot miss.
        parent_node = nodes.get(parent_key) if parent_key else None
        if parent_node is None:
            add(question, 1, root_id)
        else:
            add(question, parent_node["depth"] + 1, parent_node["id"])

    node_list = sorted(order, key=lambda n: (n["depth"], n["question"]))
    _dedupe_slugs(node_list)

    tree = {
        "seed": seed,
        "slug": tree_slug(seed, location_code, language_code),
        "language_code": language_code,
        "language_name": lang.name,
        "location_code": location_code,
        "node_count": len(node_list),
        "question_count": count_questions(node_list),
        "status_counts": {},
        "threshold": THRESHOLD,
        "strategy": active_strategy(),
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
    user_id: int | None = None,
    anon_id: str | None = None,
) -> dict:
    """Discover a question tree for `seed`. ONE billable request, or zero.

    `refresh` is CLAUDE.md's paid refresh: it drops the cached response so the
    next call re-fetches. Cached results are free; refreshing costs a credit.

    `user_id` and `anon_id` are ownership - see `db.save_tree`. One of them is
    typically set (the signed-in id for a logged-in caller, the browser
    cookie for a signed-out one); both being None means an unattributed
    crawl, which the detail-level privacy gate will refuse to serve back.
    """
    seed = seed.strip()
    if not seed:
        raise ValueError("empty seed")

    key = cache_key(seed, location_code, language_code)
    if refresh:
        _invalidate(key)

    client = _client(max_requests=1, dry_run=dry_run)
    params = {"people_also_ask_click_depth": CLICK_DEPTH}
    response = client.serp(
        seed, location_code, language_code, cache_key=key, extra_params=params
    )
    # The same cache key also holds what the single-question score path
    # bought, which asked for no clicks. Built from that, a search for a
    # question that was once scored would come back as 4 questions instead of
    # 15 - and since "check this question" IS a search for a question, that
    # would be the common case rather than an edge one. Such a response is a
    # miss: fetched again, and paid for.
    if response is not None and not _has_click_depth(response):
        _invalidate(key)
        response = client.serp(
            seed, location_code, language_code, cache_key=key, extra_params=params
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
    # Not `cache_hits > 0`: a stale hit that was then re-bought is not a
    # result from the cache.
    tree["from_cache"] = client.billable_calls == 0
    # OWNERSHIP, not attribution - "list this user's searches" and "let them
    # back into their own tree by slug". Set here, on the insert, and never on
    # the scoring path: live.score updates an EXISTING crawl row, so writing
    # an owner there would let user B's score rewrite whose search it was.
    # Who spent which dollar is `usage_event`'s job.
    save_tree(tree, new_crawl=True, user_id=user_id, anon_id=anon_id)

    # The seed's score, which `build_from_response` computed for free from the
    # organic results of this same response, written where every tree reads
    # scores from. It was never persisted before: `save_tree` stores edges, not
    # scores, so the seed lost its colour on the next load and no other tree
    # holding the same question could see it. Now a question checked by
    # searching it shows its verdict in the tree it came from too.
    root = next((n for n in tree["nodes"] if n.get("depth") == 0), None)
    if root is not None and root.get("results_checked"):
        _persist_score(tree, root, key, tree["strategy"])
    return tree


def _has_click_depth(response: dict) -> bool:
    """Whether this response was bought with `people_also_ask_click_depth`.

    DataForSEO echoes the request's parameters back under `tasks[0].data`. A
    response without that block cannot say, and is trusted rather than
    re-bought - only a positive "asked for no clicks" makes it a miss.
    """
    tasks = response.get("tasks") or []
    data = (tasks[0] or {}).get("data") if tasks else None
    if not isinstance(data, dict):
        return True
    return bool(data.get("people_also_ask_click_depth"))


# ------------------------------------------------------------------ check

#: What a score consists of, as it sits on a node.
_SCORE_FIELDS = (
    "status",
    "matching_pages",
    "results_checked",
    "results",
    "ai_sources",
    "ai_state",
    "updated_at",
)


def check_question(
    tree: dict,
    question_slug: str,
    *,
    user_id: int | None = None,
    anon_id: str | None = None,
) -> dict:
    """"Check this question": search it as a seed of its own.

    ONE request does both jobs. Its organic results are the question's gap
    score, and its PAA block is the question's own tree. The new tree is a
    search like any other - owned by the caller, listed with their searches,
    priced at one credit.

    The verdict lands on the question in the tree it was clicked from as
    well. With a database that is automatic: scores are keyed by question and
    market, not by tree, so `crawl` writing the seed's score is enough. The
    fields are copied onto the old node anyway, so the caller can redraw it
    without a refetch, and on disk - where nothing joins scores across trees -
    the old tree is saved with them.
    """
    node = next((n for n in tree["nodes"] if n["slug"] == question_slug), None)
    if node is None:
        raise KeyError(question_slug)

    fresh = crawl(
        node["question"],
        tree["location_code"],
        tree["language_code"],
        user_id=user_id,
        anon_id=anon_id,
    )
    root = next((n for n in fresh["nodes"] if n.get("depth") == 0), None)
    if root is not None and root.get("results_checked"):
        node.update({field: root.get(field) for field in _SCORE_FIELDS})
        _recount(tree)
        if not db.available():
            save_tree(tree)
    return {
        "slug": fresh["slug"],
        "node": node,
        "billable_calls": fresh.get("billable_calls", 0),
        "estimated_spend": fresh.get("estimated_spend", 0.0),
        "from_cache": fresh.get("from_cache", False),
    }


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
        _invalidate(key)

    client = _client(max_requests=1, dry_run=False)
    response = client.serp(
        node["question"], location_code, language_code, cache_key=key
    )

    result = apply_response(tree, node, response, key)
    spent = _spend(response, client)
    tree["billable_calls"] = client.billable_calls
    tree["estimated_spend"] = spent
    # Added to the crawl's running total, not written over it. A cache hit
    # spends nothing and therefore adds nothing.
    save_tree(tree, add_spend=spent, add_calls=client.billable_calls)
    # Reported, not inferred. The caller has to charge a credit for this request
    # and it must charge for what was ACTUALLY bought - a cache hit bills
    # nothing. Reading `tree["estimated_spend"]` afterwards would work but would
    # be reading a side effect, and the tree is shared mutable state.
    result["spent"] = spent
    result["billable_calls"] = client.billable_calls
    return result


def apply_response(tree: dict, node: dict, response: dict | None, key: str) -> dict:
    """Turn one SERP response into a scored node, and mine the rest of it.

    Shared by both routes into scoring: the Live call behind "check this
    question", and a Standard-queue task arriving by postback minutes later.
    They differ only in how the response was obtained and what it cost - what it
    MEANS has to be identical, or a batch-scored question and a click-scored one
    would disagree about the same page.

    The caller is responsible for persisting the tree afterwards. Batch ingest
    applies several responses to one tree and saving once is both cheaper and
    the only way the harvest counts come out right.
    """
    language_code = tree["language_code"]
    results = _organic_results(response)
    # Resolved HERE, not read from a module constant, so a `VOYAGE_API_KEY`
    # added mid-run picks up on the next scored question rather than at the
    # next process boot. `active_strategy()` returns "embeddings" when Voyage
    # is configured and the lexical baseline otherwise; either way the value
    # that was in effect travels to `save_score` below, so a later swap cannot
    # silently rewrite what this row claimed.
    strategy = active_strategy()
    scored, matching, status = score_question(
        node["question"], results, language_code, strategy=strategy
    )
    ai_sources, ai_state = ai_overview(response)
    node.update(
        {
            "status": status,
            "matching_pages": matching,
            "results_checked": len(results),
            "results": scored,
            "ai_sources": ai_sources,
            "ai_state": ai_state,
            # Where this score can be traced back to. On the row backend the
            # response is a `serp_snapshot`, addressed by the same cache key the
            # filesystem used as a filename.
            "source_file": key if db.available() else f"data/live/serp/{key}.json",
            "updated_at": _now(),
        }
    )

    _persist_score(tree, node, key, strategy)

    # The same response, mined for everything else it carries. Free: it is
    # already bought and, on a cache hit, already stored.
    harvest = _attach_harvest(tree, node, _paa_chain(response, language_code))
    related_added = _merge_related(tree, _related_searches(response))

    _recount(tree)
    tree["updated_at"] = _now()
    return {
        "node": node,
        "discovered": harvest["added"],
        "dropped": harvest["dropped"],
        "related_searches_added": related_added,
    }


def _persist_score(tree: dict, node: dict, key: str, strategy: str) -> None:
    """Write a node's score as its own row.

    Keyed by question and market rather than by tree. That is what makes a
    re-crawl unable to lose it - and what lets the same verdict show up under
    every tree the question appears in, which is already how CLAUDE.md keys the
    label log. Shared by `apply_response` and by `crawl` for the seed, so the
    two cannot disagree about what a score row holds.
    """
    if not db.available():
        return
    db.save_score(
        normalized=node["id"],
        question=node["question"],
        language_code=tree["language_code"],
        location_code=tree["location_code"],
        status=node["status"],
        matching_pages=node["matching_pages"],
        results_checked=node["results_checked"],
        results=node["results"],
        ai_sources=node.get("ai_sources"),
        ai_state=node.get("ai_state"),
        threshold=THRESHOLD,
        strategy=strategy,
        # Only meaningful under the embeddings strategy - a lexical row has
        # no model to record, and NULL is how the schema says so. Reading
        # this back later distinguishes "scored under lexical" from
        # "scored under an embedding model we no longer trust" without
        # having to guess from the strategy name.
        embedding_model=embeddings.model() if strategy == "embeddings" else None,
        source_key=key,
    )


# ------------------------------------------------------- batch scoring
#
# Scoring one question at a time is correct and it is also nineteen clicks. The
# batch route exists because CLAUDE.md's credit model already describes it -
# discovery is one credit, gap analysis is priced separately - and because a
# batch is the case where the Standard queue's 3.3x is real money rather than a
# rounding error.
#
# Nothing here changes what a score MEANS. `apply_response` is shared with the
# Live path, so a question scored in a batch and the same question scored by
# clicking it produce the same row.


def scoring_candidates(
    tree: dict, limit: int | None = None, *, include_scored: bool = False
) -> list[dict]:
    """Which questions are worth spending on first.

    CLAUDE.md's ranking signals, in the order it gives them: repeat count is
    the strongest fallback when search volume is missing, shallow nodes are
    more central, and reach is how much of the seed a node still carries. This
    is also the rule "collect ~70 questions to show 10, then cut from the top" -
    the cut has to be made on something, and these are the three signals that
    cost nothing to compute.
    """
    nodes = [
        n
        for n in tree["nodes"]
        if include_scored or not n.get("results_checked")
    ]
    nodes.sort(
        key=lambda n: (
            -(n.get("repeat_count") or 0),
            n.get("depth", 0),
            -(n.get("reach") or 0),
        )
    )
    return nodes[:limit] if limit else nodes


def queue_scores(
    tree: dict,
    *,
    question_slugs: list[str] | None = None,
    top_n: int | None = None,
    dry_run: bool = False,
    postback_url: str | None = None,
    max_items: int | None = None,
    user_id: int | None = None,
    click_depth: int | None = None,
) -> dict:
    """Queue gap scoring for several questions on the Standard queue.

    `click_depth` turns each task into a DEEP EXPANSION as well as a score.
    Nothing else changes, because nothing else needs to: the response comes
    back through the same `ingest_task` -> `apply_response` path, which already
    harvests the PAA block it finds. Asking for the clicks simply means that
    block is 15 questions instead of 4. A deep search is therefore not a second
    pipeline - it is this one, told to open the branches.

    Returns the plan and its price when `dry_run`, otherwise what was posted.
    The price is ALWAYS returned, dry run or not: CLAUDE.md's operating rule is
    that the cost is visible before anything is spent, and a batch is precisely
    where a surprise would be expensive.

    A question already scored is skipped rather than re-bought. So is one with a
    task still in flight - without that check, clicking the button twice pays
    twice for the same answer.

    `max_items` is a hard cap on how many tasks may be posted, applied AFTER
    those two filters so nothing is dropped for a question that was going to be
    free anyway. It is an int in the same class as `top_n`, deliberately: the
    caller's reason for capping - a short credit balance - stays in the API
    layer, and this module keeps knowing nothing about accounts.
    """
    language_code = tree["language_code"]
    location_code = tree["location_code"]

    if question_slugs:
        by_slug = {n["slug"]: n for n in tree["nodes"]}
        missing = [s for s in question_slugs if s not in by_slug]
        if missing:
            raise KeyError(", ".join(missing))
        chosen = [by_slug[s] for s in question_slugs]
    else:
        chosen = scoring_candidates(tree, top_n or 10)

    in_flight = {
        t["cache_key"]
        for t in db.tasks_for_tree(tree["slug"])
        if t["status"] == "posted"
    } if db.available() else set()

    items: list[dict] = []
    skipped: list[dict] = []
    for node in chosen:
        key = cache_key(node["question"], location_code, language_code)
        if node.get("results_checked"):
            skipped.append({"slug": node["slug"], "reason": "already_scored"})
            continue
        if key in in_flight:
            skipped.append({"slug": node["slug"], "reason": "in_flight"})
            continue
        item = {
            "keyword": node["question"],
            "location_code": location_code,
            "language_code": language_code,
            "cache_key": key,
            "slug": node["slug"],
            "normalized": node["id"],
        }
        if click_depth:
            item["people_also_ask_click_depth"] = click_depth
        items.append(item)

    # Trim to what the caller can pay for, reporting the remainder through the
    # `skipped` list the UI already renders rather than by refusing the batch.
    if max_items is not None and len(items) > max_items:
        for dropped in items[max(0, max_items) :]:
            skipped.append({"slug": dropped["slug"], "reason": "no_credits"})
        items = items[: max(0, max_items)]

    # Estimated, and labelled as such. The real figure is whatever DataForSEO
    # reports per task, and that is what gets recorded - CLAUDE.md: read the
    # cost from the response, never trust the flat estimate.
    per_request = STANDARD_COST_PER_REQUEST + (click_depth or 0) * CLICK_SURCHARGE
    estimate = round(len(items) * per_request, 6)
    plan = {
        "queued": [i["slug"] for i in items],
        "skipped": skipped,
        "count": len(items),
        "estimated_spend": estimate,
        "queue": "standard",
    }

    if dry_run or not items:
        return {**plan, "dry_run": True} if dry_run else {**plan, "posted": []}

    client = _client(max_requests=len(items), dry_run=False)
    posted = client.serp_task_post(
        [
            {k: v for k, v in item.items() if k not in ("slug", "normalized")}
            for item in items
        ],
        postback_url=postback_url,
    )

    # Write the receipts down BEFORE anything else can fail. The charge happens
    # at post time, so an id that is not recorded is money with nothing
    # attached to it.
    by_key = {i["cache_key"]: i for i in items}
    for row in posted:
        item = by_key.get(row["cache_key"], {})
        db.task_insert(
            task_id=row["task_id"],
            cache_key=row["cache_key"],
            keyword=row["keyword"],
            tree_slug=tree["slug"],
            language_code=language_code,
            location_code=location_code,
            crawl_id=tree.get("crawl_id"),
            normalized=item.get("normalized"),
            cost=row.get("cost"),
            status="posted" if row["task_id"] else "failed",
            error=None if row["task_id"] else row.get("status_message"),
            user_id=user_id,
        )

    plan["posted"] = [
        {"slug": by_key.get(r["cache_key"], {}).get("slug"), "task_id": r["task_id"],
         "cost": r.get("cost"), "error": None if r["task_id"] else r.get("status_message")}
        for r in posted
    ]
    plan["spend"] = round(sum(r.get("cost") or 0 for r in posted), 6)
    return plan


# ------------------------------------------------------------ deep search
#
# THE TREE IS DEEP BUT THIN. One click-depth response is a chain - {1:4, 2:2,
# 3:3, 4:3, 5:3}, 15 questions - so Google hands back four top-level questions
# and expands exactly ONE of them. The other three branches are never opened.
# Deep search opens them, by asking each closed branch the same question Google
# was asked about the seed.
#
# MEASURED, 2026-09-30, "teeth whitening" (en/2840), before this was priced:
#
#   expansions   unique questions   new per expansion
#            0                 15   -
#            6                 83   ~11
#           11                129   ~10
#
# Duplicate rate 31% (51 of 165 returned questions were already in the tree),
# and all 11 leaves scored reach 1.000 - the relevance gate rejected nothing,
# because the unexpanded level-1 nodes are Google's own top four and are the
# highest-relevance nodes in the tree. That is what makes expanding SAFER than
# recursing deeper would be: `reach` decays with depth, and this is where it is
# at its maximum.
#
# DEFAULT_EXPANSIONS = 6 is not a round number, it is the budget four credits
# buys under the pricing rule already shipped: one Live seed at 1 credit, six
# queued requests at half a credit each. The published figure is therefore 83,
# not the ~100 AlsoAsked advertises - theirs is an average of THEIR shape, and
# this repo does not ship numbers it has not measured.
DEFAULT_EXPANSIONS = 6


def expansion_candidates(tree: dict, limit: int) -> list[dict]:
    """The branches Google left closed, best first.

    A leaf is a question with no children. The seed is excluded because it is
    the keyword rather than a question, and expanding it would re-run the search
    already paid for. A question that has already been scored is excluded too:
    an expansion IS a scoring request, so posting one for it would buy a
    response we hold.

    Ranked by `reach` and gated on `EXPANSION_FLOOR`, which is not a new rule -
    it is the crawl rule `matching.py` already states verbatim, wired to a
    second caller.
    """
    parents = {n.get("parent_id") for n in tree["nodes"]}
    leaves = [
        n
        for n in tree["nodes"]
        if n["id"] not in parents
        and n.get("depth", 0) > 0
        and not n.get("results_checked")
        and _reach(n) >= EXPANSION_FLOOR
    ]
    # `question` breaks ties so the same tree always proposes the same branches;
    # an unstable order would make the confirm dialog disagree with what the
    # next click actually buys.
    leaves.sort(key=lambda n: (-_reach(n), n.get("depth", 0), n["question"]))
    return leaves[:limit] if limit else leaves


def queue_expansions(
    tree: dict,
    *,
    budget: int = DEFAULT_EXPANSIONS,
    dry_run: bool = False,
    postback_url: str | None = None,
    max_items: int | None = None,
    user_id: int | None = None,
) -> dict:
    """Open the closed branches on the Standard queue.

    Deliberately a thin layer over `queue_scores`: the in-flight filter, the
    credit trim, the receipts written before anything else can fail and the
    ingest path are all the same machinery, and a second copy of them is how
    two routes into the same tree start disagreeing about it.
    """
    chosen = expansion_candidates(tree, budget)
    plan = queue_scores(
        tree,
        question_slugs=[n["slug"] for n in chosen],
        dry_run=dry_run,
        postback_url=postback_url,
        max_items=max_items,
        user_id=user_id,
        click_depth=CLICK_DEPTH,
    )
    # Named so the caller can price it and the interface can say what it is
    # about to open, rather than reporting a batch score with a bigger bill.
    plan["action"] = "deep"
    plan["expanding"] = [
        {"slug": n["slug"], "question": n["question"], "depth": n["depth"]}
        for n in chosen
        if n["slug"] in set(plan["queued"])
    ]
    return plan


def ingest_task(task_id: str, response: dict) -> dict | None:
    """Apply a finished Standard-queue task to its tree.

    Idempotent by design: a postback that arrives twice - or arrives after the
    sweep already fetched the same task - must not double-count the harvest or
    write a second gap score. A task not in `posted` state is therefore ignored.
    """
    row = db.task_get(task_id)
    if row is None or row["status"] != "posted":
        return None

    tree = load_tree(row["tree_slug"])
    if tree is None:
        db.task_finish(task_id, error=f"tree gone: {row['tree_slug']}")
        return None

    node = next((n for n in tree["nodes"] if n["id"] == normalize(
        row["keyword"], row["language_code"])), None)
    if node is None:
        db.task_finish(task_id, error="question no longer in the tree")
        return None

    # The response was paid for at post time; store it before scoring so a
    # failure in the metric does not cost the data.
    db.snapshot_put(
        row["cache_key"],
        response,
        language_code=row["language_code"],
        location_code=row["location_code"],
    )

    result = apply_response(tree, node, response, row["cache_key"])
    save_tree(tree)
    db.task_finish(task_id)
    return result


def sweep_pending(*, older_than_seconds: int = 300, limit: int = 50) -> dict:
    """Fetch tasks whose postback never arrived.

    A callback can be lost to a deploy landing mid-flight or a transient error
    on our side, and the task is already paid for. `task_get` is free and
    results live for 30 days, so the recovery costs nothing but has to actually
    be run - a stranded task is a charge with no answer attached.
    """
    if not db.available():
        return {"checked": 0, "ingested": 0, "errors": []}

    pending = db.tasks_pending(older_than_seconds, limit)
    client = _client(max_requests=0, dry_run=False)
    ingested = 0
    errors: list[str] = []
    for row in pending:
        try:
            response = client.serp_task_get(row["task_id"])
            status = (response.get("tasks") or [{}])[0].get("status_code")
            if status != 20000:
                continue  # not finished yet; leave it pending
            if ingest_task(row["task_id"], response):
                ingested += 1
        except Exception as exc:  # noqa: BLE001 - one bad task must not stop the sweep
            errors.append(f"{row['task_id']}: {type(exc).__name__}")
    return {"checked": len(pending), "ingested": ingested, "errors": errors}
