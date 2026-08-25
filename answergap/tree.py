"""Builds question trees from raw DataForSEO responses.

This is the ONLY place a tree is assembled. Validation scripts and the API both
go through it — if they diverged, the metric we measure and the metric we ship
would drift apart silently.

INDEXED BY QUERIED KEYWORD, NOT BY FILENAME
-------------------------------------------
Filenames under `data/raw/` carry Phase 0's ad-hoc naming (`probe-A-click4`,
`expand-…`, `question-…`). Building the tree from those would be brittle.
Instead each response's `tasks[0].data.keyword` is read: the data states which
term was queried, along with its location and language.

The same term can have several responses (during Phase 0 "diş beyazlatma" was
queried six times: baseline, city, second run, three probes). The RICHEST one
wins — most PAA questions, then most organic results.
"""

from __future__ import annotations

import argparse
import json
from datetime import datetime, timezone
from pathlib import Path

from . import languages
from .dataforseo import extract_paa, slugify, walk
from .matching import DEFAULT_STRATEGY, score_results
from .text import normalize

ROOT = Path(__file__).resolve().parent.parent
RAW_DIR = ROOT / "data" / "raw"

# --- Gap rule ---------------------------------------------------------------
#
# PROVISIONAL AND UNVALIDATED. The Phase 0.5 labeling round was set up but
# stopped before labels were collected, so this threshold was chosen from two
# hand-inspected examples, not measured. The UI is required to surface that.
#
# Phase 0 finding: the right metric is NOT "highest overlap" but the COUNT of
# pages clearing the bar. The genuinely unanswered question had exactly one
# perfect match and nothing else; the well-covered one had eight pages that all
# peaked at 0.67.
THRESHOLD = 0.60
STRATEGY = DEFAULT_STRATEGY

STATUS_GAP = "gap"
STATUS_WEAK = "weak"
STATUS_COVERED = "covered"
STATUS_NO_DATA = "no_data"

STATUSES = (STATUS_GAP, STATUS_WEAK, STATUS_COVERED, STATUS_NO_DATA)

MAX_DEPTH = 2


# --------------------------------------------------------------- raw data


def _load(path: Path) -> dict | None:
    try:
        return json.loads(path.read_text(encoding="utf-8"))
    except (json.JSONDecodeError, OSError):
        return None


def _task_data(response: dict) -> dict:
    try:
        return response["tasks"][0].get("data") or {}
    except (KeyError, IndexError, TypeError):
        return {}


def _organic_results(response: dict) -> list[dict]:
    try:
        items = response["tasks"][0]["result"][0].get("items") or []
    except (KeyError, IndexError, TypeError):
        return []
    return [
        {
            "title": i.get("title") or "",
            "url": i.get("url") or "",
            "domain": i.get("domain") or "",
        }
        for i in items
        if i.get("type") == "organic"
    ]


def _ai_sources(response: dict) -> list[str]:
    """Reference domains from the top-level AI Overview element.

    Phase 0 measured that the AI Overview nested inside PAA cannot be resolved,
    but the SERP's own `ai_overview` block arrives fully populated with
    references. That data is real and nobody else surfaces it.
    """
    for node in walk(response.get("tasks")):
        if node.get("type") == "ai_overview":
            return [
                d
                for d in (
                    (r.get("domain") or "")
                    for r in (node.get("references") or [])
                    if isinstance(r, dict)
                )
                if d
            ]
    return []


def index_raw(raw_dir: Path = RAW_DIR) -> dict[str, dict]:
    """Map normalized keyword -> richest response for it."""
    index: dict[str, dict] = {}
    for path in sorted(raw_dir.glob("*.json")):
        response = _load(path)
        if not response:
            continue
        data = _task_data(response)
        keyword = (data.get("keyword") or "").strip()
        if not keyword:
            continue  # not a SERP response (e.g. a locations dump)

        language_code = (data.get("language_code") or "").strip() or None
        key = normalize(keyword, language_code)
        if not key:
            continue

        paa = [q for q in (e.get("title") or "" for e in extract_paa(response)) if q.strip()]
        organic = _organic_results(response)
        entry = {
            "keyword": keyword,
            "language_code": language_code or languages.DEFAULT_LANGUAGE,
            "location_code": data.get("location_code"),
            "file": f"data/raw/{path.name}",
            "updated_at": datetime.fromtimestamp(
                path.stat().st_mtime, tz=timezone.utc
            ).isoformat(timespec="seconds"),
            "paa": paa,
            "results": organic,
            "ai_sources": _ai_sources(response),
        }
        previous = index.get(key)
        if previous is None or (len(entry["paa"]), len(entry["results"])) > (
            len(previous["paa"]),
            len(previous["results"]),
        ):
            index[key] = entry
    return index


# ---------------------------------------------------------------- scoring


def score_question(
    question: str,
    results: list[dict],
    language_code: str,
    threshold: float = THRESHOLD,
    strategy: str = STRATEGY,
) -> tuple[list[dict], int, str]:
    """Score a question's organic results and classify it.

    Returns (scored results, pages clearing the threshold, status).
    """
    if not results:
        return [], 0, STATUS_NO_DATA

    scores = score_results(question, results, language_code, strategy)
    scored = [{**r, "overlap": round(s, 3)} for r, s in zip(results, scores)]
    matching = sum(1 for s in scores if s >= threshold)

    if matching == 0:
        status = STATUS_GAP
    elif matching <= 2:
        status = STATUS_WEAK
    else:
        status = STATUS_COVERED
    return scored, matching, status


# ------------------------------------------------------------------- tree


def _seed_keys(index: dict[str, dict]) -> list[str]:
    """Roots: terms that have PAA children but are nobody else's PAA child."""
    children: set[str] = set()
    for entry in index.values():
        for question in entry["paa"]:
            key = normalize(question, entry["language_code"])
            if key:
                children.add(key)
    return sorted(k for k, e in index.items() if e["paa"] and k not in children)


def build_tree(seed_key: str, index: dict[str, dict]) -> dict | None:
    """Breadth-first tree from one seed.

    CLAUDE.md crawler rules applied here:
      - deduplication is mandatory (normalized question is the identity)
      - cycle breaking is mandatory (a visited set; A->B->A would burn credit)
    """
    root = index.get(seed_key)
    if not root:
        return None

    language_code = root["language_code"]
    nodes: dict[str, dict] = {}

    def add(question: str, depth: int, parent: str | None) -> str:
        key = normalize(question, language_code)
        if key in nodes:
            node = nodes[key]
            # Same question surfaced under another branch. CLAUDE.md's repeat
            # signal: costs nothing extra and is the strongest fallback while
            # search volume is unavailable.
            if parent and parent not in node["parents"]:
                node["parents"].append(parent)
                node["repeat_count"] = len(node["parents"])
            return key

        entry = index.get(key)
        results = entry["results"] if entry else []
        scored, matching, status = score_question(question, results, language_code)

        nodes[key] = {
            "id": key,
            "slug": slugify(question),
            "question": question,
            "depth": depth,
            "parent_id": parent,
            "parents": [parent] if parent else [],
            "repeat_count": 1 if parent else 0,
            "status": status,
            "matching_pages": matching,
            "results_checked": len(results),
            "results": scored,
            "ai_sources": entry["ai_sources"] if entry else [],
            "source_file": entry["file"] if entry else None,
            "updated_at": entry["updated_at"] if entry else None,
        }
        return key

    root_id = add(root["keyword"], 0, None)
    visited: set[str] = {root_id}
    queue: list[tuple[str, int]] = [(root_id, 0)]

    while queue:
        current, depth = queue.pop(0)
        if depth >= MAX_DEPTH:
            continue
        entry = index.get(current)
        if not entry:
            continue
        for child_question in entry["paa"]:
            child_id = add(child_question, depth + 1, current)
            if child_id not in visited:  # cycle breaking
                visited.add(child_id)
                queue.append((child_id, depth + 1))

    node_list = sorted(nodes.values(), key=lambda n: (n["depth"], n["question"]))

    # Slugs are routing keys. slugify() truncates at 60 characters, so two long
    # questions with a shared prefix can collide — and the detail page would then
    # quietly open the WRONG question. Disambiguate here.
    seen_slugs: dict[str, int] = {}
    for node in node_list:
        base = node["slug"] or "question"
        if base in seen_slugs:
            seen_slugs[base] += 1
            node["slug"] = f"{base}-{seen_slugs[base]}"
        else:
            seen_slugs[base] = 1

    counts = {s: 0 for s in STATUSES}
    for node in node_list:
        counts[node["status"]] += 1

    timestamps = [n["updated_at"] for n in node_list if n["updated_at"]]

    return {
        "seed": root["keyword"],
        "slug": slugify(root["keyword"]),
        "language_code": language_code,
        "language_name": languages.get(language_code).name,
        "location_code": root["location_code"],
        "node_count": len(node_list),
        "status_counts": counts,
        "threshold": THRESHOLD,
        "strategy": STRATEGY,
        "threshold_validated": False,  # the UI turns this into a warning badge
        "updated_at": max(timestamps) if timestamps else None,
        "nodes": node_list,
    }


def all_trees(raw_dir: Path = RAW_DIR) -> list[dict]:
    index = index_raw(raw_dir)
    trees = []
    for key in _seed_keys(index):
        tree = build_tree(key, index)
        if tree and tree["node_count"] > 1:
            trees.append(tree)
    return sorted(trees, key=lambda t: -t["node_count"])


# -------------------------------------------------------------------- CLI


def main() -> int:
    import sys

    sys.stdout.reconfigure(encoding="utf-8", errors="replace")
    parser = argparse.ArgumentParser(description="Build question trees from raw data")
    parser.add_argument("--summary", action="store_true", help="Print every node")
    parser.add_argument("--json", metavar="DIR", help="Write trees as static JSON")
    args = parser.parse_args()

    trees = all_trees()
    if not trees:
        print("No trees built — no SERP responses under data/raw.")
        return 1

    if args.json:
        target = Path(args.json)
        target.mkdir(parents=True, exist_ok=True)
        (target / "trees.json").write_text(
            json.dumps(
                [{k: v for k, v in t.items() if k != "nodes"} for t in trees],
                ensure_ascii=False,
                indent=2,
            ),
            encoding="utf-8",
        )
        for tree in trees:
            (target / f"tree-{tree['slug']}.json").write_text(
                json.dumps(tree, ensure_ascii=False, indent=2), encoding="utf-8"
            )
        print(f"Wrote {len(trees)} trees to {target}")
        return 0

    print(f"{len(trees)} trees  ·  threshold {THRESHOLD} ({STRATEGY}, UNVALIDATED)")
    print()
    for tree in trees:
        counts = tree["status_counts"]
        print(f"  {tree['seed']}   [{tree['language_code']} / loc {tree['location_code']}]")
        print(f"    nodes    : {tree['node_count']}")
        print(f"    gap      : {counts[STATUS_GAP]}")
        print(f"    weak     : {counts[STATUS_WEAK]}")
        print(f"    covered  : {counts[STATUS_COVERED]}")
        print(f"    no data  : {counts[STATUS_NO_DATA]}  (NOT counted as gaps)")
        print(f"    updated  : {tree['updated_at']}")
        if args.summary:
            children: dict[str | None, list[dict]] = {}
            for node in tree["nodes"]:
                children.setdefault(node["parent_id"], []).append(node)

            def show(node_id: str | None, indent: int) -> None:
                for node in children.get(node_id, []):
                    repeat = f"  x{node['repeat_count']}" if node["repeat_count"] > 1 else ""
                    print(
                        f"{'      ' + '  ' * indent}"
                        f"[{node['status']:<8}] {node['question']}{repeat}"
                    )
                    show(node["id"], indent + 1)

            show(None, 0)
        print()
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
