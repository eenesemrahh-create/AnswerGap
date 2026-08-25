#!/usr/bin/env python3
"""Fetch the country list Google/DataForSEO can target. FREE — no credit spent.

The full locations endpoint returns every location Google targets, cities and
regions included, which is tens of megabytes. We only need countries, so this
downloads once, filters, writes a small file, and deletes the bulky cache.

CLAUDE.md: DataForSEO `location_code` values ARE Google Geo Target IDs, so the
same number works against the Google Ads API too. No mapping table needed.

Usage:
    python scripts/fetch_countries.py
"""

from __future__ import annotations

import json
import os
import sys
from pathlib import Path

sys.path.insert(0, str(Path(__file__).resolve().parent.parent))

from answergap.dataforseo import Client, DataForSEOError, load_dotenv  # noqa: E402
from answergap.languages import LANGUAGES  # noqa: E402

ROOT = Path(__file__).resolve().parent.parent
RAW_DIR = ROOT / "data" / "raw"
OUT_PATH = ROOT / "data" / "locations" / "countries.json"

# Markets surfaced first in the picker. Everything else stays available, just
# further down the list.
PRIORITY = ["United States", "United Kingdom", "Canada", "Australia", "Germany",
            "France", "Spain", "Türkiye", "Turkey", "Netherlands", "Italy"]


def main() -> int:
    sys.stdout.reconfigure(encoding="utf-8", errors="replace")

    env = load_dotenv(ROOT / ".env")
    login = env.get("DATAFORSEO_LOGIN") or os.environ.get("DATAFORSEO_LOGIN", "")
    password = env.get("DATAFORSEO_PASSWORD") or os.environ.get("DATAFORSEO_PASSWORD", "")
    if not (login and password):
        print("ERROR: DATAFORSEO_LOGIN / DATAFORSEO_PASSWORD missing from .env")
        return 1

    client = Client(login, password, RAW_DIR, max_requests=0)
    print("Fetching full location list (free, may take a moment)...")
    try:
        data = client.locations()
    except DataForSEOError as e:
        print(f"API ERROR: {e}")
        return 2

    countries = []
    for task in data.get("tasks") or []:
        for item in task.get("result") or []:
            if (item.get("location_type") or "").lower() != "country":
                continue
            code = item.get("location_code")
            name = item.get("location_name")
            if not isinstance(code, int) or not name:
                continue
            countries.append(
                {
                    "code": code,
                    "name": name,
                    "iso": item.get("country_iso_code") or "",
                    "languages": [
                        lang.get("language_code")
                        for lang in (item.get("available_languages") or [])
                        if lang.get("language_code")
                    ],
                }
            )

    # Priority markets first, then alphabetical.
    rank = {name: i for i, name in enumerate(PRIORITY)}
    countries.sort(key=lambda c: (rank.get(c["name"], len(PRIORITY)), c["name"]))

    OUT_PATH.parent.mkdir(parents=True, exist_ok=True)
    OUT_PATH.write_text(
        json.dumps(countries, ensure_ascii=False, indent=2), encoding="utf-8"
    )

    # Drop the multi-megabyte cache; the filtered file is what we keep.
    bulk = RAW_DIR / "locations-all.json"
    bulk_mb = bulk.stat().st_size / 1_048_576 if bulk.exists() else 0
    if bulk.exists():
        bulk.unlink()

    print(f"{len(countries)} countries -> {OUT_PATH.relative_to(ROOT)}")
    print(f"Discarded {bulk_mb:.1f} MB raw cache")
    print()
    ui = {c["name"] for c in countries}
    print("UI languages available:", ", ".join(sorted(LANGUAGES)))
    for name in PRIORITY[:6]:
        match = next((c for c in countries if c["name"] == name), None)
        if match:
            print(f"  {match['name']:<18} code={match['code']:<8} "
                  f"languages={len(match['languages'])}")
    _ = ui
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
