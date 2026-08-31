"""Where mutable state lives on disk.

`data/raw/` is the Phase 0 archive: it ships inside the repository, is read-only
at runtime, and is resolved from the source tree like any other checked-in
asset. The two directories the product *writes* — `data/live/` (the paid SERP
cache and the crawled trees) and `data/labels/` (the append-only verdict log) —
are different, and this module exists to say so.

On a laptop they sit next to `data/raw/` and nothing needs configuring. On a
container they must not: Railway and every platform like it give a service an
ephemeral filesystem, so a redeploy would silently delete SERP responses that
cost real money and a label log CLAUDE.md calls append-only. Point
`ANSWERGAP_DATA_DIR` at a mounted volume and both move there together.

This is a deployment stopgap, not the storage layer. CLAUDE.md's next step is
Postgres plus object storage; until then, a volume is what keeps the evidence.
"""

from __future__ import annotations

import os
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent

# The archive. Read-only, versioned, never relocated.
RAW_DIR = ROOT / "data" / "raw"

# Everything written at runtime. One override for both, so a volume cannot be
# mounted for one and forgotten for the other.
STATE_DIR = Path(os.environ.get("ANSWERGAP_DATA_DIR") or (ROOT / "data"))

LIVE_DIR = STATE_DIR / "live"
LABELS_DIR = STATE_DIR / "labels"
