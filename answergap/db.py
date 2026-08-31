"""Postgres storage - the tree as edge rows, not a document.

WHY THIS MODULE EXISTS
----------------------
CLAUDE.md records what storing a tree as one JSON document cost on 2026-08-27:
re-running a search rebuilt the document from the fresh PAA response and
destroyed a gap score that had already been paid for. `live._carry_previous`
patches the symptom by carrying scored nodes, harvested nodes and related
searches across a re-crawl - three carries for one document-shaped wound.

The cause was never the filesystem. It was that a tree was a single mutable
value, so writing the new one meant overwriting the old one. Here a crawl is a
`crawl` row plus its `paa_edge` rows: re-crawling INSERTs a new crawl id and
leaves every earlier row untouched. Overwriting is not something the schema can
express, so the bug cannot recur and the three carries become unnecessary.

That same shape is what hands over the diff engine - "what changed since last
week?" becomes a query across two crawl ids - and the "historical PAA data is
our most defensible asset" claim, which a document store quietly makes false
every time it saves.

WHAT IS APPEND-ONLY, AND WHY
----------------------------
`label` and `gap_score` are never updated in place. A re-score or a changed
verdict INSERTs a new row and the newest wins by timestamp. Both carry the
threshold, strategy and embedding model they were produced under - CLAUDE.md's
rule, because a threshold change or a model swap would otherwise turn every old
score into a lie without touching a single byte of it.

WHAT STAYS OUT OF POSTGRES
--------------------------
`data/raw/` does not move. It is the Phase 0 archive: read-only, versioned in
the repository, and the evidence every number in the reports traces back to.
Only live crawls, their SERP payloads and the label log live here.
"""

from __future__ import annotations

import gzip
import json
import os
from contextlib import contextmanager
from typing import Any, Iterator

try:
    import psycopg
    from psycopg.rows import dict_row
except ImportError:  # the filesystem backend is still a supported way to run
    psycopg = None  # type: ignore[assignment]
    dict_row = None  # type: ignore[assignment]


class NotConfigured(RuntimeError):
    """No DATABASE_URL. The caller should fall back to the filesystem."""


def url() -> str | None:
    """Railway injects DATABASE_URL for a linked Postgres service.

    DATABASE_PUBLIC_URL is the proxy address, used when developing against the
    deployed database from a laptop. The private one is preferred when both are
    present: inside Railway it never leaves the internal network.
    """
    return os.environ.get("DATABASE_URL") or os.environ.get("DATABASE_PUBLIC_URL")


def available() -> bool:
    """Whether Postgres is both configured and importable."""
    return bool(url()) and psycopg is not None


@contextmanager
def connect() -> Iterator[Any]:
    dsn = url()
    if not dsn:
        raise NotConfigured("DATABASE_URL is not set.")
    if psycopg is None:
        raise NotConfigured("psycopg is not installed.")
    with psycopg.connect(dsn, row_factory=dict_row) as conn:
        yield conn


# --------------------------------------------------------------- schema

# Applied in order, each exactly once, tracked in `schema_migration`. Never edit
# a statement that has already run anywhere - add a new one instead. This list
# is the migration history, so rewriting it rewrites the past.
MIGRATIONS: list[tuple[str, str]] = [
    (
        "0001_core",
        """
        -- A question, identified the way CLAUDE.md already keys the SERP cache
        -- and the label log: normalized text plus language. The same question
        -- under three parents is ONE row, which is what makes `repeat_count`
        -- countable rather than stored.
        CREATE TABLE IF NOT EXISTS question (
            id              BIGSERIAL PRIMARY KEY,
            language_code   TEXT NOT NULL,
            normalized      TEXT NOT NULL,
            text            TEXT NOT NULL,
            -- Reserved for the embedding settled on 2026-08-28. Left NULL, and
            -- deliberately not a pgvector column: the extension is not enabled
            -- yet, and a plain BYTEA can hold the vector until the evaluation
            -- picks a model. `embedding_model` is what stops a model swap from
            -- silently reinterpreting old vectors.
            embedding       BYTEA,
            embedding_model TEXT,
            first_seen      TIMESTAMPTZ NOT NULL DEFAULT now(),
            UNIQUE (language_code, normalized)
        );

        -- One crawl = one user search. The unit a re-crawl creates ANEW rather
        -- than overwrites; this row is why the 2026-08-27 bug cannot recur.
        CREATE TABLE IF NOT EXISTS crawl (
            id             BIGSERIAL PRIMARY KEY,
            slug           TEXT NOT NULL,
            seed           TEXT NOT NULL,
            seed_question  BIGINT NOT NULL REFERENCES question(id),
            language_code  TEXT NOT NULL,
            location_code  INTEGER NOT NULL,
            source         TEXT NOT NULL DEFAULT 'live',
            billable_calls INTEGER NOT NULL DEFAULT 0,
            spend          NUMERIC(12, 6) NOT NULL DEFAULT 0,
            created_at     TIMESTAMPTZ NOT NULL DEFAULT now()
        );
        CREATE INDEX IF NOT EXISTS crawl_slug_idx
            ON crawl (slug, created_at DESC);

        -- THE TREE. One row per parent->child link. Not a document.
        -- parent_id is NULL for the seed, so the uniqueness constraint has to
        -- COALESCE it: Postgres will not accept NULL inside a primary key.
        CREATE TABLE IF NOT EXISTS paa_edge (
            id            BIGSERIAL PRIMARY KEY,
            crawl_id      BIGINT NOT NULL REFERENCES crawl(id) ON DELETE CASCADE,
            parent_id     BIGINT REFERENCES question(id),
            child_id      BIGINT NOT NULL REFERENCES question(id),
            depth         INTEGER NOT NULL,
            relevance     REAL,
            reach         REAL,
            discovered_by TEXT
        );
        CREATE UNIQUE INDEX IF NOT EXISTS paa_edge_uniq
            ON paa_edge (crawl_id, child_id, COALESCE(parent_id, 0));
        CREATE INDEX IF NOT EXISTS paa_edge_crawl_idx
            ON paa_edge (crawl_id, depth);

        -- Append-only. A re-score INSERTs; the newest row wins. Carries the
        -- threshold, strategy and model it was produced under, so changing any
        -- of them cannot retroactively rewrite what an old score claimed.
        CREATE TABLE IF NOT EXISTS gap_score (
            id              BIGSERIAL PRIMARY KEY,
            question_id     BIGINT NOT NULL REFERENCES question(id),
            location_code   INTEGER NOT NULL,
            status          TEXT NOT NULL,
            matching_pages  INTEGER NOT NULL,
            results_checked INTEGER NOT NULL,
            threshold       REAL NOT NULL,
            strategy        TEXT NOT NULL,
            embedding_model TEXT,
            results         JSONB NOT NULL,
            scored_at       TIMESTAMPTZ NOT NULL DEFAULT now()
        );
        CREATE INDEX IF NOT EXISTS gap_score_latest_idx
            ON gap_score (question_id, location_code, scored_at DESC);

        -- Raw SERP payloads, gzipped. CLAUDE.md: these belong in no query, so
        -- they are addressed only by the cache key and never scanned. ~30 KB of
        -- JSON compresses to ~5 KB, which is what keeps them affordable here.
        CREATE TABLE IF NOT EXISTS serp_snapshot (
            cache_key     TEXT PRIMARY KEY,
            question_id   BIGINT REFERENCES question(id),
            language_code TEXT NOT NULL,
            location_code INTEGER NOT NULL,
            cost          NUMERIC(12, 6),
            payload_gz    BYTEA NOT NULL,
            fetched_at    TIMESTAMPTZ NOT NULL DEFAULT now()
        );

        -- The verdict log. Same fields as data/labels/labels.jsonl, so the move
        -- is a copy with no shape change. Changing your mind writes a NEW row;
        -- retracting writes the verdict '?'. Nothing is ever rewritten.
        CREATE TABLE IF NOT EXISTS label (
            id             BIGSERIAL PRIMARY KEY,
            question_key   TEXT NOT NULL,
            language_code  TEXT,
            question       TEXT,
            verdict        TEXT NOT NULL,
            predicted      TEXT,
            threshold      REAL,
            strategy       TEXT,
            matching_pages INTEGER,
            overlaps       JSONB,
            tree_slug      TEXT,
            created_at     TIMESTAMPTZ NOT NULL DEFAULT now()
        );
        CREATE INDEX IF NOT EXISTS label_key_idx
            ON label (question_key, created_at DESC);

        -- Not questions, and never nodes - CLAUDE.md is explicit. They are the
        -- next seeds, so they hang off the crawl rather than off the tree.
        CREATE TABLE IF NOT EXISTS related_search (
            crawl_id BIGINT NOT NULL REFERENCES crawl(id) ON DELETE CASCADE,
            phrase   TEXT NOT NULL,
            PRIMARY KEY (crawl_id, phrase)
        );
        """,
    ),
]


def migrate() -> list[str]:
    """Apply every migration that has not run yet. Returns the names applied."""
    applied: list[str] = []
    with connect() as conn:
        with conn.cursor() as cur:
            cur.execute(
                """
                CREATE TABLE IF NOT EXISTS schema_migration (
                    name       TEXT PRIMARY KEY,
                    applied_at TIMESTAMPTZ NOT NULL DEFAULT now()
                )
                """
            )
            conn.commit()
            cur.execute("SELECT name FROM schema_migration")
            done = {row["name"] for row in cur.fetchall()}
            for name, sql in MIGRATIONS:
                if name in done:
                    continue
                cur.execute(sql)
                cur.execute("INSERT INTO schema_migration (name) VALUES (%s)", (name,))
                conn.commit()
                applied.append(name)
    return applied


def tables() -> list[str]:
    """Table names in the public schema. Used to verify a migration landed."""
    with connect() as conn, conn.cursor() as cur:
        cur.execute(
            """
            SELECT table_name FROM information_schema.tables
            WHERE table_schema = 'public'
            ORDER BY table_name
            """
        )
        return [row["table_name"] for row in cur.fetchall()]


# ------------------------------------------------------------- payloads


def pack(payload: dict) -> bytes:
    """Gzip a SERP response for storage. ~30 KB of JSON becomes ~5 KB."""
    return gzip.compress(json.dumps(payload, ensure_ascii=False).encode("utf-8"))


def unpack(blob: bytes) -> dict:
    return json.loads(gzip.decompress(bytes(blob)).decode("utf-8"))
