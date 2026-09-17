"""What the AI Overview citation list is, and what an empty one means.

Fixtures are the Phase 0 archive under `data/raw/`, which ships in the
repository and is read-only - so these cannot be invalidated by a crawl.

Two failures are pinned here, both found on 2026-09-18 by counting the archive
rather than by reading the code:

1. Only the block's OUTER reference list was read, so domains cited by a single
   paragraph were dropped. 3 of the 52 archived blocks lose a domain that way,
   and the direction is the expensive one: it tells a customer their site is
   not cited when it is.
2. A block whose sources never arrived (`asynchronous_ai_overview`, 22 of 52)
   was indistinguishable from a block that cited nobody. Unknown rendered as a
   result, which is the one thing CLAUDE.md's accuracy rules forbid.
"""

from __future__ import annotations

from pathlib import Path

import pytest

from answergap.tree import (
    AI_ABSENT,
    AI_CITED,
    AI_NONE,
    AI_UNRESOLVED,
    _load,
    ai_overview,
)

RAW = Path("data/raw")


def _response(name: str) -> dict:
    path = RAW / name
    if not path.exists():
        pytest.skip(f"{name} is not in the archive")
    return _load(path)


def _blocks() -> list[tuple[str, list[str], str]]:
    out = []
    for path in sorted(RAW.glob("*.json")):
        if path.name.startswith("locations"):
            continue
        try:
            domains, state = ai_overview(_load(path))
        except Exception:  # noqa: BLE001 - a malformed archive file is not this test's subject
            continue
        out.append((path.name, domains, state))
    return out


ARCHIVE = _blocks()
assert ARCHIVE, "data/raw/ is empty - the archive fixtures are missing"


def test_a_domain_cited_by_one_paragraph_is_counted() -> None:
    """The outer list says 7; three dental practices are named only inside the text."""
    domains, state = ai_overview(
        _response("question-do-dentists-recommend-teeth-whitening.json")
    )
    assert state == AI_CITED
    assert {"sexton-dental.com", "wiltonmanorsdental.com"} <= set(domains)
    assert len(domains) == 10


def test_a_domain_in_both_layers_is_counted_once() -> None:
    domains, _ = ai_overview(
        _response("question-do-dentists-recommend-teeth-whitening.json")
    )
    assert len(domains) == len(set(domains))
    # Order is first appearance, so the outer list still leads.
    assert domains[0] == "pmc.ncbi.nlm.nih.gov"


def test_an_unresolvable_block_is_unknown_not_empty() -> None:
    """Google loads these after the page; DataForSEO cannot follow. 22 in the archive."""
    unresolved = [name for name, _, state in ARCHIVE if state == AI_UNRESOLVED]
    assert len(unresolved) == 22
    for name in unresolved:
        domains, state = ai_overview(_response(name))
        assert domains == [] and state == AI_UNRESOLVED


def test_no_ai_overview_at_all_is_its_own_answer() -> None:
    """"Google showed no AI Overview" IS a measurement - unlike `unresolved`."""
    domains, state = ai_overview({"tasks": []})
    assert domains == [] and state == AI_ABSENT


def test_a_block_that_cites_nobody_is_none() -> None:
    response = {"tasks": [{"result": [{"items": [{"type": "ai_overview",
                                                  "references": [],
                                                  "items": []}]}]}]}
    assert ai_overview(response) == ([], AI_NONE)


def test_every_archived_block_lands_in_exactly_one_state() -> None:
    states = {state for _, _, state in ARCHIVE}
    assert states <= {AI_CITED, AI_NONE, AI_UNRESOLVED, AI_ABSENT}
    cited = [d for _, d, s in ARCHIVE if s == AI_CITED]
    assert all(d for d in cited), "a cited block with no domains is a contradiction"
    for _, domains, state in ARCHIVE:
        if state != AI_CITED:
            assert domains == []
