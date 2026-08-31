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

        -- The verdict log. Fields match data/labels/labels.jsonl one for one,
        -- with a single forced rename (see `overlap_vector` below). Changing
        -- your mind writes a NEW row; retracting writes the verdict '?'.
        -- Nothing is ever rewritten.
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
            -- The JSONL field is called `overlaps`, but OVERLAPS is a reserved
            -- word in Postgres and will not parse as a column name. Renaming it
            -- here is safer than quoting it forever: a permanently quoted
            -- identifier only has to be forgotten once. `labels.py` maps the
            -- two names, so the JSONL shape is unchanged.
            overlap_vector JSONB,
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
    (
        "0002_gap_score_ai_sources",
        """
        -- A scored node also carries whatever the AI Overview cited. It is not
        -- part of the gap metric, so it does not belong inside `results`, but
        -- it is bought with the same request and CLAUDE.md keeps it as an open
        -- product question ("does Google's AI answer this, and who does it
        -- cite?"). Discarding it would mean re-buying it to answer that later.
        ALTER TABLE gap_score ADD COLUMN IF NOT EXISTS ai_sources JSONB;

        -- Which `serp_snapshot` this score was read out of. The node used to
        -- carry a `data/live/serp/*.json` path; with the payload in the
        -- database the equivalent is the cache key, and keeping it is what lets
        -- a score be traced back to the exact response that produced it.
        ALTER TABLE gap_score ADD COLUMN IF NOT EXISTS source_key TEXT;
        """,
    ),
    (
        "0003_label_full_row",
        """
        -- CLAUDE.md's claim about the label log is that its JSONL fields ARE
        -- the label table's columns. Three were missing, so the claim was not
        -- yet true: the routing slug, the market the verdict was given in, and
        -- how many results the human actually had in front of them.
        --
        -- `location_code` matters more than it looks. A verdict is a judgement
        -- about a question against ITS results, and the results differ by
        -- market - so a label without one cannot be replayed against the score
        -- it was reacting to.
        ALTER TABLE label ADD COLUMN IF NOT EXISTS question_slug   TEXT;
        ALTER TABLE label ADD COLUMN IF NOT EXISTS location_code   INTEGER;
        ALTER TABLE label ADD COLUMN IF NOT EXISTS results_checked INTEGER;
        """,
    ),
    (
        "0004_serp_task",
        """
        -- A question queued on DataForSEO's Standard queue and not yet back.
        --
        -- This table exists because the money is spent at POST time, not at
        -- fetch time. Once a task is created it is paid for whether or not the
        -- result ever reaches us, so the id has to be written down before the
        -- callback can go missing - a deploy mid-flight, a 500 on our side, a
        -- postback that simply never arrives. Results stay retrievable for 30
        -- days, which turns every one of those into a re-fetch instead of a
        -- re-purchase, but only if the id was recorded.
        CREATE TABLE IF NOT EXISTS serp_task (
            id            BIGSERIAL PRIMARY KEY,
            task_id       TEXT UNIQUE,
            cache_key     TEXT NOT NULL,
            keyword       TEXT NOT NULL,
            question_id   BIGINT REFERENCES question(id),
            crawl_id      BIGINT REFERENCES crawl(id) ON DELETE SET NULL,
            tree_slug     TEXT NOT NULL,
            language_code TEXT NOT NULL,
            location_code INTEGER NOT NULL,
            -- posted -> done | failed. Never deleted: a finished task is the
            -- receipt for a charge, and CLAUDE.md's spend figures have to trace
            -- back to something.
            status        TEXT NOT NULL DEFAULT 'posted',
            cost          NUMERIC(12, 6),
            error         TEXT,
            posted_at     TIMESTAMPTZ NOT NULL DEFAULT now(),
            completed_at  TIMESTAMPTZ
        );
        CREATE INDEX IF NOT EXISTS serp_task_pending_idx
            ON serp_task (status, posted_at);
        CREATE INDEX IF NOT EXISTS serp_task_tree_idx
            ON serp_task (tree_slug, posted_at DESC);
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


# ----------------------------------------------------- tree <-> rows

# These two are PURE. No connection, no SQL, no clock - just the translation
# between the tree dict the API and the web layer speak and the rows the schema
# stores. That split is deliberate: the risky half of a storage migration is
# this mapping, and keeping it free of I/O is what lets it be tested against the
# tree files already on disk instead of against a live database.
#
# `slug` is NOT stored. It is a routing key derived from the question text and
# deduplicated within a tree, so persisting it would mean keeping a derived
# value in sync with its source for no gain. `recompose` takes the slug
# function as an argument rather than importing it, which also keeps this
# module free of a cycle through dataforseo.py.

# A node counts as scored once results were actually fetched for it. Status
# alone is not the test: CLAUDE.md is explicit that a question with no fetched
# results is `no_data` and must never be read as a gap.
def _is_scored(node: dict) -> bool:
    return bool(node.get("results_checked"))


def decompose(tree: dict) -> dict:
    """Split a tree dict into the rows that represent it.

    Questions are keyed by normalized text, which is the same key CLAUDE.md
    already uses for the SERP cache and the label log. The SQL layer turns those
    into ids; nothing here needs to know about them.
    """
    questions: dict[str, str] = {}
    edges: list[dict] = []
    scores: list[dict] = []

    for node in tree.get("nodes", []):
        normalized = node["id"]
        questions.setdefault(normalized, node["question"])

        # A node with several parents is several edges and ONE question. That
        # is what makes repeat_count a count rather than a stored number.
        parents = node.get("parents") or [None]
        for parent in parents:
            edges.append(
                {
                    "parent": parent,
                    "child": normalized,
                    "depth": node["depth"],
                    "relevance": node.get("relevance"),
                    "reach": node.get("reach"),
                    "discovered_by": node.get("discovered_by"),
                }
            )

        if _is_scored(node):
            scores.append(
                {
                    "question": normalized,
                    "status": node["status"],
                    "matching_pages": node.get("matching_pages") or 0,
                    "results_checked": node.get("results_checked") or 0,
                    "results": node.get("results") or [],
                    "ai_sources": node.get("ai_sources") or [],
                    "source_key": node.get("source_file"),
                    "scored_at": node.get("updated_at"),
                }
            )

    return {
        "crawl": {
            "slug": tree["slug"],
            "seed": tree["seed"],
            "seed_question": tree["nodes"][0]["id"] if tree.get("nodes") else None,
            "language_code": tree["language_code"],
            "location_code": tree["location_code"],
            "source": tree.get("source", "live"),
            "billable_calls": tree.get("billable_calls") or 0,
            "spend": tree.get("estimated_spend") or 0,
        },
        "questions": questions,
        "edges": edges,
        "scores": scores,
        "related": list(tree.get("related_searches") or []),
    }


def recompose(
    crawl: dict,
    questions: dict[str, str],
    edges: list[dict],
    scores: dict[str, dict],
    related: list[str],
    slug_for,
) -> dict:
    """Rebuild the tree dict from its rows.

    Edge rows are the tree. A node's parents are every edge pointing at it, its
    depth is the shallowest one, and `repeat_count` - CLAUDE.md's strongest
    fallback signal when search volume is missing - is simply how many distinct
    parents it turned up under. None of those are stored; all three fall out of
    the edges, which is the point of storing edges at all.
    """
    nodes: dict[str, dict] = {}
    order: list[str] = []

    for edge in edges:
        child = edge["child"]
        if child not in nodes:
            order.append(child)
            nodes[child] = {
                "id": child,
                "question": questions.get(child, child),
                "relevance": edge.get("relevance"),
                "reach": edge.get("reach"),
                "discovered_by": edge.get("discovered_by"),
                "depth": edge["depth"],
                "parent_id": edge.get("parent"),
                "parents": [],
                "repeat_count": 0,
                "status": "no_data",
                "matching_pages": 0,
                "results_checked": 0,
                "results": [],
                "ai_sources": [],
                "source_file": None,
                "updated_at": None,
            }
        node = nodes[child]
        if edge.get("parent"):
            if edge["parent"] not in node["parents"]:
                node["parents"].append(edge["parent"])
            # The shallowest appearance is the node's depth: CLAUDE.md scores
            # shallow nodes as more central, so a deeper repeat must not demote
            # a question that also sits near the seed.
            if edge["depth"] < node["depth"]:
                node["depth"] = edge["depth"]
                node["parent_id"] = edge["parent"]

    for normalized, node in nodes.items():
        node["repeat_count"] = len(node["parents"])
        score = scores.get(normalized)
        if score:
            node.update(
                {
                    "status": score["status"],
                    "matching_pages": score["matching_pages"],
                    "results_checked": score["results_checked"],
                    "results": score.get("results") or [],
                    "ai_sources": score.get("ai_sources") or [],
                    "source_file": score.get("source_key"),
                    "updated_at": score.get("scored_at"),
                }
            )
        node["slug"] = slug_for(node["question"])

    ordered = [nodes[k] for k in order]
    ordered.sort(key=lambda n: (n["depth"], order.index(n["id"])))

    return {
        "seed": crawl["seed"],
        "slug": crawl["slug"],
        "language_code": crawl["language_code"],
        "location_code": crawl["location_code"],
        "node_count": len(ordered),
        "source": crawl.get("source", "live"),
        "billable_calls": crawl.get("billable_calls") or 0,
        "estimated_spend": float(crawl.get("spend") or 0),
        "related_searches": list(related),
        "nodes": ordered,
    }


# ----------------------------------------------------------- operations

# Everything below talks to Postgres. The translation above is pure; this is the
# thin layer that moves those rows in and out, and it is deliberately the only
# place where a SQL string meets the tree.


def _question_ids(cur, language_code: str, questions: dict[str, str]) -> dict[str, int]:
    """Upsert questions, return normalized -> id.

    ON CONFLICT DO UPDATE rather than DO NOTHING: the surface form can change
    between crawls (Google re-cases a question), and RETURNING gives nothing
    back for a row that was skipped, which would leave the id map incomplete.
    """
    ids: dict[str, int] = {}
    for normalized, text in questions.items():
        cur.execute(
            """
            INSERT INTO question (language_code, normalized, text)
            VALUES (%s, %s, %s)
            ON CONFLICT (language_code, normalized)
              DO UPDATE SET text = EXCLUDED.text
            RETURNING id
            """,
            (language_code, normalized, text),
        )
        ids[normalized] = cur.fetchone()["id"]
    return ids


def save_tree(tree: dict, *, new_crawl: bool = False) -> int:
    """Persist a tree as rows. Returns the crawl id it belongs to.

    `new_crawl=True` is a fresh search and always opens a new crawl row - that
    is what makes a re-crawl an INSERT instead of an overwrite. Scoring reuses
    the crawl it is scoring inside, because a harvested node belongs to the
    crawl that discovered it rather than to a new one.
    """
    rows = decompose(tree)
    crawl = rows["crawl"]
    language = crawl["language_code"]

    with connect() as conn, conn.cursor() as cur:
        ids = _question_ids(cur, language, rows["questions"])

        crawl_id = None if new_crawl else tree.get("crawl_id")
        if crawl_id is None:
            cur.execute(
                """
                INSERT INTO crawl (slug, seed, seed_question, language_code,
                                   location_code, source, billable_calls, spend)
                VALUES (%s, %s, %s, %s, %s, %s, %s, %s)
                RETURNING id
                """,
                (
                    crawl["slug"],
                    crawl["seed"],
                    ids[crawl["seed_question"]],
                    language,
                    crawl["location_code"],
                    crawl["source"],
                    crawl["billable_calls"],
                    crawl["spend"],
                ),
            )
            crawl_id = cur.fetchone()["id"]
        else:
            cur.execute(
                "UPDATE crawl SET billable_calls = %s, spend = %s WHERE id = %s",
                (crawl["billable_calls"], crawl["spend"], crawl_id),
            )

        for edge in rows["edges"]:
            cur.execute(
                """
                INSERT INTO paa_edge (crawl_id, parent_id, child_id, depth,
                                      relevance, reach, discovered_by)
                VALUES (%s, %s, %s, %s, %s, %s, %s)
                ON CONFLICT (crawl_id, child_id, COALESCE(parent_id, 0))
                  DO NOTHING
                """,
                (
                    crawl_id,
                    ids.get(edge["parent"]) if edge["parent"] else None,
                    ids[edge["child"]],
                    edge["depth"],
                    edge["relevance"],
                    edge["reach"],
                    edge["discovered_by"],
                ),
            )

        for phrase in rows["related"]:
            cur.execute(
                "INSERT INTO related_search (crawl_id, phrase) VALUES (%s, %s)"
                " ON CONFLICT DO NOTHING",
                (crawl_id, phrase),
            )

        conn.commit()

    tree["crawl_id"] = crawl_id
    return crawl_id


def save_score(
    *,
    normalized: str,
    question: str,
    language_code: str,
    location_code: int,
    status: str,
    matching_pages: int,
    results_checked: int,
    results: list,
    ai_sources: list,
    threshold: float,
    strategy: str,
    source_key: str | None = None,
    embedding_model: str | None = None,
) -> None:
    """Append a gap score. Never an UPDATE.

    The threshold, strategy and model travel with the row. CLAUDE.md's rule: a
    threshold change or a model swap must not silently rewrite what an older
    score claimed, and storing what it was measured under is the only way to
    keep that true.
    """
    with connect() as conn, conn.cursor() as cur:
        ids = _question_ids(cur, language_code, {normalized: question})
        cur.execute(
            """
            INSERT INTO gap_score (question_id, location_code, status,
                                   matching_pages, results_checked, threshold,
                                   strategy, embedding_model, results,
                                   ai_sources, source_key)
            VALUES (%s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s)
            """,
            (
                ids[normalized],
                location_code,
                status,
                matching_pages,
                results_checked,
                threshold,
                strategy,
                embedding_model,
                json.dumps(results, ensure_ascii=False),
                json.dumps(ai_sources, ensure_ascii=False),
                source_key,
            ),
        )
        conn.commit()


def _latest_scores(cur, location_code: int, question_ids: list[int]) -> dict[int, dict]:
    """The newest gap score per question. Older rows stay; they just lose.

    DISTINCT ON is how "latest wins" is expressed against an append-only table
    without deleting the history that makes it append-only in the first place.
    """
    if not question_ids:
        return {}
    cur.execute(
        """
        SELECT DISTINCT ON (question_id)
               question_id, status, matching_pages, results_checked,
               results, ai_sources, source_key, scored_at
        FROM gap_score
        WHERE location_code = %s AND question_id = ANY(%s)
        ORDER BY question_id, scored_at DESC, id DESC
        """,
        (location_code, question_ids),
    )
    return {r["question_id"]: r for r in cur.fetchall()}


def load_tree(slug: str, slug_for) -> dict | None:
    """Rebuild one tree from its most recent crawl."""
    with connect() as conn, conn.cursor() as cur:
        cur.execute(
            "SELECT * FROM crawl WHERE slug = %s ORDER BY created_at DESC, id DESC"
            " LIMIT 1",
            (slug,),
        )
        crawl = cur.fetchone()
        if not crawl:
            return None
        return _assemble(cur, crawl, slug_for)


def load_trees(slug_for) -> list[dict]:
    """Every live tree: the most recent crawl of each slug.

    Older crawls stay - they are the diff engine's raw material - but the
    product shows the current state, so the read path takes the latest.
    """
    with connect() as conn, conn.cursor() as cur:
        cur.execute(
            """
            SELECT DISTINCT ON (slug) *
            FROM crawl
            ORDER BY slug, created_at DESC, id DESC
            """
        )
        crawls = cur.fetchall()
        return [_assemble(cur, c, slug_for) for c in crawls]


def _assemble(cur, crawl: dict, slug_for) -> dict:
    cur.execute(
        """
        SELECT e.depth, e.relevance, e.reach, e.discovered_by,
               child.normalized AS child, child.text AS child_text,
               child.id AS child_id, parent.normalized AS parent
        FROM paa_edge e
        JOIN question child ON child.id = e.child_id
        LEFT JOIN question parent ON parent.id = e.parent_id
        WHERE e.crawl_id = %s
        ORDER BY e.depth, e.id
        """,
        (crawl["id"],),
    )
    edge_rows = cur.fetchall()

    questions = {r["child"]: r["child_text"] for r in edge_rows}
    by_id = {r["child_id"]: r["child"] for r in edge_rows}
    edges = [
        {
            "parent": r["parent"],
            "child": r["child"],
            "depth": r["depth"],
            "relevance": r["relevance"],
            "reach": r["reach"],
            "discovered_by": r["discovered_by"],
        }
        for r in edge_rows
    ]

    found = _latest_scores(cur, crawl["location_code"], list(by_id))
    scores = {
        by_id[qid]: {
            "status": s["status"],
            "matching_pages": s["matching_pages"],
            "results_checked": s["results_checked"],
            "results": s["results"] or [],
            "ai_sources": s["ai_sources"] or [],
            "source_key": s["source_key"],
            "scored_at": (
                s["scored_at"].isoformat(timespec="seconds") if s["scored_at"] else None
            ),
        }
        for qid, s in found.items()
    }

    cur.execute(
        "SELECT phrase FROM related_search WHERE crawl_id = %s ORDER BY phrase",
        (crawl["id"],),
    )
    related = [r["phrase"] for r in cur.fetchall()]

    tree = recompose(dict(crawl), questions, edges, scores, related, slug_for)
    tree["crawl_id"] = crawl["id"]
    tree["updated_at"] = (
        crawl["created_at"].isoformat(timespec="seconds")
        if crawl["created_at"]
        else None
    )
    return tree


# ------------------------------------------------------------ serp cache


def snapshot_get(cache_key: str) -> dict | None:
    with connect() as conn, conn.cursor() as cur:
        cur.execute(
            "SELECT payload_gz FROM serp_snapshot WHERE cache_key = %s",
            (cache_key,),
        )
        row = cur.fetchone()
        return unpack(row["payload_gz"]) if row else None


def snapshot_put(
    cache_key: str,
    payload: dict,
    *,
    language_code: str = "",
    location_code: int = 0,
    cost: float | None = None,
) -> None:
    with connect() as conn, conn.cursor() as cur:
        cur.execute(
            """
            INSERT INTO serp_snapshot (cache_key, language_code, location_code,
                                       cost, payload_gz)
            VALUES (%s, %s, %s, %s, %s)
            ON CONFLICT (cache_key) DO UPDATE
              SET payload_gz = EXCLUDED.payload_gz, fetched_at = now()
            """,
            (cache_key, language_code, location_code, cost, pack(payload)),
        )
        conn.commit()


# ---------------------------------------------------------------- labels


def label_append(record: dict) -> None:
    """Append one verdict, in the exact shape `labels.record` produces.

    Two names differ from the JSONL and nowhere else in the codebase should have
    to know it: the row's `label` is the column `verdict` (VERDICT is not
    reserved, LABEL as a column would have been fine either way, but `verdict`
    says what it holds), and `overlaps` is the column `overlap_vector` because
    OVERLAPS is reserved in Postgres.
    """
    with connect() as conn, conn.cursor() as cur:
        cur.execute(
            """
            INSERT INTO label (question_key, language_code, question, verdict,
                               predicted, threshold, strategy, matching_pages,
                               results_checked, overlap_vector, tree_slug,
                               question_slug, location_code, created_at)
            VALUES (%s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s,
                    COALESCE(%s::timestamptz, now()))
            """,
            (
                record.get("key"),
                record.get("language_code"),
                record.get("question"),
                record.get("label"),
                record.get("predicted"),
                record.get("threshold"),
                record.get("strategy"),
                record.get("matching_pages"),
                record.get("results_checked"),
                json.dumps(record.get("overlaps") or [], ensure_ascii=False),
                record.get("tree_slug"),
                record.get("question_slug"),
                record.get("location_code"),
                record.get("created_at"),
            ),
        )
        conn.commit()


def label_rows() -> list[dict]:
    """Every verdict ever given, oldest first - the same order as the JSONL.

    Returns rows shaped exactly like the JSONL, so `labels.current()`,
    `labels.counts()` and `scripts/phase05_evaluate.py` read them unchanged.
    The two renamed columns are mapped back here and nowhere else.
    """
    with connect() as conn, conn.cursor() as cur:
        cur.execute("SELECT * FROM label ORDER BY created_at, id")
        return [
            {
                "key": r["question_key"],
                "question": r["question"],
                "language_code": r["language_code"],
                "location_code": r["location_code"],
                "label": r["verdict"],
                "tree_slug": r["tree_slug"],
                "question_slug": r["question_slug"],
                "predicted": r["predicted"],
                "threshold": r["threshold"],
                "strategy": r["strategy"],
                "matching_pages": r["matching_pages"],
                "results_checked": r["results_checked"],
                "overlaps": r["overlap_vector"] or [],
                "created_at": r["created_at"].isoformat(timespec="seconds"),
            }
            for r in cur.fetchall()
        ]


# ------------------------------------------------------- queued tasks


def task_insert(
    *,
    task_id: str | None,
    cache_key: str,
    keyword: str,
    tree_slug: str,
    language_code: str,
    location_code: int,
    crawl_id: int | None = None,
    normalized: str | None = None,
    cost: float | None = None,
    status: str = "posted",
    error: str | None = None,
) -> None:
    """Write down a queued task. Called immediately after the POST succeeds.

    The row is the receipt for a charge that has already happened, so it is
    written before anything else can go wrong. ON CONFLICT DO NOTHING because a
    retried post must not create a second receipt for the same task.
    """
    with connect() as conn, conn.cursor() as cur:
        question_id = None
        if normalized:
            question_id = _question_ids(cur, language_code, {normalized: keyword})[
                normalized
            ]
        cur.execute(
            """
            INSERT INTO serp_task (task_id, cache_key, keyword, question_id,
                                   crawl_id, tree_slug, language_code,
                                   location_code, status, cost, error)
            VALUES (%s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s)
            ON CONFLICT (task_id) DO NOTHING
            """,
            (
                task_id, cache_key, keyword, question_id, crawl_id, tree_slug,
                language_code, location_code, status, cost, error,
            ),
        )
        conn.commit()


def task_get(task_id: str) -> dict | None:
    with connect() as conn, conn.cursor() as cur:
        cur.execute("SELECT * FROM serp_task WHERE task_id = %s", (task_id,))
        return cur.fetchone()


def task_finish(task_id: str, *, error: str | None = None) -> None:
    with connect() as conn, conn.cursor() as cur:
        cur.execute(
            """
            UPDATE serp_task
               SET status = %s, error = %s, completed_at = now()
             WHERE task_id = %s
            """,
            ("failed" if error else "done", error, task_id),
        )
        conn.commit()


def tasks_for_tree(tree_slug: str, limit: int = 200) -> list[dict]:
    """Every task ever queued for a tree, newest first. Drives the progress UI."""
    with connect() as conn, conn.cursor() as cur:
        cur.execute(
            """
            SELECT task_id, cache_key, keyword, status, cost, error,
                   posted_at, completed_at
              FROM serp_task
             WHERE tree_slug = %s
             ORDER BY posted_at DESC, id DESC
             LIMIT %s
            """,
            (tree_slug, limit),
        )
        return [
            {
                **row,
                "posted_at": row["posted_at"].isoformat(timespec="seconds"),
                "completed_at": (
                    row["completed_at"].isoformat(timespec="seconds")
                    if row["completed_at"]
                    else None
                ),
                "cost": float(row["cost"]) if row["cost"] is not None else None,
            }
            for row in cur.fetchall()
        ]


def tasks_pending(older_than_seconds: int = 0, limit: int = 100) -> list[dict]:
    """Tasks posted but never completed - the sweep for a lost postback.

    `older_than_seconds` avoids racing a callback that is simply still in
    flight; a task posted ten seconds ago is not stranded, it is working.
    """
    with connect() as conn, conn.cursor() as cur:
        cur.execute(
            """
            SELECT * FROM serp_task
             WHERE status = 'posted'
               AND task_id IS NOT NULL
               AND posted_at < now() - (%s * interval '1 second')
             ORDER BY posted_at
             LIMIT %s
            """,
            (older_than_seconds, limit),
        )
        return cur.fetchall()


def task_spend(tree_slug: str | None = None) -> dict:
    """What the queue has actually cost. Reported, never estimated."""
    with connect() as conn, conn.cursor() as cur:
        if tree_slug:
            cur.execute(
                "SELECT count(*) AS n, COALESCE(sum(cost), 0) AS total"
                " FROM serp_task WHERE tree_slug = %s",
                (tree_slug,),
            )
        else:
            cur.execute(
                "SELECT count(*) AS n, COALESCE(sum(cost), 0) AS total FROM serp_task"
            )
        row = cur.fetchone()
        return {"tasks": row["n"], "spend": float(row["total"])}
