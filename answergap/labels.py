"""Human verdicts on gap scores — the labelled data the threshold needs.

WHY THIS EXISTS
---------------
Phase 0.5 measured the gap metric against 14 hand-labelled questions. The best
of 72 candidate rules reached precision 0.20: the one real gap in that sample
was never isolated from the four the metric wrongly flagged. Fourteen labels
cannot settle a threshold, and hand-labelling more is a chore nobody does.

So labelling becomes a by-product of use. Every scored question in the UI asks
"is this really a gap?", and the answer lands here.

APPEND-ONLY, ON PURPOSE
-----------------------
CLAUDE.md records a real data loss on 2026-08-27: a tree was stored as one JSON
document and a re-crawl overwrote a gap score that had been paid for. The lesson
was "rows, not documents — a re-run is an insert and cannot overwrite anything".
Labels are the first place that lesson is applied. Changing your mind writes a
NEW line; nothing is ever rewritten in place, so the history of a judgement
survives and a crash mid-write can lose at most the line being appended.

`current()` collapses the log by taking the last line per (question, language).
A retraction is the label `?`, stored like any other verdict rather than by
deleting a line.

EVERY LINE CARRIES ITS OWN SCORE
--------------------------------
The same rule `gap_score` will follow: a label records the threshold, strategy
and score vector in force when it was given. Change the threshold later and old
labels stay honest — they say what the metric claimed at the time, so they can
still be replayed against a new rule instead of quietly becoming lies.

This is the filesystem backend. The storage migration moves it to a `label`
table; the shape here is already the table's columns.
"""

from __future__ import annotations

import json
import os
import tempfile
from pathlib import Path
from typing import Literal

from answergap import paths
from answergap.text import normalize

ROOT = paths.ROOT
# Append-only, and therefore the last thing that should live on an ephemeral
# container filesystem. Follows ANSWERGAP_DATA_DIR onto a volume.
LABELS_DIR = paths.LABELS_DIR
LABELS_PATH = LABELS_DIR / "labels.jsonl"

Verdict = Literal["G", "N", "?"]
VERDICTS: tuple[str, ...] = ("G", "N", "?")


def key(question: str, language_code: str) -> str:
    """Identity of a labelled question, independent of which tree it sat in.

    The same question turns up under several parents and in several trees. A
    verdict is about the question against its search results, not about the
    branch it was reached through, so the key does not include the tree.
    """
    return f"{language_code}:{normalize(question, language_code)}"


class InvalidLabel(ValueError):
    """The caller passed something that is not a verdict."""


def _line(record: dict) -> str:
    return json.dumps(record, ensure_ascii=False, sort_keys=True)


def record(
    *,
    question: str,
    language_code: str,
    label: str,
    tree_slug: str,
    question_slug: str,
    location_code: int | None = None,
    predicted: str | None = None,
    threshold: float | None = None,
    strategy: str | None = None,
    matching_pages: int | None = None,
    results_checked: int | None = None,
    overlaps: list[float] | None = None,
    created_at: str | None = None,
) -> dict:
    """Append one verdict. Returns the stored row.

    `predicted` and the score fields are what the metric said at the moment of
    labelling. They are stored rather than looked up later because the tree they
    came from is mutable — a re-crawl or a threshold change would otherwise
    rewrite the evidence the label was a reaction to.
    """
    verdict = (label or "").strip().upper()
    if verdict not in VERDICTS:
        raise InvalidLabel(
            f"label must be one of {', '.join(VERDICTS)}, got {label!r}"
        )

    from datetime import datetime, timezone

    row = {
        "key": key(question, language_code),
        "question": question,
        "language_code": language_code,
        "location_code": location_code,
        "label": verdict,
        "tree_slug": tree_slug,
        "question_slug": question_slug,
        "predicted": predicted,
        "threshold": threshold,
        "strategy": strategy,
        "matching_pages": matching_pages,
        "results_checked": results_checked,
        "overlaps": overlaps,
        "created_at": created_at
        or datetime.now(timezone.utc).isoformat(timespec="seconds"),
    }

    LABELS_DIR.mkdir(parents=True, exist_ok=True)
    with LABELS_PATH.open("a", encoding="utf-8", newline="\n") as f:
        f.write(_line(row) + "\n")
    return row


def rows() -> list[dict]:
    """Every verdict ever given, oldest first.

    A malformed line is skipped rather than raising. The log is append-only and
    a half-written final line is the one failure mode it has; losing the whole
    history to it would be the wrong trade.
    """
    if not LABELS_PATH.exists():
        return []
    out: list[dict] = []
    for line in LABELS_PATH.read_text(encoding="utf-8").splitlines():
        line = line.strip()
        if not line:
            continue
        try:
            parsed = json.loads(line)
        except json.JSONDecodeError:
            continue
        if isinstance(parsed, dict) and parsed.get("key"):
            out.append(parsed)
    return out


def current() -> dict[str, dict]:
    """Latest verdict per question key. Retractions (`?`) are dropped."""
    latest: dict[str, dict] = {}
    for row in rows():
        latest[row["key"]] = row
    return {k: v for k, v in latest.items() if v.get("label") in ("G", "N")}


def for_tree(tree: dict) -> dict[str, str]:
    """`question_slug -> verdict` for the questions in one tree.

    Keyed by slug because that is what the UI holds. Resolved through the
    question key, so a verdict given on the same question in another tree shows
    up here too — which is the point: the judgement is about the question.
    """
    language_code = tree.get("language_code") or "en"
    latest = current()
    out: dict[str, str] = {}
    for node in tree.get("nodes", []):
        found = latest.get(key(node["question"], language_code))
        if found:
            out[node["slug"]] = found["label"]
    return out


def counts() -> dict[str, int]:
    """How much labelled data exists. `G`/`N` totals plus the raw line count."""
    latest = current()
    return {
        "gap": sum(1 for r in latest.values() if r["label"] == "G"),
        "not_gap": sum(1 for r in latest.values() if r["label"] == "N"),
        "questions": len(latest),
        "verdicts": len(rows()),
    }


def compact() -> int:
    """Rewrite the log keeping only the latest verdict per question.

    Not called by the product — the history is worth more than the bytes. It
    exists for the storage migration, which wants one row per question to seed
    the `label` table. Writes through a temp file so a crash cannot truncate the
    log to nothing.
    """
    latest: dict[str, dict] = {}
    for row in rows():
        latest[row["key"]] = row
    kept = sorted(latest.values(), key=lambda r: r.get("created_at") or "")
    LABELS_DIR.mkdir(parents=True, exist_ok=True)
    fd, tmp = tempfile.mkstemp(dir=LABELS_DIR, suffix=".jsonl")
    try:
        with os.fdopen(fd, "w", encoding="utf-8", newline="\n") as f:
            for row in kept:
                f.write(_line(row) + "\n")
        os.replace(tmp, LABELS_PATH)
    except BaseException:
        Path(tmp).unlink(missing_ok=True)
        raise
    return len(kept)
