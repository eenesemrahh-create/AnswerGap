#!/usr/bin/env python3
"""Phase 0 probe — which parameters, if any, return PAA source data?

BACKGROUND
----------
The first validation run found that all 32 PAA elements came back as:

    "type": "people_also_ask_ai_overview_expanded_element"
    "items": null, "references": null, "asynchronous_ai_overview": true

Google now answers People Also Ask with an AI Overview, and DataForSEO does not
load that content in a default request. Source URL coverage was 0%.

That would kill the product's core definition ("no dedicated page") IF the data
is genuinely unavailable. DataForSEO has two paid parameters aimed at exactly
this situation:

    people_also_ask_click_depth : 1-4   clicks PAA items open  ($0.00015/click)
    load_async_ai_overview      : bool  loads async AI Overview (~$0.002)

Both are refunded when the element is absent, so trying costs nothing if it
fails.

RESULT (Turkish, 2026-08): neither works. `references` stayed null in all three
combinations. But `people_also_ask_click_depth=4` raised the PAA count from 4 to
15 in a single request, which turned out to be the most valuable finding of the
run — see CLAUDE.md.

Usage:
    python scripts/phase0_paa_probe.py --dry-run
    python scripts/phase0_paa_probe.py
"""

from __future__ import annotations

import argparse
import json
import os
import sys
from pathlib import Path

sys.path.insert(0, str(Path(__file__).resolve().parent.parent))

from answergap.dataforseo import (  # noqa: E402
    BudgetExceeded,
    Client,
    DataForSEOError,
    load_dotenv,
    walk,
)

ROOT = Path(__file__).resolve().parent.parent
RAW_DIR = ROOT / "data" / "raw"
REPORT_PATH = ROOT / "data" / "PHASE0_PROBE.md"

SEED = "diş beyazlatma"
LOCATION_CODE = 2792
LANGUAGE_CODE = "tr"

COMBINATIONS: list[dict] = [
    {
        "name": "A · click depth only",
        "key": "probe-A-click4",
        "params": {"people_also_ask_click_depth": 4},
        "cost": 0.00198 + 4 * 0.00015,
        "expectation": "PAA items get clicked open; classic source snippet may appear",
    },
    {
        "name": "B · async AI Overview only",
        "key": "probe-B-async",
        "params": {"load_async_ai_overview": True},
        "cost": 0.00198 + 0.002,
        "expectation": "AI Overview content plus its reference list may appear",
    },
    {
        "name": "C · both",
        "key": "probe-C-both",
        "params": {"people_also_ask_click_depth": 4, "load_async_ai_overview": True},
        "cost": 0.00198 + 4 * 0.00015 + 0.002,
        "expectation": "Union of A and B",
    },
]


def log(message: str = "") -> None:
    print(message, flush=True)


def paa_elements(response: dict | None) -> list[dict]:
    if not response:
        return []
    found, seen = [], set()
    for node in walk(response.get("tasks")):
        if node.get("type") == "people_also_ask_element" and id(node) not in seen:
            seen.add(id(node))
            found.append(node)
    return found


def collect_sources(element: dict) -> list[dict]:
    """Every source candidate anywhere under this PAA element.

    Field placement is not assumed — any node carrying `url` or `domain` counts.
    That catches AI Overview references, classic expanded elements, and layouts
    we have not seen yet.
    """
    out = []
    for node in walk(element.get("expanded_element")):
        url, domain = node.get("url"), node.get("domain")
        if url or domain:
            out.append(
                {
                    "type": node.get("type") or "(untyped)",
                    "url": url or "",
                    "domain": domain or "",
                }
            )
    return out


def probe(client: Client, combo: dict) -> dict:
    response = client.serp(
        SEED,
        LOCATION_CODE,
        LANGUAGE_CODE,
        cache_key=combo["key"],
        extra_params=combo["params"],
    )
    elements = paa_elements(response)
    detail = []
    for element in elements:
        detail.append(
            {
                "question": element.get("title") or "",
                "types": [
                    n.get("type") or "(untyped)"
                    for n in (element.get("expanded_element") or [])
                    if isinstance(n, dict)
                ],
                "sources": collect_sources(element),
                "async_flag": any(
                    n.get("asynchronous_ai_overview") is True
                    for n in walk(element.get("expanded_element"))
                ),
            }
        )
    with_source = sum(1 for d in detail if d["sources"])
    return {
        "combo": combo,
        "paa_count": len(elements),
        "with_source": with_source,
        "rate": (with_source / len(elements) * 100) if elements else 0.0,
        "detail": detail,
        "file": f"data/raw/{combo['key']}.json",
    }


def render(results: list[dict], client: Client) -> str:
    out: list[str] = []
    add = out.append
    add("# Phase 0 Probe — can we get PAA source data at all?")
    add("")
    add("Baseline run returned 32/32 PAA elements as")
    add("`people_also_ask_ai_overview_expanded_element` with `references: null`")
    add("and `asynchronous_ai_overview: true`. Source URL coverage: **0%**.")
    add("This probe tests whether DataForSEO's paid parameters unlock it.")
    add("")
    add(f"Seed: **{SEED}** · `location_code={LOCATION_CODE}` · `language_code={LANGUAGE_CODE}`")
    add(f"Billable requests: **{client.billable_calls}** · from cache: {client.cache_hits}")
    add("")

    add("## Summary")
    add("")
    add("| Combination | PAA | With source | Rate | Raw file |")
    add("|---|---:|---:|---:|---|")
    for r in results:
        add(
            f"| {r['combo']['name']} | {r['paa_count']} | {r['with_source']} | "
            f"**{r['rate']:.0f}%** | `{r['file']}` |"
        )
    add("")

    best = max(results, key=lambda r: r["rate"]) if results else None
    if best and best["rate"] >= 90:
        add(f"> **SOLVED.** `{best['combo']['name']}` returns source data "
            f"({best['rate']:.0f}%). The core differentiator is implementable.")
    elif best and best["rate"] > 0:
        add(f"> **PARTIAL.** Best is `{best['combo']['name']}` at only "
            f"{best['rate']:.0f}%. Questions without a source must be a separate "
            "bucket, not counted as gaps.")
    else:
        add("> **NO SOURCE DATA AVAILABLE.** No parameter combination returned a")
        add("> source domain or URL. The \"no dedicated page\" definition cannot be")
        add("> implemented from the PAA block. The workable alternative — adopted —")
        add("> is to query each question on its own and read its organic results.")
    add("")

    add("## Per-combination detail")
    add("")
    for r in results:
        combo = r["combo"]
        add(f"### {combo['name']}")
        add("")
        add(f"Parameters: `{json.dumps(combo['params'])}`")
        add(f"Estimated cost: ${combo['cost']:.5f}/request · {combo['expectation']}")
        add("")
        types: dict[str, int] = {}
        async_count = 0
        for d in r["detail"]:
            for t in d["types"]:
                types[t] = types.get(t, 0) + 1
            async_count += 1 if d["async_flag"] else 0
        add("Returned `expanded_element` types:")
        add("")
        for t, n in sorted(types.items(), key=lambda x: -x[1]):
            add(f"- `{t}` x {n}")
        if not types:
            add("- *(no expanded_element at all)*")
        add("")
        add(f"Carrying `asynchronous_ai_overview: true`: {async_count}/{r['paa_count']}")
        add("")
        if r["with_source"]:
            add("| Question | Source type | Domain |")
            add("|---|---|---|")
            for d in r["detail"]:
                for s in d["sources"][:3]:
                    add(f"| {d['question']} | `{s['type']}` | {s['domain'] or '—'} |")
        else:
            add("**No PAA element carried a source URL or domain.**")
        add("")
    return "\n".join(out) + "\n"


def main() -> int:
    sys.stdout.reconfigure(encoding="utf-8", errors="replace")
    parser = argparse.ArgumentParser(description="Phase 0 probe — PAA source parameters")
    parser.add_argument("--dry-run", action="store_true")
    parser.add_argument("--max-requests", type=int, default=5)
    args = parser.parse_args()

    if args.dry_run:
        log("PROBE PLAN (--dry-run — no network calls made)")
        log("-" * 72)
        total = 0.0
        for combo in COMBINATIONS:
            cached = (RAW_DIR / f"{combo['key']}.json").exists()
            total += 0 if cached else combo["cost"]
            state = "CACHED" if cached else f"${combo['cost']:.5f}"
            log(f"  {combo['name']:<28} {json.dumps(combo['params']):<58} {state}")
        log("-" * 72)
        log(f"Seed: {SEED}")
        log(f"Estimated cost: ${total:.5f}")
        return 0

    env = load_dotenv(ROOT / ".env")
    login = env.get("DATAFORSEO_LOGIN") or os.environ.get("DATAFORSEO_LOGIN", "")
    password = env.get("DATAFORSEO_PASSWORD") or os.environ.get("DATAFORSEO_PASSWORD", "")
    if not (login and password):
        log("ERROR: DATAFORSEO_LOGIN / DATAFORSEO_PASSWORD missing from .env")
        return 1

    client = Client(login, password, RAW_DIR, max_requests=args.max_requests)
    results = []
    try:
        for combo in COMBINATIONS:
            log(f"Trying: {combo['name']}  {json.dumps(combo['params'])}")
            result = probe(client, combo)
            results.append(result)
            log(f"   -> {result['paa_count']} PAA · {result['with_source']} with source "
                f"({result['rate']:.0f}%)")
    except BudgetExceeded as e:
        log(f"STOPPED: {e}")
        return 2
    except DataForSEOError as e:
        log(f"API ERROR: {e}")
        return 3

    REPORT_PATH.write_text(render(results, client), encoding="utf-8")
    log("")
    log(f"Report: {REPORT_PATH.relative_to(ROOT)}")
    log(f"Billable: {client.billable_calls} · estimated spend "
        f"${client.estimated_spend:.5f}")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
