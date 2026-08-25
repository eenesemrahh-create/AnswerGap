#!/usr/bin/env python3
"""Phase 0 — validate the assumptions CLAUDE.md flagged as unverified.

NOT PRODUCT CODE. A one-off measurement whose findings are already recorded in
CLAUDE.md; kept because the numbers should be reproducible and because the same
questions must be re-asked for every new market.

  Q1  How many PAA questions does a seed return?
  Q2  What is the branching factor? (the cost model assumed 8)
  Q3  Does the PAA response carry a source domain?  <- the product depends on this
  Q4  Do city-level results differ from country-level?
  Q5  Same query twice — does the set move, or only the order?
  Q6  Is plain normalization enough for deduplication? (no extra API cost)

Results for Turkish (2026-08): 4 · 4.00 · no (0%) · no (Jaccard 1.000) ·
stable · yes. See CLAUDE.md. These were measured in TURKISH and must be
re-measured per market.

Usage:
    python scripts/phase0_validate.py --dry-run
    python scripts/phase0_validate.py --seed "teeth whitening" --location 2840 --language en
"""

from __future__ import annotations

import argparse
import os
import statistics
import sys
from pathlib import Path

sys.path.insert(0, str(Path(__file__).resolve().parent.parent))

from answergap.dataforseo import (  # noqa: E402
    LIVE_COST_PER_REQUEST,
    BudgetExceeded,
    Client,
    DataForSEOError,
    extract_paa,
    load_dotenv,
    paa_source,
    slugify,
)
from answergap.languages import get as get_language  # noqa: E402
from answergap.text import fold_all, jaccard, normalize, stem_all, tokens  # noqa: E402

ROOT = Path(__file__).resolve().parent.parent
RAW_DIR = ROOT / "data" / "raw"
REPORT_PATH = ROOT / "data" / "PHASE0_REPORT.md"

DEFAULT_SEEDS = [
    ("diş beyazlatma", "commercial / competitive"),
    ("kredi notu nasıl yükseltilir", "informational / long tail"),
]
EXPAND_COUNT = 4


def log(message: str = "") -> None:
    print(message, flush=True)


def questions_of(response: dict | None) -> list[str]:
    return [e.get("title") or "" for e in extract_paa(response or {})]


def source_field_stats(elements: list[dict]) -> dict:
    """Q3: how often are the expanded_element fields actually populated?"""
    fields = ["url", "domain", "title", "featured_title", "description"]
    counts = {f: 0 for f in fields}
    missing_expanded = 0
    for element in elements:
        source = paa_source(element)
        if source["expanded_count"] == 0:
            missing_expanded += 1
        for field in fields:
            if source[field]:
                counts[field] += 1
    total = len(elements)
    return {
        "total": total,
        "counts": counts,
        "pct": {f: (counts[f] / total * 100 if total else 0.0) for f in fields},
        "missing_expanded": missing_expanded,
    }


def set_and_order_diff(a: list[str], b: list[str], language: str) -> dict:
    """Q4/Q5: compare two question lists as a SET and as an ORDER, separately.

    CLAUDE.md: "order changes are noise, DO NOT notify". Keeping the two apart is
    the whole point — conflating them floods users with fake notifications.
    """
    na = [normalize(q, language) for q in a if normalize(q, language)]
    nb = [normalize(q, language) for q in b if normalize(q, language)]
    sa, sb = set(na), set(nb)
    common = sa & sb
    rank_a = {q: i for i, q in enumerate(na)}
    rank_b = {q: i for i, q in enumerate(nb)}
    moved = sum(1 for q in common if rank_a.get(q) != rank_b.get(q))
    return {
        "a_count": len(na), "b_count": len(nb),
        "jaccard": jaccard(sa, sb), "common": len(common),
        "only_a": sorted(sa - sb), "only_b": sorted(sb - sa),
        "moved": moved,
        "moved_ratio": (moved / len(common) if common else 0.0),
    }


def near_duplicates(questions: list[str], language: str, threshold: float = 0.8) -> list[dict]:
    """Q6: pairs that plain normalization treats as distinct but which are not.

    Three buckets, because they need three different fixes:
      fold  — identical once accents are folded. Cheapest possible fix.
      stem  — same stem, different inflection. Needs a real stemmer.
      fuzzy — high overlap but not identical. Needs a human.
    """
    lang = get_language(language)
    unique: dict[str, str] = {}
    for q in questions:
        key = normalize(q, lang)
        if key:
            unique.setdefault(key, q)

    keys = list(unique)
    folded = {k: fold_all(set(k.split()), lang) for k in keys}
    stemmed = {k: stem_all(set(k.split()), lang) for k in keys}

    pairs: list[dict] = []
    for i in range(len(keys)):
        for j in range(i + 1, len(keys)):
            ka, kb = keys[i], keys[j]
            if folded[ka] == folded[kb]:
                kind, similarity = "fold", 1.0
            elif stemmed[ka] == stemmed[kb]:
                kind, similarity = "stem", 1.0
            else:
                similarity = jaccard(stemmed[ka], stemmed[kb])
                if similarity < threshold:
                    continue
                kind = "fuzzy"
            pairs.append({"a": unique[ka], "b": unique[kb],
                          "similarity": similarity, "kind": kind})
    order = {"fold": 0, "stem": 1, "fuzzy": 2}
    pairs.sort(key=lambda p: (order[p["kind"]], -p["similarity"]))
    return pairs


def find_city(locations: dict | None, name: str) -> tuple[int | None, str]:
    if not locations:
        return None, "(no locations data)"
    for task in locations.get("tasks") or []:
        for item in task.get("result") or []:
            location_name = item.get("location_name") or ""
            if name.lower() in location_name.lower() and (
                item.get("location_type") or ""
            ).lower() == "city":
                code = item.get("location_code")
                if isinstance(code, int):
                    return code, location_name
    return None, f"(no city matching {name!r})"


def verify_country(locations: dict | None, code: int) -> str:
    if not locations:
        return "unverified (no locations data)"
    for task in locations.get("tasks") or []:
        for item in task.get("result") or []:
            if item.get("location_code") == code:
                return f"{item.get('location_name')} ({item.get('location_type')})"
    return f"{code} not present in list — INVESTIGATE"


def run(client: Client, seeds, location_code, language_code, country_iso, city_name) -> dict:
    findings: dict = {"location_code": location_code, "language_code": language_code}

    log("[1/6] Fetching location codes (free)...")
    locations = client.locations(country_iso)
    findings["country_check"] = verify_country(locations, location_code)
    city_code, city_label = find_city(locations, city_name)
    findings["city_code"] = city_code
    findings["city_label"] = city_label
    log(f"      location_code={location_code} -> {findings['country_check']}")
    log(f"      {city_name} -> {city_code} ({city_label})")

    log(f"[2/6] Querying {len(seeds)} seeds (Q1, Q3)...")
    seed_results = []
    for keyword, kind in seeds:
        response = client.serp(keyword, location_code, language_code)
        elements = extract_paa(response or {})
        seed_results.append({
            "seed": keyword, "kind": kind,
            "question_count": len(elements),
            "questions": questions_of(response),
            "sources": source_field_stats(elements),
            "file": f"serp-{location_code}-{language_code}-{slugify(keyword)}.json",
        })
        log(f'      "{keyword}" -> {len(elements)} PAA questions')
    findings["seeds"] = seed_results
    first = seed_results[0]

    log(f"[3/6] Measuring branching factor — expanding {EXPAND_COUNT} questions (Q2)...")
    expansions = []
    for question in first["questions"][:EXPAND_COUNT]:
        if not question:
            continue
        response = client.serp(
            question, location_code, language_code,
            cache_key=f"expand-{slugify(question)}",
        )
        children = extract_paa(response or {})
        expansions.append({"question": question, "child_count": len(children),
                           "children": questions_of(response)})
        log(f'      "{question[:52]}" -> {len(children)} children')
    findings["expansions"] = expansions
    counts = [e["child_count"] for e in expansions]
    findings["branching_mean"] = statistics.fmean(counts) if counts else 0.0
    findings["branching_median"] = statistics.median(counts) if counts else 0.0

    log("[4/6] Comparing city vs country (Q4)...")
    if city_code:
        city_response = client.serp(
            first["seed"], city_code, language_code,
            cache_key=f"serp-city-{city_code}-{slugify(first['seed'])}",
        )
        findings["city"] = set_and_order_diff(
            first["questions"], questions_of(city_response), language_code
        )
        findings["city"]["code"] = city_code
        findings["city"]["label"] = city_label
        log(f"      Jaccard = {findings['city']['jaccard']:.3f}")
    else:
        findings["city"] = None
        log("      SKIPPED — no city code found")

    log("[5/6] Stability — same query a second time (Q5)...")
    second = client.serp(
        first["seed"], location_code, language_code,
        cache_key=f"serp-run2-{slugify(first['seed'])}",
    )
    findings["stability"] = set_and_order_diff(
        first["questions"], questions_of(second), language_code
    )
    log(f"      set Jaccard = {findings['stability']['jaccard']:.3f} · "
        f"moved = {findings['stability']['moved']}")

    log("[6/6] Deduplication quality (Q6, free)...")
    all_questions: list[str] = []
    for s in seed_results:
        all_questions += s["questions"]
    for e in expansions:
        all_questions += e["children"]
    findings["total_questions"] = len(all_questions)
    findings["unique_questions"] = len(
        {normalize(q, language_code) for q in all_questions if normalize(q, language_code)}
    )
    findings["near_duplicates"] = near_duplicates(all_questions, language_code)
    log(f"      {findings['total_questions']} questions -> "
        f"{findings['unique_questions']} unique · "
        f"{len(findings['near_duplicates'])} near-duplicate pairs")
    return findings


def render(findings: dict, client: Client) -> str:
    out: list[str] = []
    add = out.append
    language = findings["language_code"]

    add("# Phase 0 Report — DataForSEO PAA validation")
    add("")
    add("Generated by `scripts/phase0_validate.py`. Every number traces to a raw")
    add("JSON file under `data/raw/` — evidence, not assertion.")
    add("")
    add(f"- Market: `location_code={findings['location_code']}` · "
        f"`language_code={language}` ({findings['country_check']})")
    add(f"- Billable requests: **{client.billable_calls}** · "
        f"from cache: {client.cache_hits}")
    add(f"- Estimated spend: **${client.estimated_spend:.4f}** (Live Advanced)")
    add("")
    add("> **These results are language- and market-specific.** Every new market")
    add("> needs its own run — branching factor, dedup quality and PAA behaviour")
    add("> all vary by language.")
    add("")

    add("## Q1 — How many PAA questions per seed?")
    add("")
    add("| Seed | Kind | Root PAA questions | Raw file |")
    add("|---|---|---:|---|")
    for s in findings["seeds"]:
        add(f"| {s['seed']} | {s['kind']} | **{s['question_count']}** | "
            f"`data/raw/{s['file']}` |")
    counts = [s["question_count"] for s in findings["seeds"]]
    add("")
    if counts:
        add(f"Mean: **{statistics.fmean(counts):.1f}** root questions per seed.")
        if min(counts) == 0:
            add("")
            add("> **WARNING:** a seed returned no PAA block at all. That is itself a")
            add("> finding — the product cannot create value in that niche.")
    add("")

    add("## Q2 — Branching factor")
    add("")
    add("The original cost model assumed **8** (depth 2 ≈ 73 nodes).")
    add("")
    add("| Expanded question | Children |")
    add("|---|---:|")
    for e in findings["expansions"]:
        add(f"| {e['question']} | {e['child_count']} |")
    add("")
    branching = findings["branching_mean"]
    add(f"**Measured: {branching:.2f}** (median {findings['branching_median']:.1f})")
    add("")
    if branching > 0:
        d2 = 1 + branching + branching**2
        d3 = d2 + branching**3
        add("| Depth | Nodes | Original assumption |")
        add("|---|---:|---:|")
        add(f"| 2 | ~{d2:.0f} | ~73 |")
        add(f"| 3 | ~{d3:.0f} | ~585 |")
        add("")
        if abs(branching - 8) > 1.5:
            add("> **The cost table in CLAUDE.md must be rewritten with this number.**")
        else:
            add("> Close to the assumption; the cost table stands.")
    add("")

    add("## Q3 — Does the PAA response carry a source? *(the core question)*")
    add("")
    add("The gap definition is \"no dedicated page\", which depends entirely on")
    add("`url` / `title` / `domain` inside `expanded_element`.")
    add("")
    add("| Seed | PAA | url | domain | title | featured | description | no expanded |")
    add("|---|---:|---:|---:|---:|---:|---:|---:|")
    for s in findings["seeds"]:
        stats, pct = s["sources"], s["sources"]["pct"]
        add(f"| {s['seed']} | {stats['total']} | {pct['url']:.0f}% | "
            f"{pct['domain']:.0f}% | {pct['title']:.0f}% | "
            f"{pct['featured_title']:.0f}% | {pct['description']:.0f}% | "
            f"{stats['missing_expanded']} |")
    add("")
    total = sum(s["sources"]["total"] for s in findings["seeds"])
    with_url = sum(s["sources"]["counts"]["url"] for s in findings["seeds"])
    rate = (with_url / total * 100) if total else 0.0
    add(f"**Overall: {with_url}/{total} PAA elements carry a source URL ({rate:.1f}%).**")
    add("")
    if rate >= 90:
        add("> **PASS.** The differentiator is implementable straight from PAA.")
    elif rate >= 50:
        add("> **PARTIAL.** Gap scoring is possible with a confidence caveat;")
        add("> source-less questions must be a separate bucket.")
    else:
        add("> **FAIL.** \"No dedicated page\" cannot be computed from the PAA block.")
        add("> Adopted alternative: query each question separately and read its own")
        add("> organic results. Costs one extra request per analysed question.")
    add("")

    add("## Q4 — Do city results differ from country results?")
    add("")
    city = findings.get("city")
    if not city:
        add("**Not measured** — no city code found.")
    else:
        add(f"`{findings['location_code']}` vs `{city['code']}` ({city['label']}), "
            f"seed *{findings['seeds'][0]['seed']}*")
        add("")
        add(f"- Country: {city['a_count']} questions · City: {city['b_count']}")
        add(f"- Shared: {city['common']} · **Jaccard: {city['jaccard']:.3f}**")
        add("")
        if city["only_b"]:
            add("Questions that appeared only in the city query:")
            add("")
            for q in city["only_b"][:10]:
                add(f"- {q}")
            add("")
        if city["jaccard"] > 0.90:
            add("> **DO NOT BUILD THE FEATURE.** Results are effectively identical.")
            add("> City targeting would split the cache pool 81 ways for zero gain.")
        else:
            add("> **The feature is real.** City results differ meaningfully.")
    add("")

    add("## Q5 — Same query twice: does the set move, or the order?")
    add("")
    stability = findings["stability"]
    add(f"- Run 1: {stability['a_count']} questions · Run 2: {stability['b_count']}")
    add(f"- **Set Jaccard: {stability['jaccard']:.3f}** ({stability['common']} shared)")
    add(f"- **Reordered: {stability['moved']}/{stability['common']} "
        f"({stability['moved_ratio'] * 100:.0f}%)**")
    add("")
    if stability["jaccard"] >= 0.9 and stability["moved_ratio"] > 0.1:
        add("> **Diff rule confirmed.** The set is stable, the order moves. CLAUDE.md's")
        add("> \"order change is noise, do not notify\" is backed by measurement.")
    elif stability["jaccard"] >= 0.9:
        add("> Both set and order held. TTLs can be generous. Re-measure at different")
        add("> times of day before concluding.")
    else:
        add("> **THE SET MOVES.** Back-to-back identical queries return different")
        add("> questions, so \"new question\" alerts would be full of false positives.")
        add("> Require confirmation across two consecutive crawls before notifying.")
    add("")

    add("## Q6 — Is plain normalization enough for deduplication?")
    add("")
    add(f"- Questions collected: **{findings['total_questions']}**")
    add(f"- Unique after `normalize()`: **{findings['unique_questions']}**")
    exact = findings["total_questions"] - findings["unique_questions"]
    add(f"- Exact duplicates caught: {exact}")
    pairs = findings["near_duplicates"]
    fold_pairs = [p for p in pairs if p["kind"] == "fold"]
    stem_pairs = [p for p in pairs if p["kind"] == "stem"]
    fuzzy_pairs = [p for p in pairs if p["kind"] == "fuzzy"]
    add(f"- **Near-duplicates missed: {len(pairs)}** ({len(fold_pairs)} accent · "
        f"{len(stem_pairs)} inflection · {len(fuzzy_pairs)} unclear)")
    add("")
    for title, bucket, note in (
        ("Bucket 1 — fixed by accent folding *(cheap)*", fold_pairs,
         "Identical once accents are folded. No stemmer needed."),
        ("Bucket 2 — needs a stemmer *(expensive)*", stem_pairs,
         "Same stem, different inflection."),
        ("Bucket 3 — unclear, needs a human", fuzzy_pairs,
         "High overlap but not decidable automatically."),
    ):
        if not bucket:
            continue
        add(f"### {title}")
        add("")
        add(note)
        add("")
        add("| Question A | Question B |")
        add("|---|---|")
        for p in bucket[:10]:
            add(f"| {p['a']} | {p['b']} |")
        add("")
    if stem_pairs:
        add("> **A stemmer is required for this language.** Each missed pair is a")
        add("> wasted SERP request — money, directly. Truncation-based detection is")
        add("> crude, so eyeball the table before adopting a real stemmer.")
    elif fold_pairs:
        add("> **Accent folding is enough.** Every miss is an accent variant. A")
        add("> stemming library is not justified yet.")
    else:
        add("> Plain normalization sufficed on this sample. A stemmer can wait;")
        add("> the sample is small, so this is not settled.")
    add("")

    add("## Raw data")
    add("")
    if RAW_DIR.exists():
        for f in sorted(RAW_DIR.glob("*.json")):
            add(f"- `data/raw/{f.name}` ({f.stat().st_size // 1024} KB)")
    add("")
    return "\n".join(out) + "\n"


def main() -> int:
    sys.stdout.reconfigure(encoding="utf-8", errors="replace")
    parser = argparse.ArgumentParser(description="Phase 0 — DataForSEO PAA validation")
    parser.add_argument("--dry-run", action="store_true")
    parser.add_argument("--max-requests", type=int, default=20)
    parser.add_argument("--seed", action="append", help="Seed keyword (repeatable)")
    parser.add_argument("--location", type=int, default=2792, help="location_code")
    parser.add_argument("--language", default="tr", help="language_code")
    parser.add_argument("--country-iso", default="TR", help="ISO code for the locations call")
    parser.add_argument("--city", default="Istanbul", help="City to compare against")
    args = parser.parse_args()

    seeds = [(s, "user supplied") for s in args.seed] if args.seed else DEFAULT_SEEDS

    if args.dry_run:
        billable = len(seeds) + EXPAND_COUNT + 2
        log("REQUEST PLAN (--dry-run — no network calls made)")
        log("-" * 72)
        log(f" 1. GET locations/{args.country_iso}".ljust(62) + "FREE")
        n = 1
        for keyword, kind in seeds:
            n += 1
            log(f"{n:2}. \"{keyword}\"  [{kind}]".ljust(62)
                + f"${LIVE_COST_PER_REQUEST:.4f}")
        for i in range(EXPAND_COUNT):
            n += 1
            log(f"{n:2}. <seed-1 PAA question {i + 1}>  [Q2]".ljust(62)
                + f"${LIVE_COST_PER_REQUEST:.4f}")
        log(f"{n + 1:2}. \"{seeds[0][0]}\" @ {args.city}  [Q4]".ljust(62)
            + f"${LIVE_COST_PER_REQUEST:.4f}")
        log(f"{n + 2:2}. \"{seeds[0][0]}\" second run  [Q5]".ljust(62)
            + f"${LIVE_COST_PER_REQUEST:.4f}")
        log("-" * 72)
        log(f"Billable: {billable} · estimated "
            f"${billable * LIVE_COST_PER_REQUEST:.4f}")
        cached = len(list(RAW_DIR.glob("*.json"))) if RAW_DIR.exists() else 0
        log(f"Already cached: {cached} files (those cost nothing)")
        return 0

    env = load_dotenv(ROOT / ".env")
    login = env.get("DATAFORSEO_LOGIN") or os.environ.get("DATAFORSEO_LOGIN", "")
    password = env.get("DATAFORSEO_PASSWORD") or os.environ.get("DATAFORSEO_PASSWORD", "")
    if not (login and password):
        log("ERROR: DataForSEO credentials not found.")
        log("")
        log("  cp .env.example .env")
        log("  # then fill in DATAFORSEO_LOGIN and DATAFORSEO_PASSWORD")
        log("")
        log("The password is the API password, not your account password:")
        log("  https://app.dataforseo.com/api-access")
        return 1

    client = Client(login, password, RAW_DIR, max_requests=args.max_requests)
    log(f"Phase 0 validation — market {args.location}/{args.language}")
    log(f"Ceiling: {args.max_requests} billable requests "
        f"(~${args.max_requests * LIVE_COST_PER_REQUEST:.4f})")
    log("")

    try:
        findings = run(
            client, seeds, args.location, args.language, args.country_iso, args.city
        )
    except BudgetExceeded as e:
        log(f"\nSTOPPED: {e}")
        return 2
    except DataForSEOError as e:
        log(f"\nAPI ERROR: {e}")
        log("\nNo report written — a report from partial data would mislead.")
        return 3

    REPORT_PATH.write_text(render(findings, client), encoding="utf-8")
    log("")
    log(f"Report written: {REPORT_PATH.relative_to(ROOT)}")
    log(f"Billable: {client.billable_calls} · from cache: {client.cache_hits}")
    log(f"Estimated spend: ${client.estimated_spend:.4f}")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
