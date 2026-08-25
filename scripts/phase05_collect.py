#!/usr/bin/env python3
"""Phase 0.5 step 1 — gather data and produce a labeling form.

WHY
---
Phase 0 established that the gap signal comes from a question's own organic
results, not from the PAA block. What it did NOT establish is which matching
strategy and which threshold are correct. Choosing those without measurement
would rest the product's central claim on a guess.

This script:
  1. samples questions already collected in earlier runs
  2. queries each one so its organic results are available
  3. writes a form a human can judge from

You then fill in `data/PHASE05_labels.csv` (G = gap, N = not a gap) and
`phase05_evaluate.py` measures which rule agrees with your judgement.

Usage:
    python scripts/phase05_collect.py --dry-run
    python scripts/phase05_collect.py --language tr
"""

from __future__ import annotations

import argparse
import csv
import json
import os
import sys
from pathlib import Path

sys.path.insert(0, str(Path(__file__).resolve().parent.parent))

from answergap.dataforseo import (  # noqa: E402
    LIVE_COST_PER_REQUEST,
    BudgetExceeded,
    Client,
    DataForSEOError,
    load_dotenv,
    slugify,
    walk,
)
from answergap.text import normalize  # noqa: E402
from answergap.tree import index_raw  # noqa: E402

ROOT = Path(__file__).resolve().parent.parent
RAW_DIR = ROOT / "data" / "raw"
FORM_PATH = ROOT / "data" / "PHASE05_LABELING_FORM.md"
CSV_PATH = ROOT / "data" / "PHASE05_labels.csv"

SAMPLE_SIZE = 16
RESULTS_SHOWN = 8


def log(message: str = "") -> None:
    print(message, flush=True)


def md(text: str) -> str:
    """Escape a markdown table cell. Page titles routinely contain '|'."""
    return (text or "").replace("|", "\\|").replace("\n", " ").strip()


def available_questions(language: str | None) -> list[tuple[str, str, str]]:
    """(question, seed keyword, language) already collected in earlier runs.

    Costs nothing — reuses data already paid for. Reads through `index_raw` so
    the file-naming rules live in exactly one place.
    """
    index = index_raw(RAW_DIR)
    seen: set[str] = set()
    out: list[tuple[str, str, str]] = []
    for entry in index.values():
        if language and entry["language_code"] != language:
            continue
        for question in entry["paa"]:
            key = normalize(question, entry["language_code"])
            if key and key not in seen:
                seen.add(key)
                out.append((question, entry["keyword"], entry["language_code"]))
    return out


def balanced_sample(
    questions: list[tuple[str, str, str]], size: int
) -> list[tuple[str, str, str]]:
    """Spread the sample across seeds — one niche alone would skew the threshold."""
    groups: dict[str, list[tuple[str, str, str]]] = {}
    for item in questions:
        groups.setdefault(item[1], []).append(item)
    picked: list[tuple[str, str, str]] = []
    i = 0
    while len(picked) < size and any(i < len(v) for v in groups.values()):
        for group in groups.values():
            if i < len(group) and len(picked) < size:
                picked.append(group[i])
        i += 1
    return picked


def organic_results(response: dict | None) -> list[dict]:
    if not response:
        return []
    try:
        items = response["tasks"][0]["result"][0].get("items") or []
    except (KeyError, IndexError, TypeError):
        return []
    return [
        {"title": i.get("title") or "", "url": i.get("url") or "",
         "domain": i.get("domain") or ""}
        for i in items
        if i.get("type") == "organic"
    ]


def ai_sources(response: dict | None) -> list[str]:
    if not response:
        return []
    for node in walk(response.get("tasks")):
        if node.get("type") == "ai_overview":
            return [
                (r.get("domain") or "")
                for r in (node.get("references") or [])
                if isinstance(r, dict)
            ]
    return []


def main() -> int:
    sys.stdout.reconfigure(encoding="utf-8", errors="replace")
    parser = argparse.ArgumentParser(description="Phase 0.5 step 1 — data + labeling form")
    parser.add_argument("--dry-run", action="store_true")
    parser.add_argument("--max-requests", type=int, default=20)
    parser.add_argument("-n", "--count", type=int, default=SAMPLE_SIZE)
    parser.add_argument("--language", help="Only sample questions in this language")
    parser.add_argument("--location", type=int, help="Override location_code")
    args = parser.parse_args()

    pool = available_questions(args.language)
    if not pool:
        log("ERROR: no Phase 0 data under data/raw. Run phase0_validate.py first.")
        return 1
    sample = balanced_sample(pool, args.count)

    log(f"{len(pool)} unique questions available; {len(sample)} sampled.")
    log("")

    def key_for(question: str) -> str:
        return f"question-{slugify(question)}"

    index = index_raw(RAW_DIR)
    already = [
        q for q, _, lang in sample if normalize(q, lang) in index
        and index[normalize(q, lang)]["results"]
    ]
    fresh = [q for q, _, _ in sample if q not in already]

    if args.dry_run:
        log("PLAN (--dry-run — no network calls made)")
        log("-" * 76)
        for question, seed, lang in sample:
            state = "CACHED" if question in already else f"${LIVE_COST_PER_REQUEST:.4f}"
            log(f"  [{lang}] [{seed[:16]:<16}] {question[:42]:<44} {state}")
        log("-" * 76)
        log(f"New requests: {len(fresh)} · estimated "
            f"${len(fresh) * LIVE_COST_PER_REQUEST:.4f}")
        return 0

    env = load_dotenv(ROOT / ".env")
    login = env.get("DATAFORSEO_LOGIN") or os.environ.get("DATAFORSEO_LOGIN", "")
    password = env.get("DATAFORSEO_PASSWORD") or os.environ.get("DATAFORSEO_PASSWORD", "")
    if not (login and password):
        log("ERROR: DATAFORSEO_LOGIN / DATAFORSEO_PASSWORD missing from .env")
        return 1

    client = Client(login, password, RAW_DIR, max_requests=args.max_requests)
    records: list[dict] = []

    try:
        for i, (question, seed, lang) in enumerate(sample, 1):
            entry = index.get(normalize(question, lang))
            if entry and entry["results"]:
                results = entry["results"]
                sources = entry["ai_sources"]
                source_file = entry["file"]
                client.cache_hits += 1
            else:
                location = args.location or entry.get("location_code") if entry else None
                response = client.serp(
                    question,
                    location or 2840,
                    lang,
                    cache_key=key_for(question),
                )
                results = organic_results(response)
                sources = ai_sources(response)
                source_file = f"data/raw/{key_for(question)}.json"

            records.append(
                {
                    "question": question,
                    "seed": seed,
                    "language": lang,
                    "results": results,
                    "ai_sources": sources,
                    "file": source_file,
                }
            )
            log(f"  {i:2}/{len(sample)}  {question[:50]:<52} {len(results)} organic")
    except BudgetExceeded as e:
        log(f"STOPPED: {e}")
        return 2
    except DataForSEOError as e:
        log(f"API ERROR: {e}")
        return 3

    lines: list[str] = []
    add = lines.append
    add("# Phase 0.5 — Labeling Form")
    add("")
    add("Goal: measure whether the gap metric agrees with human judgement.")
    add("")
    add("**What to do:** for each question below, look at the search results and")
    add("fill in the `label` column of `data/PHASE05_labels.csv`:")
    add("")
    add("- `G` — **gap.** No page targets this question directly; the answer has")
    add("  to be dug out of a page written about something else.")
    add("- `N` — **not a gap.** At least one page (ideally several) was written")
    add("  specifically to answer this question.")
    add("")
    add("Leave `?` where you are unsure — those are skipped, not guessed.")
    add("Do not look at the metric. Your judgement is the thing being measured.")
    add("")
    add(f"{len(records)} questions · billable requests: {client.billable_calls} "
        f"(${client.estimated_spend:.4f}) · from cache: {client.cache_hits}")
    add("")
    add("---")
    add("")

    for i, record in enumerate(records, 1):
        add(f"## {i}. {md(record['question'])}")
        add("")
        add(f"*Seed: {md(record['seed'])} · language: {record['language']} · "
            f"source: `{record['file']}`*")
        add("")
        if record["results"]:
            add("| # | Domain | Page title |")
            add("|---:|---|---|")
            for j, r in enumerate(record["results"][:RESULTS_SHOWN], 1):
                add(f"| {j} | {md(r['domain'])} | {md(r['title'])} |")
        else:
            add("*No organic results.*")
        add("")
        if record["ai_sources"]:
            add(f"AI Overview sources: {', '.join(d for d in record['ai_sources'][:5] if d)}")
            add("")
        add("**Gap? →** `G` / `N` / `?`  (write it in the CSV)")
        add("")

    FORM_PATH.write_text("\n".join(lines) + "\n", encoding="utf-8")

    existing: dict[str, str] = {}
    if CSV_PATH.exists():
        with CSV_PATH.open(encoding="utf-8", newline="") as f:
            for row in csv.DictReader(f):
                existing[row.get("question", "")] = row.get("label", "?")

    with CSV_PATH.open("w", encoding="utf-8", newline="") as f:
        writer = csv.writer(f)
        writer.writerow(["question", "label", "seed", "language"])
        for record in records:
            writer.writerow(
                [
                    record["question"],
                    existing.get(record["question"], "?"),
                    record["seed"],
                    record["language"],
                ]
            )

    log("")
    log(f"Labeling form : {FORM_PATH.relative_to(ROOT)}")
    log(f"CSV to fill in: {CSV_PATH.relative_to(ROOT)}")
    log(f"Billable: {client.billable_calls} · spend ${client.estimated_spend:.4f}")
    log("")
    log("Next: read the form, fill the CSV, then run")
    log("  python scripts/phase05_evaluate.py")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
