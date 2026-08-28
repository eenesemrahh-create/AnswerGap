#!/usr/bin/env python3
"""Phase 0.5 step 2 — which strategy and threshold match human judgement?

`phase05_collect.py` gathered the data and produced a form. You labeled each
question `G` (gap) or `N` (not a gap) in `data/PHASE05_labels.csv`. This script
tests candidate rules against those labels.

Rule family under test:

    GAP  <=>  number of organic results clearing the threshold <= k

across three matching strategies, six thresholds and four values of k. As a
control it also tests "highest overlap < t" — Phase 0 observed that this is the
wrong metric, and the control turns that observation into a measurement.

WHICH SCORE MATTERS
-------------------
The product claims "nobody answers this question". A false positive — declaring
a gap that is not one — costs trust directly: the user clicks through and finds
a page sitting right there. A false negative is only a missed opportunity. So
PRECISION outranks recall, and ranking reflects that. Both are reported.

Usage:
    python scripts/phase05_evaluate.py
"""

from __future__ import annotations

import csv
import sys
from pathlib import Path

sys.path.insert(0, str(Path(__file__).resolve().parent.parent))

from answergap import labels as label_store  # noqa: E402
from answergap.matching import STRATEGIES, score_results  # noqa: E402
from answergap.text import normalize  # noqa: E402
from answergap.tree import index_raw  # noqa: E402

ROOT = Path(__file__).resolve().parent.parent
RAW_DIR = ROOT / "data" / "raw"
# Verdicts from the UI are about live crawls, whose SERP responses are cached
# here rather than in the Phase 0 archive. Both are indexed so a label can be
# rescored under every strategy, not just replayed at the threshold it was
# given under.
LIVE_SERP_DIR = ROOT / "data" / "live" / "serp"
CSV_PATH = ROOT / "data" / "PHASE05_labels.csv"
REPORT_PATH = ROOT / "data" / "PHASE05_RESULT.md"

THRESHOLDS = [0.5, 0.6, 0.7, 0.8, 0.9, 1.0]
K_VALUES = [0, 1, 2, 3]


def log(message: str = "") -> None:
    print(message, flush=True)


def classify(predicted: list[bool], actual: list[bool]) -> dict:
    tp = sum(1 for p, a in zip(predicted, actual) if p and a)
    fp = sum(1 for p, a in zip(predicted, actual) if p and not a)
    fn = sum(1 for p, a in zip(predicted, actual) if not p and a)
    tn = sum(1 for p, a in zip(predicted, actual) if not p and not a)
    precision = tp / (tp + fp) if (tp + fp) else 0.0
    recall = tp / (tp + fn) if (tp + fn) else 0.0
    f1 = (2 * precision * recall / (precision + recall)) if (precision + recall) else 0.0
    total = tp + fp + fn + tn
    return {
        "tp": tp, "fp": fp, "fn": fn, "tn": tn,
        "precision": precision, "recall": recall, "f1": f1,
        "accuracy": ((tp + tn) / total) if total else 0.0,
    }


def main() -> int:
    sys.stdout.reconfigure(encoding="utf-8", errors="replace")

    if not CSV_PATH.exists():
        log(f"ERROR: {CSV_PATH.relative_to(ROOT)} not found. "
            "Run phase05_collect.py first.")
        return 1

    rows = list(csv.DictReader(CSV_PATH.open(encoding="utf-8", newline="")))
    labeled = [r for r in rows if (r.get("label") or "").strip().upper() in ("G", "N")]
    skipped = len(rows) - len(labeled)

    if not labeled:
        log("No labels entered yet.")
        log("")
        log("  1. Read   : data/PHASE05_LABELING_FORM.md")
        log("  2. Fill in: data/PHASE05_labels.csv  ('label' column: G / N / ?)")
        log("  3. Run    : python scripts/phase05_evaluate.py")
        return 1

    if len(labeled) < 8:
        log(f"WARNING: only {len(labeled)} labels. Results will be very noisy;")
        log("         12-14 labeled questions is the practical minimum.")
        log("")

    # In-product verdicts are merged in on equal terms. The CSV was a one-off
    # hand-labelling round; the thumbs in the UI are the same judgement given
    # while looking at the same evidence, and the whole point of collecting them
    # is that this script reads them. Where both exist for one question the UI
    # wins: it is the later verdict.
    from_ui = 0
    for stored in label_store.current().values():
        question = stored["question"]
        language = stored.get("language_code") or "en"
        key = (normalize(question, language), language)
        replaced = False
        for row in labeled:
            if (normalize(row["question"], row.get("language") or "en"),
                    row.get("language") or "en") == key:
                row["label"] = stored["label"]
                replaced = True
                break
        if not replaced:
            labeled.append({
                "question": question,
                "label": stored["label"],
                "seed": "",
                "language": language,
            })
        from_ui += 1

    index = index_raw(RAW_DIR)
    if LIVE_SERP_DIR.exists():
        # Archive wins a collision: it is the fixed Phase 0 evidence every
        # number in the reports traces back to, and a live re-crawl of the same
        # question would silently move it.
        for key, entry in index_raw(LIVE_SERP_DIR).items():
            index.setdefault(key, entry)

    records = []
    unmatched = []
    for row in labeled:
        question = row["question"]
        language = row.get("language") or "en"
        entry = index.get(normalize(question, language))
        if entry is None:
            # No cached response means no scores to test the rules against.
            # Counting it as an all-zero row would manufacture a gap the metric
            # never claimed, so it is dropped and reported.
            unmatched.append(question)
            continue
        results = entry["results"]
        records.append(
            {
                "question": question,
                "language": language,
                "seed": row.get("seed", ""),
                "actual": row["label"].strip().upper() == "G",
                "results": results,
                "scores": {
                    s: score_results(question, results, language, s) for s in STRATEGIES
                },
            }
        )

    if from_ui:
        log(f"{from_ui} verdict(s) merged in from the UI (data/labels/labels.jsonl)")
    if unmatched:
        log(f"{len(unmatched)} labeled question(s) skipped - no cached SERP response:")
        for question in unmatched[:5]:
            log(f"    {question}")
        log("")

    if not records:
        log("No labeled question has a cached response to score against.")
        return 1

    actual = [r["actual"] for r in records]
    gap_count = sum(actual)
    log(f"{len(records)} labeled: {gap_count} gaps (G), {len(records) - gap_count} not (N)"
        + (f" · {skipped} unlabeled skipped" if skipped else ""))
    log("")

    scored_rules = []
    for strategy in STRATEGIES:
        for threshold in THRESHOLDS:
            for k in K_VALUES:
                predicted = [
                    sum(1 for s in r["scores"][strategy] if s >= threshold) <= k
                    for r in records
                ]
                m = classify(predicted, actual)
                m.update({
                    "family": "count", "strategy": strategy, "threshold": threshold, "k": k,
                    "name": f"{strategy} · pages with overlap>={threshold:.1f} is <= {k}",
                })
                scored_rules.append(m)
        for threshold in THRESHOLDS:
            predicted = [
                (max(r["scores"][strategy]) if r["scores"][strategy] else 0.0) < threshold
                for r in records
            ]
            m = classify(predicted, actual)
            m.update({
                "family": "max", "strategy": strategy, "threshold": threshold, "k": None,
                "name": f"{strategy} · highest overlap < {threshold:.1f}",
            })
            scored_rules.append(m)

    # Precision first — a false positive is the expensive error here.
    scored_rules.sort(key=lambda m: (-m["precision"], -m["recall"], -m["accuracy"]))
    best = scored_rules[0]
    best_f1 = max(scored_rules, key=lambda m: (m["f1"], m["precision"]))

    out: list[str] = []
    add = out.append
    add("# Phase 0.5 Result — gap metric validation")
    add("")
    add(f"Labeled questions: **{len(records)}** "
        f"({gap_count} gap / {len(records) - gap_count} not)")
    if skipped:
        add(f"Unlabeled (`?`) skipped: {skipped}")
    add("")
    add("Rule under test: **gap ⇔ number of results clearing the threshold ≤ k**")
    add("")
    add("A false positive (claiming a gap that is not one) damages trust directly;")
    add("a false negative is only a missed opportunity. Ranking is by **precision**.")
    add("")

    if len(records) < 12:
        add("> **SMALL SAMPLE WARNING.** These numbers indicate direction; they do")
        add("> not settle the threshold. Repeat with 40-50 questions before shipping.")
        add("")

    add("## Best rules (by precision)")
    add("")
    add("| Rule | Precision | Recall | F1 | Accuracy | TP | FP | FN | TN |")
    add("|---|---:|---:|---:|---:|---:|---:|---:|---:|")
    for m in scored_rules[:8]:
        add(f"| {m['name']} | **{m['precision']:.2f}** | {m['recall']:.2f} | "
            f"{m['f1']:.2f} | {m['accuracy']:.2f} | {m['tp']} | {m['fp']} | "
            f"{m['fn']} | {m['tn']} |")
    add("")
    add(f"**Highest F1:** {best_f1['name']} "
        f"(F1 {best_f1['f1']:.2f}, precision {best_f1['precision']:.2f})")
    add("")

    add("## Strategy comparison")
    add("")
    add("Best achievable F1 per matching strategy — this is what tells you whether")
    add("synonym handling actually earns its keep.")
    add("")
    add("| Strategy | Best F1 | Its precision | Rule |")
    add("|---|---:|---:|---|")
    for strategy in STRATEGIES:
        subset = [m for m in scored_rules if m["strategy"] == strategy]
        b = max(subset, key=lambda m: (m["f1"], m["precision"]))
        add(f"| `{strategy}` | {b['f1']:.2f} | {b['precision']:.2f} | {b['name']} |")
    add("")

    best_count = max((m for m in scored_rules if m["family"] == "count"),
                     key=lambda m: (m["f1"], m["precision"]))
    best_max = max((m for m in scored_rules if m["family"] == "max"),
                   key=lambda m: (m["f1"], m["precision"]))
    add("## Page count vs highest overlap")
    add("")
    add("Phase 0 observed that highest overlap is the wrong metric. Measured:")
    add("")
    add(f"- Page-count family — best F1: **{best_count['f1']:.2f}** ({best_count['name']})")
    add(f"- Highest-overlap family — best F1: **{best_max['f1']:.2f}** ({best_max['name']})")
    add("")
    if best_count["f1"] > best_max["f1"]:
        add("> Phase 0 observation **confirmed**: page count is the better metric.")
    elif best_count["f1"] < best_max["f1"]:
        add("> Phase 0 observation **contradicted** on this data. Sample is small —")
        add("> re-check before acting on it.")
    else:
        add("> Tied; this sample cannot separate them.")
    add("")

    def predict(record: dict, rule: dict) -> bool:
        scores = record["scores"][rule["strategy"]]
        if rule["family"] == "count":
            return sum(1 for s in scores if s >= rule["threshold"]) <= rule["k"]
        return (max(scores) if scores else 0.0) < rule["threshold"]

    add("## Per-question detail")
    add("")
    add(f"Using the top rule (`{best['name']}`).")
    add("")
    add("| Question | Lang | You | Rule | Verdict | ≥thr | Highest |")
    add("|---|---|---|---|---|---:|---:|")
    for record in records:
        scores = record["scores"][best["strategy"]]
        predicted = predict(record, best)
        clearing = sum(1 for s in scores if s >= best["threshold"])
        mark = "ok" if predicted == record["actual"] else ("**FP**" if predicted else "**FN**")
        add(f"| {record['question']} | {record['language']} | "
            f"{'G' if record['actual'] else 'N'} | {'G' if predicted else 'N'} | "
            f"{mark} | {clearing} | {(max(scores) if scores else 0.0):.2f} |")
    add("")
    add("FP = false positive (called a gap that is not) · FN = missed a real gap")
    add("")

    wrong = [r for r in records if predict(r, best) != r["actual"]]
    if wrong:
        add("### Where the metric was wrong")
        add("")
        add("Reading these one by one tells you what to add to the synonym classes.")
        add("")
        for record in wrong:
            scores = record["scores"][best["strategy"]]
            add(f"**{record['question']}** — you said "
                f"`{'G' if record['actual'] else 'N'}`")
            add("")
            for result, score in sorted(
                zip(record["results"], scores), key=lambda p: -p[1]
            )[:4]:
                add(f"- `{score:.2f}` {result['domain']} — {result['title']}")
            add("")

    add("## Next")
    add("")
    add("1. Read the \"where the metric was wrong\" list above.")
    add("2. If a miss is a synonym problem, add the word to the right language")
    add("   pack in `answergap/languages.py` and re-run this script "
        "(**no API cost** — the data is on disk).")
    add("3. If precision stays under 0.85, lexical matching is not enough and")
    add("   embedding-based similarity should be tried.")
    add("4. Once settled, write the rule into `CLAUDE.md` and set "
        "`tree.THRESHOLD`, then flip `threshold_validated` to true.")
    add("")

    REPORT_PATH.write_text("\n".join(out) + "\n", encoding="utf-8")

    log(f"Best rule : {best['name']}")
    log(f"  precision {best['precision']:.2f} · recall {best['recall']:.2f} "
        f"· F1 {best['f1']:.2f}")
    log(f"Report    : {REPORT_PATH.relative_to(ROOT)}")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
