"""Step 0 of the deep-search plan: what does expanding the closed branches
actually YIELD?

A `click_depth=4` response is a chain, not a tree - `{1:4, 2:2, 3:3, 4:3, 5:3}`,
15 questions. Google hands back four top-level questions and only ONE of them
gets expanded; the other three are never opened. Deep search is meant to open
them.

The target figure, ~100 questions for 4 credits, is AlsoAsked's published
average for THEIR shape, not a measurement of ours. This repo does not ship
numbers it has not measured, and a credit price set from somebody else's
average is a price set on a guess. So this runs one real expansion and counts.

WHAT IT COSTS. The seed is served from cache when it is there ($0). Each
expansion is one request. LIVE, deliberately: `dataforseo.py` reserves the
Standard queue for work nobody watches, and a queued task cannot hand its
result back on a laptop with no database and no public callback URL. Live is
$0.0020 against $0.0006, so this measurement costs about three times what the
feature will - roughly 1.5 cents for the default six. Production ships on the
queue.

    python scripts/measure_deep.py                      # teeth whitening, 6
    python scripts/measure_deep.py "diş beyazlatma" tr 2792
    python scripts/measure_deep.py --dry-run            # costs nothing
"""

from __future__ import annotations

import sys
from collections import Counter
from pathlib import Path

# Same two lines every script in here carries: run directly, not as a module.
sys.path.insert(0, str(Path(__file__).resolve().parent.parent))

from answergap import live, text  # noqa: E402
from answergap.matching import seed_relevance


def _leaves(nodes: list[dict]) -> list[dict]:
    """Questions with no children - the branches Google left closed.

    The seed is excluded by `depth > 0`: it is the keyword, not a question, and
    expanding it again would re-run the search we already paid for.
    """
    parents = {n.get("parent_id") for n in nodes}
    return [n for n in nodes if n["id"] not in parents and n.get("depth", 0) > 0]


def main() -> int:
    args = [a for a in sys.argv[1:] if not a.startswith("--")]
    dry = "--dry-run" in sys.argv
    seed = args[0] if args else "teeth whitening"
    language = args[1] if len(args) > 1 else "en"
    location = int(args[2]) if len(args) > 2 else 2840
    budget = int(args[3]) if len(args) > 3 else 6

    print(f"seed      : {seed!r}  ({language} / {location})")
    print(f"budget    : {budget} expansions" + ("  [DRY RUN]" if dry else ""))
    print()

    tree = live.crawl(seed, location, language, dry_run=dry)
    nodes = tree.get("nodes", [])
    base = [n for n in nodes if n.get("depth", 0) > 0]
    shape = dict(sorted(Counter(n.get("depth", 0) for n in nodes).items()))
    print(f"seed crawl: {len(base)} questions, shape {shape}, "
          f"spend ${tree.get('spend') or 0:.4f}")

    # Rank the closed branches the way `_attach_harvest` already ranks a
    # harvest: by `reach`, which is a node's own relevance to the seed times
    # its parent's reach. The gate is `EXPANSION_FLOOR`; this reuses it rather
    # than inventing a second rule.
    candidates = sorted(_leaves(nodes), key=live._reach, reverse=True)
    kept = [n for n in candidates if live._reach(n) >= live.EXPANSION_FLOOR]
    cut = [n for n in candidates if live._reach(n) < live.EXPANSION_FLOOR]
    print(f"leaves    : {len(candidates)}  "
          f"({len(kept)} clear the {live.EXPANSION_FLOOR} floor, {len(cut)} cut)")
    for n in cut[:4]:
        print(f"            cut  reach={live._reach(n):.3f}  {n['question'][:58]}")
    print()

    chosen = kept[:budget]
    if not chosen:
        print("nothing to expand.")
        return 1

    seen = {text.normalize(n["question"], language) for n in base}
    found: list[str] = []
    duplicates = 0
    spend = 0.0
    client = live._client(max_requests=len(chosen), dry_run=dry)

    for i, node in enumerate(chosen, 1):
        question = node["question"]
        print(f"[{i}/{len(chosen)}] reach={live._reach(node):.3f}  {question[:56]}")
        try:
            response = client.serp(
                question, location, language,
                extra_params={"people_also_ask_click_depth": live.CLICK_DEPTH},
            )
        except Exception as exc:  # noqa: BLE001 - one failure must not end the run
            print(f"          FAILED: {type(exc).__name__}: {str(exc)[:90]}")
            continue
        if not response:
            print("          no response")
            continue
        spend += float(response.get("cost") or 0)

        sub = live.build_from_response(response, question, location, language)
        fresh = new = 0
        for child in sub.get("nodes", []):
            if child.get("depth", 0) == 0:
                continue  # the expanded question itself, already in the tree
            fresh += 1
            key = text.normalize(child["question"], language)
            if key in seen:
                duplicates += 1
                continue
            seen.add(key)
            found.append(child["question"])
            new += 1
        rel = seed_relevance(seed, question, language)
        print(f"          {fresh} returned, {new} new  (relevance to seed {rel:.2f})")

    total = len(base) + len(found)
    print()
    print("=" * 62)
    print(f"  questions before : {len(base)}")
    print(f"  added by expansion: {len(found)}")
    print(f"  duplicates dropped: {duplicates}")
    print(f"  TOTAL UNIQUE      : {total}")
    print()
    print(f"  expansions run    : {len(chosen)}")
    print(f"  measured spend    : ${spend:.4f}  (Live; the queue is ~3.3x less)")
    if total:
        print(f"  cost per question : ${spend / total:.5f}")
    print()
    # The number the credit price rests on. AlsoAsked publishes ~100 questions
    # for 4 credits; four credits here is one Live seed plus six queued
    # expansions under the half-price rule.
    print("  AlsoAsked, published: ~100 questions for 4 credits (25/credit)")
    print(f"  this run            : {total} questions for 4 credits "
          f"({total / 4:.0f}/credit)")
    print("=" * 62)
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
