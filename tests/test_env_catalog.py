"""Every environment variable the code reads is on the admin's Variables page.

The page is `admin/lib/env-catalog.ts`. A variable that is read but not
listed there is a setting the operator cannot find out about, so this fails
until its line is written - in the same change that adds the variable.
"""

from __future__ import annotations

import re
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
CATALOG = (ROOT / "admin/lib/env-catalog.ts").read_text(encoding="utf-8")
LISTED = set(re.findall(r'name: "([A-Z][A-Z0-9_]+)"', CATALOG))

PY_READ = re.compile(
    r'os\.(?:environ(?:\.get)?\(\s*|environ\[|getenv\(\s*)"([A-Z][A-Z0-9_]+)"', re.S)
JS_READ = re.compile(r"process\.env\.([A-Z][A-Z0-9_]+)")
# Set by the platform or the toolchain, not by the operator.
NOT_OURS = {"NODE_ENV", "PORT"}


def _read(pattern: re.Pattern, roots: list[str], suffixes: tuple[str, ...]) -> dict[str, str]:
    found: dict[str, str] = {}
    for root in roots:
        for path in (ROOT / root).rglob("*"):
            if path.suffix not in suffixes or "node_modules" in path.parts or ".next" in path.parts:
                continue
            for name in pattern.findall(path.read_text(encoding="utf-8", errors="ignore")):
                found.setdefault(name, str(path.relative_to(ROOT)))
    return found


def test_every_api_variable_is_on_the_page() -> None:
    read = _read(PY_READ, ["api", "answergap"], (".py",))
    missing = {n: where for n, where in read.items() if n not in LISTED}
    assert not missing, f"add these to admin/lib/env-catalog.ts: {missing}"


def test_every_web_and_admin_variable_is_on_the_page() -> None:
    read = _read(JS_READ, ["web/app", "web/lib", "web/components", "web/content",
                           "admin/app", "admin/lib"], (".ts", ".tsx"))
    missing = {n: w for n, w in read.items() if n not in LISTED and n not in NOT_OURS}
    assert not missing, f"add these to admin/lib/env-catalog.ts: {missing}"


def test_the_page_lists_nothing_twice() -> None:
    names = re.findall(r'name: "([A-Z][A-Z0-9_]+)"', CATALOG)
    assert len(names) == len(set(names))
