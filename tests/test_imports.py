"""Every module imports on its own.

A circular import is invisible until something picks the wrong module to load
first. `db` imports `tree` for one helper, `tree` imports `dataforseo`, and
`dataforseo` imports `db` - a ring that resolves silently when `db` happens to
be first and raises `ImportError: cannot import name 'extract_paa' from
partially initialized module` when `dataforseo` is.

Introduced on 2026-09-23 and found on 2026-09-24 only because a new test file
imported `answergap.dataforseo` before anything else. Every existing test and
`api/main.py` import `db` first, so the whole suite stayed green over a broken
package. That is exactly the kind of bug a test should not need luck to find.

Each module is imported in a SUBPROCESS with an empty module cache, because
`import x` inside this process would be answered from `sys.modules` by
whatever a previous test already pulled in - which is the luck this file
exists to remove.
"""

from __future__ import annotations

import subprocess
import sys
from pathlib import Path

import pytest

ROOT = Path(__file__).resolve().parents[1]

MODULES = [
    "answergap.dataforseo",
    "answergap.db",
    "answergap.gate",
    "answergap.labels",
    "answergap.languages",
    "answergap.live",
    "answergap.mailer",
    "answergap.matching",
    "answergap.paths",
    "answergap.pricing_seed",
    "answergap.text",
    "answergap.tree",
    "api.main",
]


@pytest.mark.parametrize("module", MODULES)
def test_module_imports_first(module: str) -> None:
    done = subprocess.run(
        [sys.executable, "-c", f"import {module}"],
        cwd=ROOT,
        capture_output=True,
        text=True,
    )
    assert done.returncode == 0, (
        f"`import {module}` fails when it is the FIRST thing imported:\n"
        f"{done.stderr[-1500:]}"
    )
