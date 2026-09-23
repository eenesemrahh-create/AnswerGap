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
from decimal import Decimal
from typing import Any, Iterator

from . import gate, pricing_seed
from . import tree as tree_mod

try:
    import psycopg
    from psycopg.rows import dict_row
except ImportError:  # the filesystem backend is still a supported way to run
    psycopg = None  # type: ignore[assignment]
    dict_row = None  # type: ignore[assignment]

try:
    from psycopg_pool import ConnectionPool
except ImportError:  # pooling is an optimisation, not a requirement
    ConnectionPool = None  # type: ignore[assignment]


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


# One pool for the process. Opening a connection per call is a TCP handshake, a
# TLS handshake and an auth round trip EVERY TIME, and this codebase calls
# `connect()` once per operation - so /api/meta was paying for two of them plus
# twenty-odd queries to return a number. Measured before pooling: 8.9s.
#
# max_size is small on purpose. Railway's Postgres has a modest connection
# ceiling and one API process does not need more; a pool that exhausts the
# server is worse than no pool.
_POOL: Any = None


def _pool() -> Any:
    global _POOL
    if _POOL is None:
        _POOL = ConnectionPool(
            url(),
            min_size=1,
            max_size=5,
            kwargs={"row_factory": dict_row},
            # NO per-checkout check. `check_connection` issues its own SELECT 1
            # before handing the connection over, which measured as a full extra
            # round trip on every single database call - exactly doubling the
            # cost when the database is not in the same region as the service.
            #
            # `max_idle` gets the same protection for free: a connection the
            # database might have dropped is closed by the pool before anyone
            # can be given it, and reopening costs one connect instead of a
            # round trip on every request forever.
            max_idle=120,
            max_lifetime=1800,
            open=True,
        )
    return _POOL


@contextmanager
def connect() -> Iterator[Any]:
    dsn = url()
    if not dsn:
        raise NotConfigured("DATABASE_URL is not set.")
    if psycopg is None:
        raise NotConfigured("psycopg is not installed.")
    if ConnectionPool is None:
        with psycopg.connect(dsn, row_factory=dict_row) as conn:
            yield conn
        return
    with _pool().connection() as conn:
        yield conn


# --------------------------------------------------------------- schema

# Migration 0011 seeds the pricing cards. Both values are read at import time
# and interpolated into that migration's SQL, so the seed and the key it is
# stored under each exist in exactly one place.
#
# `gate` imports nothing but the standard library, so this cannot cycle.
#
# DOLLAR-QUOTED in the SQL below ($seed$...$seed$) rather than escaped: the
# JSON is full of double quotes and would otherwise need escaping rules that
# differ between the Python string, the f-string and Postgres. `$seed$` cannot
# appear inside JSON produced by `json.dumps`, so the quoting is unambiguous.
SETTING_PRICING_PLANS_KEY = gate.SETTING_PRICING_PLANS
_SEED_PRICING_JSON = json.dumps(pricing_seed.SEED_PLANS, ensure_ascii=False)

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
    (
        "0005_accounts",
        """
        -- NOT `user`: USER is reserved in Postgres and the table would have to
        -- be quoted forever. This schema already learned that lesson once, when
        -- label.overlaps had to become overlap_vector. A permanently quoted
        -- identifier only has to be forgotten once.
        --
        -- THERE IS NO ROLE COLUMN, DELIBERATELY. Admin is ADMIN_EMAILS, an
        -- environment variable on the api service, so no statement anywhere in
        -- this schema is capable of granting it. A row cannot make someone an
        -- admin; only a deploy can. That is the same kind of guarantee as
        -- "there is no statement that overwrites a tree" - structural, not a
        -- rule somebody has to remember.
        CREATE TABLE IF NOT EXISTS app_user (
            id           BIGSERIAL PRIMARY KEY,
            -- Google's stable subject id, NOT the email. A Google account can
            -- change its primary address; keying on the address would silently
            -- split one person into two accounts and two balances.
            google_sub   TEXT NOT NULL UNIQUE,
            email        TEXT NOT NULL,
            name         TEXT,
            picture_url  TEXT,
            -- active | suspended. Read on EVERY spending request, which is why
            -- this is an UPDATEd column rather than an append-only log: a
            -- DISTINCT ON here would be a second query on the hot path, and the
            -- database is ~150 ms away. No history is lost - every change
            -- writes an admin_action row beside it.
            status       TEXT NOT NULL DEFAULT 'active',
            -- Bumping this invalidates every token already issued to this user.
            -- It is the ONLY revocation there is, because there is no session
            -- table; a token carries the epoch it was signed under.
            token_epoch  INTEGER NOT NULL DEFAULT 1,
            created_at   TIMESTAMPTZ NOT NULL DEFAULT now(),
            last_seen_at TIMESTAMPTZ
        );
        -- Non-unique on purpose: google_sub is the identity. This exists so the
        -- admin panel can search by address without a sequential scan.
        CREATE INDEX IF NOT EXISTS app_user_email_idx ON app_user (lower(email));

        -- One-time codes, for handing a session to the admin service.
        --
        -- The customer web receives its token in a URL fragment, which never
        -- leaves the browser. A server-side route handler cannot read a
        -- fragment, and a query parameter would land in Railway's access log -
        -- so the admin gets a code instead, redeemed server-to-server within a
        -- minute and single-use by construction.
        CREATE TABLE IF NOT EXISTS auth_code (
            code_hash  TEXT PRIMARY KEY,
            user_id    BIGINT NOT NULL REFERENCES app_user(id) ON DELETE CASCADE,
            expires_at TIMESTAMPTZ NOT NULL,
            used_at    TIMESTAMPTZ,
            created_at TIMESTAMPTZ NOT NULL DEFAULT now()
        );

        -- Append-only, the same discipline as gap_score and label. The balance
        -- is SUM(delta) and is NEVER stored: a stored balance is a number that
        -- can disagree with its own history, and this one is money. What
        -- happened the last time a running total was written over instead of
        -- accumulated is recorded against crawl.spend in CLAUDE.md.
        CREATE TABLE IF NOT EXISTS credit_ledger (
            id         BIGSERIAL PRIMARY KEY,
            -- RESTRICT, not CASCADE. Deleting a user must not be able to
            -- destroy the money history; erasure blanks the profile fields and
            -- leaves the ledger standing.
            user_id    BIGINT NOT NULL REFERENCES app_user(id) ON DELETE RESTRICT,
            delta      INTEGER NOT NULL,
            -- signup | admin_grant | admin_revoke | search | score | batch
            reason     TEXT NOT NULL,
            -- Traces a debit back to a receipt: a tree slug, a question slug,
            -- or the granting admin's email.
            ref        TEXT,
            note       TEXT,
            created_at TIMESTAMPTZ NOT NULL DEFAULT now()
        );
        -- INCLUDE (delta) makes the balance an index-only scan; one index
        -- serves both the balance sum and the panel's ledger listing.
        CREATE INDEX IF NOT EXISTS credit_ledger_user_idx
            ON credit_ledger (user_id, created_at DESC) INCLUDE (delta);

        -- Who did what, including the refusals.
        --
        -- This is the ONLY table that can answer "who spent this $0.0026".
        -- crawl.user_id cannot: live.score adds its spend to an EXISTING crawl
        -- row (see the UPDATE in save_tree), so a question scored by user B on
        -- user A's tree accumulates onto A's crawl. crawl.user_id is ownership;
        -- this is attribution; credit_ledger is what they owe. Three columns,
        -- three different questions.
        CREATE TABLE IF NOT EXISTS usage_event (
            id            BIGSERIAL PRIMARY KEY,
            user_id       BIGINT REFERENCES app_user(id) ON DELETE RESTRICT,
            -- HMAC of the client address with a server-side salt. The raw IP is
            -- never stored: it is only ever needed as a counter key, and five
            -- of this product's locales are European.
            ip_hash       TEXT,
            -- Opaque id the browser generates and keeps in localStorage. NOT a
            -- cookie - api and web are separate sites under the Public Suffix
            -- List, so a cookie set by the api would never come back.
            anon_id       TEXT,
            action        TEXT NOT NULL,
            -- allowed | refused_no_credits | refused_suspended |
            -- refused_signed_out | refused_unverified | refused_erased.
            -- Refusals are recorded too: "how often do we turn people away,
            -- and why" cannot be answered later from rows that were never
            -- inserted. Rows written before 2026-09-23 may also carry
            -- `refused_anon_limit`, from the retired anonymous allowance;
            -- there is no CHECK here, so history keeps its own vocabulary.
            outcome       TEXT NOT NULL,
            credits       INTEGER NOT NULL DEFAULT 0,
            spend_usd     NUMERIC(12, 6) NOT NULL DEFAULT 0,
            tree_slug     TEXT,
            question_slug TEXT,
            -- Written at insert so a day's usage is a point lookup on
            -- (key, day) rather than a range scan over created_at. This will
            -- be the busiest table in the schema. It was added for the
            -- anonymous daily limit; that reader is gone, but the reports
            -- aggregate on this column now and `admin_usage_by_month` is the
            -- reason it stays indexed.
            day_utc       DATE NOT NULL DEFAULT (now() AT TIME ZONE 'utc')::date,
            created_at    TIMESTAMPTZ NOT NULL DEFAULT now()
        );
        -- These two served the anonymous daily counters and now have no
        -- reader. They are LEFT IN PLACE deliberately: dropping an index is a
        -- migration, `CREATE INDEX IF NOT EXISTS` cannot express a drop, and
        -- two partial indexes on a table of this size cost less today than a
        -- migration written in a hurry. They remain the right index for
        -- "what did this browser or this address do", which is the shape of
        -- every abuse investigation. Revisit when the table is large enough
        -- for the write cost to show up.
        CREATE INDEX IF NOT EXISTS usage_event_anon_day_idx
            ON usage_event (anon_id, day_utc) WHERE anon_id IS NOT NULL;
        CREATE INDEX IF NOT EXISTS usage_event_ip_day_idx
            ON usage_event (ip_hash, day_utc) WHERE ip_hash IS NOT NULL;
        CREATE INDEX IF NOT EXISTS usage_event_user_idx
            ON usage_event (user_id, created_at DESC) WHERE user_id IS NOT NULL;
        CREATE INDEX IF NOT EXISTS usage_event_day_idx ON usage_event (day_utc);

        -- Runtime configuration an admin changes without a deploy. Append-only,
        -- latest wins by DISTINCT ON - the same shape as gap_score, for the
        -- same reason: "what was the anonymous limit last Tuesday" is a real
        -- question once someone disputes a bill.
        --
        -- NO SEED ROWS. The defaults live in answergap/gate.py, so re-running
        -- this migration cannot double-insert and a default cannot end up
        -- recorded in two places that disagree.
        CREATE TABLE IF NOT EXISTS app_setting (
            id            BIGSERIAL PRIMARY KEY,
            -- Prefixed because `key`/`value` as a pair reads like a hash rather
            -- than like a setting. VALUES is also reserved, and the near-miss
            -- is not worth leaving in place.
            setting_key   TEXT NOT NULL,
            setting_value TEXT NOT NULL,
            set_by        TEXT,
            created_at    TIMESTAMPTZ NOT NULL DEFAULT now()
        );
        CREATE INDEX IF NOT EXISTS app_setting_latest_idx
            ON app_setting (setting_key, created_at DESC, id DESC);

        -- Every privileged act, append-only. The actor is an EMAIL, not a user
        -- id: an admin is an entry in an environment variable rather than a
        -- row, and the audit has to keep making sense after that entry is
        -- removed. This does not make admin mistakes impossible; it makes them
        -- visible, which is the only guarantee available here.
        CREATE TABLE IF NOT EXISTS admin_action (
            id          BIGSERIAL PRIMARY KEY,
            actor       TEXT NOT NULL,
            action      TEXT NOT NULL,
            target_user BIGINT REFERENCES app_user(id) ON DELETE RESTRICT,
            detail      JSONB,
            created_at  TIMESTAMPTZ NOT NULL DEFAULT now()
        );
        CREATE INDEX IF NOT EXISTS admin_action_recent_idx
            ON admin_action (created_at DESC);

        -- Ownership, not attribution - see the usage_event comment above. Set
        -- on INSERT only. NULL means "anonymous, or written before accounts
        -- existed"; those two are indistinguishable here, and deliberately so,
        -- because pretending to know which would be inventing a measurement
        -- that was never made.
        ALTER TABLE crawl     ADD COLUMN IF NOT EXISTS user_id BIGINT
            REFERENCES app_user(id) ON DELETE RESTRICT;
        ALTER TABLE serp_task ADD COLUMN IF NOT EXISTS user_id BIGINT
            REFERENCES app_user(id) ON DELETE RESTRICT;
        CREATE INDEX IF NOT EXISTS crawl_user_idx
            ON crawl (user_id, created_at DESC) WHERE user_id IS NOT NULL;
        CREATE INDEX IF NOT EXISTS serp_task_user_idx
            ON serp_task (user_id, posted_at DESC) WHERE user_id IS NOT NULL;
        """,
    ),
    (
        "0006_crawl_anon_owner",
        """
        -- The signed-out counterpart of `crawl.user_id`. An anonymous visitor
        -- has an `anon_id` (a random browser-scoped cookie via ANON_HEADER),
        -- and this column lets their own crawl be recognised as theirs so the
        -- detail-level privacy gate can let them back into `/api/tree/{slug}`
        -- after a page reload. Two people with the same anon cookie is a
        -- collision they had to engineer; the guarantee is "not visible to
        -- strangers", not "cryptographic".
        --
        -- Set on INSERT only. Same reason `user_id` is: `live.score` UPDATEs
        -- an existing crawl row, and rewriting the owner there would let a
        -- score by user B rewrite whose search it was. NULL means "written
        -- before this column existed"; those old crawls are inaccessible via
        -- anon match by design - they were world-readable before the gate,
        -- and blank memory is more honest than a guess.
        --
        -- A crawl carries EITHER `user_id` OR `anon_id`, not both. The gate
        -- checks each in turn; there is no need to combine them into one
        -- ownership token, and doing so would make it harder to answer "was
        -- this a signed-in crawl" from a single row.
        ALTER TABLE crawl ADD COLUMN IF NOT EXISTS anon_id TEXT;
        CREATE INDEX IF NOT EXISTS crawl_anon_idx
            ON crawl (anon_id, created_at DESC) WHERE anon_id IS NOT NULL;
        """,
    ),
    (
        "0007_password_accounts",
        """
        -- Email + password sign-in, beside Google rather than instead of it.
        --
        -- WHY THE IDENTITY RULE HAD TO CHANGE. `google_sub` was NOT NULL
        -- UNIQUE and was the identity, for the reason recorded against
        -- 0005: a Google account can change its primary address, so keying
        -- on the address would split one person into two accounts and two
        -- balances. That reasoning is untouched and `google_sub` is still
        -- looked up FIRST. What changes is that a password account has no
        -- `sub` at all, so the column becomes nullable - and Postgres
        -- treats NULLs as distinct in a UNIQUE index, so many password
        -- accounts coexist under it without colliding.
        ALTER TABLE app_user ALTER COLUMN google_sub DROP NOT NULL;

        -- scrypt, encoded with its own cost parameters. NULL for an account
        -- that only ever signed in with Google - which is why "does this
        -- account have a password" is a real question the sign-in path asks
        -- rather than an assumption.
        ALTER TABLE app_user ADD COLUMN IF NOT EXISTS password_hash TEXT;

        -- NULL until the address is proven. Google sign-in sets it
        -- immediately (Google asserts `email_verified` and we check it);
        -- a password signup sets it when the emailed link is redeemed.
        ALTER TABLE app_user ADD COLUMN IF NOT EXISTS email_verified_at
            TIMESTAMPTZ;

        -- THE SIGNUP GRANT MOVES TO VERIFICATION, so this records whether
        -- it has happened. 0005 wrote the grant in the same statement that
        -- created the row and used `xmax = 0` to fire it exactly once; that
        -- trick does not survive the grant moving to a LATER statement, and
        -- "credits already given" has to be a fact in the row instead.
        -- Without it, pressing the verification link twice - or a replayed
        -- request - would mint a second helping of free searches.
        ALTER TABLE app_user ADD COLUMN IF NOT EXISTS signup_granted_at
            TIMESTAMPTZ;

        -- Backfill: every account that exists when this migration runs
        -- arrived through Google, which verified the address before we
        -- accepted it, and was granted its credits at creation. Marking
        -- them NULL instead would lock out every existing user behind a
        -- verification mail they never asked for, and re-granting them
        -- credits they already have would be inventing money.
        UPDATE app_user
           SET email_verified_at = COALESCE(email_verified_at, created_at),
               signup_granted_at = COALESCE(signup_granted_at, created_at)
         WHERE google_sub IS NOT NULL;

        -- THE ADDRESS IS NOW UNIQUE, and this is the constraint that makes
        -- account linking safe rather than a race. Without it, two people -
        -- or one person twice - could hold the same address under two rows
        -- and two balances, and the "which account did my credits go to"
        -- question would have no answer. Built on lower(email) because
        -- addresses are matched case-insensitively everywhere else here,
        -- ADMIN_EMAILS included.
        --
        -- This REPLACES the non-unique index from 0005. Creating it will
        -- fail loudly if duplicate addresses already exist, and that is the
        -- correct outcome: silently merging two balances is not a migration
        -- decision.
        --
        -- The check below exists only to make that failure READABLE. Each
        -- migration runs in one transaction, so a bare unique violation here
        -- rolls back all of 0007 - including `email_token` - and surfaces as
        -- "could not create unique index" with no indication of which address
        -- is at fault. This names it.
        DO $$
        DECLARE offending text;
        BEGIN
            SELECT lower(email) INTO offending
              FROM app_user GROUP BY lower(email) HAVING count(*) > 1 LIMIT 1;
            IF offending IS NOT NULL THEN
                RAISE EXCEPTION
                    'migration 0007: % is on more than one app_user row. '
                    'Merge the accounts (and their credit_ledger rows) by '
                    'hand, then redeploy.', offending;
            END IF;
        END $$;

        DROP INDEX IF EXISTS app_user_email_idx;
        CREATE UNIQUE INDEX IF NOT EXISTS app_user_email_key
            ON app_user (lower(email));

        -- One-time emailed tokens: verification and password reset.
        --
        -- Deliberately the same shape as `auth_code` rather than a signed
        -- stateless token. A signed token cannot be revoked and cannot be
        -- spent only once; this table gets both properties from the same
        -- `UPDATE ... WHERE used_at IS NULL RETURNING` that makes auth_code
        -- single-use by construction, so two concurrent redemptions cannot
        -- both win.
        --
        -- Stored HASHED. A leaked backup of this table would otherwise be a
        -- set of live password-reset links.
        CREATE TABLE IF NOT EXISTS email_token (
            token_hash TEXT PRIMARY KEY,
            user_id    BIGINT NOT NULL REFERENCES app_user(id) ON DELETE CASCADE,
            -- verify | reset
            purpose    TEXT NOT NULL,
            -- The address the token was SENT TO, which is not necessarily
            -- the row's current address. A reset link mailed to an old
            -- address must not be redeemable after the address changes.
            email      TEXT NOT NULL,
            expires_at TIMESTAMPTZ NOT NULL,
            used_at    TIMESTAMPTZ,
            created_at TIMESTAMPTZ NOT NULL DEFAULT now()
        );
        -- Serves both the "how many did we send lately" rate-limit check and
        -- the sweep that deletes spent tokens.
        CREATE INDEX IF NOT EXISTS email_token_user_idx
            ON email_token (user_id, purpose, created_at DESC);
        """,
    ),
    (
        "0008_gap_score_ai_state",
        """
        -- What the AI Overview citation list MEANT, beside the list itself.
        -- An empty `ai_sources` had two readings and the product showed both
        -- as "none": Google cited nobody, or DataForSEO never resolved the
        -- block (22 of 52 archived ones). The second is unknown, and
        -- CLAUDE.md's accuracy rule forbids rendering unknown as a result.
        -- Values: cited | none | unresolved | absent. NULL means the row was
        -- written before this column existed - also unknown, and rendered as
        -- such rather than guessed backwards.
        ALTER TABLE gap_score ADD COLUMN IF NOT EXISTS ai_state TEXT;
        """,
    ),
    (
        "0009_payment_event",
        """
        -- Every Stripe webhook we recognise, append-only, exactly once.
        --
        -- `event_id` is UNIQUE and that is the whole idempotency story: Stripe
        -- retries a webhook until it gets a 2xx, so the same event WILL arrive
        -- twice. An ON CONFLICT DO NOTHING against this constraint is what
        -- makes a redelivery a no-op rather than a second payment on the
        -- record - the same shape `serp_task` uses for redelivered callbacks.
        --
        -- `livemode` is stored because a test payment and a real one are
        -- otherwise indistinguishable in this table, and mixing them is how a
        -- revenue figure becomes a lie.
        CREATE TABLE IF NOT EXISTS payment_event (
            id           BIGSERIAL PRIMARY KEY,
            event_id     TEXT NOT NULL UNIQUE,
            kind         TEXT NOT NULL,
            livemode     BOOLEAN NOT NULL,
            amount_cents INTEGER,
            currency     TEXT,
            email        TEXT,
            status       TEXT,
            object_id    TEXT,
            payload      JSONB,
            created_at   TIMESTAMPTZ NOT NULL DEFAULT now()
        );
        CREATE INDEX IF NOT EXISTS payment_event_recent_idx
            ON payment_event (created_at DESC);
        """,
    ),
    (
        "0010_account_erasure",
        """
        -- ERASURE IS A STATE ON THE ROW, NOT A DELETE. Five tables reference
        -- `app_user` with ON DELETE RESTRICT, and that is the design rather
        -- than an obstacle: the money history and the spend attribution have
        -- to survive a person leaving. What leaves is the profile, every live
        -- credential, and every link from the person to their searches. The
        -- address and the ledger STAY, because the Privacy Policy promises a
        -- returning person the balance they paid for, and says so plainly.

        -- WHEN it happened, and the flag revival clears. NULL means "not
        -- erased right now". The HISTORY of erasures and revivals is not here;
        -- it is `admin_action`, append-only, the same answer 0005 gave for
        -- `status`.
        ALTER TABLE app_user ADD COLUMN IF NOT EXISTS erased_at TIMESTAMPTZ;

        -- WHAT TO COME BACK AS. Without it, revival would restore 'active'
        -- blindly and a suspended account could launder its ban through an
        -- erasure and a fresh sign-in - which is the first thing somebody
        -- would find. NULL unless the row is erased; the second CHECK enforces
        -- that.
        ALTER TABLE app_user ADD COLUMN IF NOT EXISTS status_before_erasure TEXT;

        -- `status` GAINS A THIRD VALUE, 'erased', and it is carried there as
        -- well as in the timestamp on purpose: five sign-in paths already test
        -- `status <> 'active'` and become correct for erasure without being
        -- touched. Moving the discriminator elsewhere would mean editing five
        -- hand-written refusals and getting all five right, on the refusal
        -- path, where a miss is invisible until it is a breach.
        --
        -- The timestamp is the fact; the status is the switch. The standing
        -- objection to recording one fact twice is that the two can disagree,
        -- so this makes disagreement UNREPRESENTABLE rather than a rule
        -- somebody has to remember. It also means `admin_set_status(...,
        -- 'active')` cannot half-revive an erased row: nothing can un-erase an
        -- account without clearing the timestamp, and only `_revive` does.
        --
        -- DROP-then-ADD because Postgres has no ADD CONSTRAINT IF NOT EXISTS,
        -- and every statement here is written to be re-runnable even though
        -- `schema_migration` means it will not be re-run.
        ALTER TABLE app_user DROP CONSTRAINT IF EXISTS app_user_erased_consistent;
        ALTER TABLE app_user ADD CONSTRAINT app_user_erased_consistent
            CHECK ((status = 'erased') = (erased_at IS NOT NULL));

        ALTER TABLE app_user DROP CONSTRAINT IF EXISTS app_user_status_before_erasure;
        ALTER TABLE app_user ADD CONSTRAINT app_user_status_before_erasure
            CHECK (status_before_erasure IS NULL OR status = 'erased');

        -- THE ONLY LINK FROM A PAYMENT TO A PERSON IS THE ADDRESS AS TEXT.
        -- `payment_event` has no user_id and no foreign key, because Stripe's
        -- webhook is recorded before we know whose it is. Erasure still has to
        -- find that person's rows to redact `payload` - the whole raw event,
        -- up to 100k chars, carrying billing name and address - and this is
        -- the index that lookup wants. On lower(email) because every other
        -- address comparison in this schema folds the same way, and an index
        -- on the raw column would not be usable by the statement that needs it.
        CREATE INDEX IF NOT EXISTS payment_event_email_idx
            ON payment_event (lower(email));
        """,
    ),
    (
        "0011_seed_pricing_plans",
        # The three cards the /pricing page reads, written once into the
        # setting an admin would otherwise have to type them into. Built by
        # f-string from `answergap.pricing_seed`, so the seed exists as ONE
        # value rather than as SQL somebody has to keep in step with Python.
        #
        # WHERE NOT EXISTS, so this is a seed and not an overwrite. A
        # deployment that already has plans - typed by an operator, or from a
        # previous run of this migration - keeps them. `app_setting` is
        # append-only and latest-wins, so an unconditional INSERT here would
        # silently discard whatever the operator had published, which is the
        # one thing a migration must never do to content.
        #
        # `set_by = 'migration 0011'` rather than an email. The audit answers
        # "who set this" and the honest answer is "nobody - it shipped".
        f"""
        INSERT INTO app_setting (setting_key, setting_value, set_by)
        SELECT '{SETTING_PRICING_PLANS_KEY}',
               $seed${_SEED_PRICING_JSON}$seed$,
               'migration 0011'
        WHERE NOT EXISTS (
            SELECT 1 FROM app_setting
             WHERE setting_key = '{SETTING_PRICING_PLANS_KEY}'
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
                    "ai_state": node.get("ai_state"),
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
            # Reads `estimated_spend` and writes `spend`. The names differ
            # because the tree carries the figure under the key `live` built
            # it with; by the time it is a row it is simply what was spent.
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
                "ai_state": None,
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
                    "ai_state": score.get("ai_state"),
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
        # Questions, which is nodes minus the seed. See `tree.count_questions`.
        "question_count": tree_mod.count_questions(ordered),
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


def save_tree(
    tree: dict,
    *,
    new_crawl: bool = False,
    add_spend: float = 0.0,
    add_calls: int = 0,
    user_id: int | None = None,
    anon_id: str | None = None,
) -> int:
    """Persist a tree as rows. Returns the crawl id it belongs to.

    `new_crawl=True` is a fresh search and always opens a new crawl row - that
    is what makes a re-crawl an INSERT instead of an overwrite.

    `add_spend` and `add_calls` APPLY ONLY TO AN EXISTING CRAWL. A new row
    takes its totals from the tree dict, so passing `add_spend=` alongside
    `new_crawl=True` silently does nothing - which is correct for the two real
    callers (a fresh crawl carries its own spend; scoring tops up the row it
    found) and a trap for anyone writing a test. Scoring reuses
    the crawl it is scoring inside, because a harvested node belongs to the
    crawl that discovered it rather than to a new one.

    `add_spend` ACCUMULATES; it does not replace. An earlier version wrote the
    tree's current `estimated_spend` over the crawl row on every save, so a
    crawl that cost $0.0026 to discover and then had five questions scored under
    it ended up recording whatever the LAST score happened to cost. The money
    ledger is the one number a developer view exists to be trusted about, so it
    adds what was just spent and nothing else.

    `user_id` and `anon_id` are ownership - one or the other, both nullable,
    written on the INSERT branch ONLY. Scoring takes the UPDATE branch against
    an existing crawl, so setting an owner there would let a question scored
    by user B rewrite whose search it was. Attribution ("who spent this
    $0.0026") lives on `usage_event`, which is a separate concern.

    Neither is part of `decompose`. That function is pure and its output is
    pinned by tests/test_storage.py; auth concepts have no business in the
    translation layer, so they travel as keyword arguments instead.
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
                                   location_code, source, billable_calls, spend,
                                   user_id, anon_id)
                VALUES (%s, %s, %s, %s, %s, %s, %s, %s, %s, %s)
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
                    user_id,
                    anon_id,
                ),
            )
            crawl_id = cur.fetchone()["id"]
        elif add_spend or add_calls:
            cur.execute(
                """
                UPDATE crawl
                   SET billable_calls = billable_calls + %s,
                       spend          = spend + %s
                 WHERE id = %s
                """,
                (add_calls, add_spend, crawl_id),
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
    ai_state: str | None,
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
                                   ai_sources, ai_state, source_key)
            VALUES (%s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s)
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
                ai_state,
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
               results, ai_sources, ai_state, source_key, scored_at
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


def can_access(slug: str, *, user_id: int | None, anon_id: str | None) -> bool:
    """Does this caller have an ownership claim on the slug?

    The detail-level counterpart of `load_trees`'s WHERE clause. Returns True
    if ANY crawl row exists for this slug where either identity matches - so
    the shared-corpus rule holds (User B searching the same seed as User A
    creates their own crawl row and gets in the same way), but a STRANGER
    with only the slug cannot enter. Same shape as `load_trees`; the whole
    point of writing it as one function is that "how do I check access"
    stops being a per-endpoint decision.

    Neither id present -> no claim, no access. That is the anonymous-with-
    no-cookie case; they get 404 for the same reason `load_trees(None)`
    returns []. The three archive demos live outside this gate - they are
    fixed evidence, not user trees, and callers of this function are
    expected to have already filtered them out.

    A single `EXISTS` query with `LIMIT 1` on the outer plan; the partial
    indexes on `user_id`/`anon_id` make it index-only.
    """
    if user_id is None and anon_id is None:
        return False
    with connect() as conn, conn.cursor() as cur:
        cur.execute(
            """
            SELECT 1 FROM crawl
             WHERE slug = %s
               AND (   (user_id IS NOT NULL AND user_id = %s)
                    OR (anon_id IS NOT NULL AND anon_id = %s))
             LIMIT 1
            """,
            (slug, user_id, anon_id),
        )
        return cur.fetchone() is not None


def live_tree_count() -> int:
    """How many live trees there are. A COUNT, not a rebuild.

    /api/meta used to answer this with `len(load_trees())`, which built every
    tree in full - seven trees, twenty-odd queries and two connections - to
    return one number. Measured at 8.9 seconds for a 612-byte response.
    """
    with connect() as conn, conn.cursor() as cur:
        cur.execute("SELECT count(DISTINCT slug) AS n FROM crawl")
        return cur.fetchone()["n"]


def load_trees(slug_for, *, user_id: int | None = None) -> list[dict]:
    """Live trees: the most recent crawl of each slug.

    Older crawls stay - they are the diff engine's raw material - but the
    product shows the current state, so the read path takes the latest.

    `user_id` makes the LIST private: a slug appears only if that person has a
    crawl row for it. Two people searching the same seed still share one tree
    and one cache - the second gets it for free - so what is private is WHO
    SEARCHED WHAT, which is the part that is actually sensitive. A signed-out
    caller gets nothing here; the three archive demos are served separately and
    are public on purpose.

    Note the subquery rather than a WHERE on the outer DISTINCT ON: the tree
    shown is still the LATEST crawl of that slug, whoever ran it, because the
    edges are one shared corpus. Filtering the outer query would show a
    returning user their own stale version of a tree somebody else refreshed.

    BATCHED. The obvious implementation calls `_assemble` per crawl, which is
    three queries each: with seven trees that is twenty-two round trips on one
    page load. This issues four queries total regardless of how many trees there
    are, then does the joining in Python where it costs nothing.
    """
    with connect() as conn, conn.cursor() as cur:
        if user_id is None:
            # Nobody signed in: no personal list at all. NOT "everything" -
            # an unauthenticated caller must never be the widest audience.
            return []
        cur.execute(
            """
            SELECT DISTINCT ON (slug) *
              FROM crawl
             WHERE slug IN (SELECT slug FROM crawl WHERE user_id = %s)
             ORDER BY slug, created_at DESC, id DESC
            """,
            (user_id,),
        )
        crawls = cur.fetchall()
        if not crawls:
            return []

        crawl_ids = [c["id"] for c in crawls]

        cur.execute(
            """
            SELECT e.crawl_id, e.depth, e.relevance, e.reach, e.discovered_by,
                   child.normalized AS child, child.text AS child_text,
                   child.id AS child_id, parent.normalized AS parent
              FROM paa_edge e
              JOIN question child ON child.id = e.child_id
              LEFT JOIN question parent ON parent.id = e.parent_id
             WHERE e.crawl_id = ANY(%s)
             ORDER BY e.crawl_id, e.depth, e.id
            """,
            (crawl_ids,),
        )
        edges_by_crawl: dict[int, list[dict]] = {}
        for row in cur.fetchall():
            edges_by_crawl.setdefault(row["crawl_id"], []).append(row)

        cur.execute(
            "SELECT crawl_id, phrase FROM related_search"
            " WHERE crawl_id = ANY(%s) ORDER BY phrase",
            (crawl_ids,),
        )
        related_by_crawl: dict[int, list[str]] = {}
        for row in cur.fetchall():
            related_by_crawl.setdefault(row["crawl_id"], []).append(row["phrase"])

        # Scores are keyed by question AND market, so one query covers every
        # tree at once - which is only true because gap_score is not keyed by
        # tree. The storage shape pays for itself again here.
        question_ids = sorted(
            {r["child_id"] for rows in edges_by_crawl.values() for r in rows}
        )
        markets = sorted({c["location_code"] for c in crawls})
        scores_by_market = _latest_scores_bulk(cur, markets, question_ids)

        trees = []
        for crawl in crawls:
            trees.append(
                _build(
                    crawl,
                    edges_by_crawl.get(crawl["id"], []),
                    related_by_crawl.get(crawl["id"], []),
                    scores_by_market.get(crawl["location_code"], {}),
                    slug_for,
                )
            )
        return trees


def _latest_scores_bulk(
    cur, markets: list[int], question_ids: list[int]
) -> dict[int, dict[int, dict]]:
    """Newest gap score per (market, question), for every tree in one query."""
    if not question_ids or not markets:
        return {}
    cur.execute(
        """
        SELECT DISTINCT ON (location_code, question_id)
               location_code, question_id, status, matching_pages,
               results_checked, results, ai_sources, ai_state, source_key, scored_at
          FROM gap_score
         WHERE location_code = ANY(%s) AND question_id = ANY(%s)
         ORDER BY location_code, question_id, scored_at DESC, id DESC
        """,
        (markets, question_ids),
    )
    out: dict[int, dict[int, dict]] = {}
    for row in cur.fetchall():
        out.setdefault(row["location_code"], {})[row["question_id"]] = row
    return out


def _build(crawl, edge_rows, related, scores_by_qid, slug_for) -> dict:
    """Shape one crawl's rows into a tree. Shared by the batched and single paths."""
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
    scores = {
        by_id[qid]: {
            "status": s["status"],
            "matching_pages": s["matching_pages"],
            "results_checked": s["results_checked"],
            "results": s["results"] or [],
            "ai_sources": s["ai_sources"] or [],
            "ai_state": s.get("ai_state"),
            "source_key": s["source_key"],
            "scored_at": (
                s["scored_at"].isoformat(timespec="seconds") if s["scored_at"] else None
            ),
        }
        for qid, s in scores_by_qid.items()
        if qid in by_id
    }
    tree = recompose(dict(crawl), questions, edges, scores, related, slug_for)
    tree["crawl_id"] = crawl["id"]
    tree["updated_at"] = (
        crawl["created_at"].isoformat(timespec="seconds")
        if crawl["created_at"]
        else None
    )
    return tree


def _assemble(cur, crawl: dict, slug_for) -> dict:
    """One crawl, three queries. Used by `load_tree`; `load_trees` batches instead."""
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

    cur.execute(
        "SELECT phrase FROM related_search WHERE crawl_id = %s ORDER BY phrase",
        (crawl["id"],),
    )
    related = [r["phrase"] for r in cur.fetchall()]

    found = _latest_scores(
        cur, crawl["location_code"], [r["child_id"] for r in edge_rows]
    )
    return _build(crawl, edge_rows, related, found, slug_for)


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


def snapshot_delete(cache_key: str) -> bool:
    """Drop one cached response so the next call re-buys it. Returns whether
    a row was actually removed.

    This exists because `refresh` was silently a no-op on the deployed service.
    `Client._cached` reads Postgres FIRST whenever `db.available()` and returns
    without ever looking at the filesystem, but `live.crawl`/`live.score`
    implemented refresh by unlinking a FILE. On a container that file does not
    exist, so the snapshot was returned anyway: `billable_calls` stayed 0, the
    spend stayed $0, and the user got the old answer while being told it was
    refreshed.

    That matters beyond correctness. CLAUDE.md prices the product as "cached
    results are free; refresh now costs 1 credit" - and after a seed's first
    crawl, refresh is very nearly the only billable action left. A credit model
    on top of a refresh that cannot spend has almost nothing to charge for.
    """
    with connect() as conn, conn.cursor() as cur:
        cur.execute("DELETE FROM serp_snapshot WHERE cache_key = %s", (cache_key,))
        removed = cur.rowcount > 0
        conn.commit()
        return removed


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
    user_id: int | None = None,
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
                                   location_code, status, cost, error,
                                   user_id)
            VALUES (%s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s)
            ON CONFLICT (task_id) DO NOTHING
            """,
            (
                task_id, cache_key, keyword, question_id, crawl_id, tree_slug,
                language_code, location_code, status, cost, error, user_id,
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
        # NOT "tasks": the jobs endpoint spreads this alongside the task LIST,
        # and a count silently replacing that list is a bug that type-checks.
        return {"task_count": row["n"], "spend": float(row["total"])}


def spend_summary(slug: str | None = None) -> dict:
    """What has been paid for, split by how it was bought.

    Scoped to one tree when `slug` is given. That is the figure a developer
    actually wants while looking at a tree - "what did THIS analysis cost" - and
    a panel showing the same global number on every page answers a question
    nobody was asking. The global total is still returned alongside it, because
    the point of the panel is that nothing is hidden.

    Both halves are REPORTED figures, not estimates: `crawl.spend` comes from
    the cost DataForSEO put on the live response, and `serp_task.cost` from what
    it put on each queued task. CLAUDE.md's rule is that the flat estimate is
    never trusted, and the developer view is the one place that would be most
    tempting to fill with a plausible-looking guess.
    """
    where_crawl = "WHERE slug = %s" if slug else ""
    where_task = "WHERE tree_slug = %s" if slug else ""
    args = (slug,) if slug else ()

    with connect() as conn, conn.cursor() as cur:
        cur.execute(
            f"""
            SELECT count(*) AS n,
                   COALESCE(sum(spend), 0) AS total,
                   COALESCE(sum(billable_calls), 0) AS requests
              FROM crawl {where_crawl}
            """,
            args,
        )
        crawls = cur.fetchone()
        cur.execute(
            f"""
            SELECT count(*) AS n,
                   COALESCE(sum(cost), 0) AS total,
                   count(*) FILTER (WHERE status = 'posted') AS pending,
                   count(*) FILTER (WHERE status = 'failed') AS failed
              FROM serp_task {where_task}
            """,
            args,
        )
        tasks = cur.fetchone()

        if slug:
            # Row counts for one tree: the questions its latest crawl reaches.
            cur.execute(
                """
                WITH latest AS (
                    SELECT id FROM crawl WHERE slug = %s
                     ORDER BY created_at DESC, id DESC LIMIT 1
                )
                SELECT count(DISTINCT e.child_id) AS n
                  FROM paa_edge e JOIN latest l ON l.id = e.crawl_id
                """,
                (slug,),
            )
            questions = cur.fetchone()
            cur.execute(
                "SELECT count(*) AS n FROM serp_task WHERE tree_slug = %s", (slug,)
            )
            snapshots = cur.fetchone()
            scores = {"n": None}
        else:
            cur.execute("SELECT count(*) AS n FROM serp_snapshot")
            snapshots = cur.fetchone()
            cur.execute("SELECT count(*) AS n FROM question")
            questions = cur.fetchone()
            cur.execute("SELECT count(*) AS n FROM gap_score")
            scores = cur.fetchone()

        cur.execute("SELECT COALESCE(sum(spend), 0) AS c FROM crawl")
        all_crawls = float(cur.fetchone()["c"])
        cur.execute("SELECT COALESCE(sum(cost), 0) AS c FROM serp_task")
        all_tasks = float(cur.fetchone()["c"])

    live_total = float(crawls["total"])
    task_total = float(tasks["total"])
    return {
        # `requests` rather than `crawls`, because this total is not only
        # discovery: a question checked one at a time is also a Live request and
        # its cost accumulates onto the crawl it was checked under. Labelling
        # the figure "searches" would understate what it covers.
        "live": {
            "crawls": crawls["n"],
            "requests": crawls["requests"],
            "spend": round(live_total, 6),
        },
        "standard": {
            "tasks": tasks["n"],
            "spend": round(task_total, 6),
            "pending": tasks["pending"],
            "failed": tasks["failed"],
            # What the same queued work would have cost on Live. The saving is
            # the whole argument for the Standard queue, so it is shown rather
            # than asserted.
            "if_live": round(tasks["n"] * 0.0020, 6),
        },
        "total": round(live_total + task_total, 6),
        "rows": {
            "questions": questions["n"],
            "gap_scores": scores["n"],
            "serp_snapshots": snapshots["n"],
        },
        "slug": slug,
        # Always present, whatever the scope. A transparency panel that can only
        # show you one slice is not transparent.
        "grand_total": round(all_crawls + all_tasks, 6),
    }


# ------------------------------------------------------------------ diff
#
# CLAUDE.md: "Historical PAA data exists nowhere else and becomes our most
# defensible asset over time." Edge rows are what make that true rather than
# aspirational - every crawl keeps its own edges, so two crawl ids and a set
# difference is the entire diff engine. There is nothing to build but a query.


def _paa_questions(cur, crawl_id: int) -> dict[str, dict]:
    """The questions GOOGLE returned for a crawl, keyed by normalized text.

    `discovered_by = 'paa'` is the whole point of this filter, and it is not a
    detail. Harvested questions come out of responses WE bought while scoring,
    so they appear when we spend money, not when Google changes its mind.
    Counting them as "new this week" would report our own activity back to the
    user as a market signal - the most misleading kind of wrong, because it
    would be indistinguishable from the real thing.
    """
    cur.execute(
        """
        SELECT DISTINCT ON (q.normalized)
               q.normalized, q.text, e.depth
          FROM paa_edge e
          JOIN question q ON q.id = e.child_id
         WHERE e.crawl_id = %s
           AND e.discovered_by = 'paa'
         ORDER BY q.normalized, e.depth
        """,
        (crawl_id,),
    )
    return {r["normalized"]: r for r in cur.fetchall()}


def diff_crawls(slug: str) -> dict | None:
    """What changed between the two most recent crawls of one seed.

    Returns None when there is only one crawl - nothing to compare is not an
    empty diff, and rendering it as "no changes" would claim a measurement that
    was never made.

    SETS, NOT SEQUENCES. CLAUDE.md is explicit that PAA ordering moves for an
    identical query and that notifying on it "would drown users in false
    alarms", so position is never compared. A question that merely moved from
    third to first is not a change and does not appear here at all.
    """
    with connect() as conn, conn.cursor() as cur:
        cur.execute(
            """
            SELECT id, created_at FROM crawl
             WHERE slug = %s
             ORDER BY created_at DESC, id DESC
             LIMIT 2
            """,
            (slug,),
        )
        crawls = cur.fetchall()
        if len(crawls) < 2:
            return None

        current, previous = crawls[0], crawls[1]
        now = _paa_questions(cur, current["id"])
        before = _paa_questions(cur, previous["id"])

    changes = compare_questions(now, before)

    return {
        "current": {
            "crawl_id": current["id"],
            "at": current["created_at"].isoformat(timespec="seconds"),
        },
        "previous": {
            "crawl_id": previous["id"],
            "at": previous["created_at"].isoformat(timespec="seconds"),
        },
        **changes,
        "crawl_count": crawl_count(slug),
    }


def compare_questions(now: dict[str, dict], before: dict[str, dict]) -> dict:
    """Set difference between two crawls' question sets. PURE.

    The rule this enforces is CLAUDE.md's, and it is the one most likely to be
    broken by someone trying to be helpful: ORDER CHANGES ARE NOISE AND MUST NOT
    NOTIFY. PAA ordering moves for an identical query, so a diff that compared
    sequences would report a change every single time and the alerts would be
    worthless within a week. Comparing sets makes that structurally impossible
    rather than merely intended.

    Kept free of SQL so exactly that can be tested.
    """

    def shape(rows: list[dict]) -> list[dict]:
        rows = sorted(rows, key=lambda r: (r["depth"], r["text"]))
        return [
            {"question": r["text"], "normalized": r["normalized"], "depth": r["depth"]}
            for r in rows
        ]

    return {
        # The valuable signal, and the one CLAUDE.md says to notify on.
        "added": shape([now[k] for k in now.keys() - before.keys()]),
        # A content-refresh signal: something that used to be asked is not any
        # more, and a page written for it is now aimed at nothing.
        "removed": shape([before[k] for k in before.keys() - now.keys()]),
        "unchanged": len(now.keys() & before.keys()),
    }


def crawl_count(slug: str) -> int:
    with connect() as conn, conn.cursor() as cur:
        cur.execute("SELECT count(*) AS n FROM crawl WHERE slug = %s", (slug,))
        return cur.fetchone()["n"]


def crawl_history(slug: str, limit: int = 20) -> list[dict]:
    """Every crawl of a seed, newest first. The asset, listed.

    Nothing else has this: Google does not publish PAA history and no competitor
    keeps it. It is a plain SELECT only because the tree was stored as edges.
    """
    with connect() as conn, conn.cursor() as cur:
        cur.execute(
            """
            SELECT c.id, c.created_at, c.spend, c.billable_calls,
                   count(DISTINCT e.child_id) AS questions
              FROM crawl c
              LEFT JOIN paa_edge e ON e.crawl_id = c.id
             WHERE c.slug = %s
             GROUP BY c.id
             ORDER BY c.created_at DESC, c.id DESC
             LIMIT %s
            """,
            (slug, limit),
        )
        return [
            {
                "crawl_id": r["id"],
                "at": r["created_at"].isoformat(timespec="seconds"),
                "questions": r["questions"],
                "spend": float(r["spend"] or 0),
                "billable_calls": r["billable_calls"],
            }
            for r in cur.fetchall()
        ]


def diff_and_history(slug: str) -> dict:
    """The diff and the crawl history, in ONE connection.

    Three separate helpers meant three pooled checkouts and three round trips
    for a 387-byte response. They are still separate functions because they are
    separately meaningful; this is the call the endpoint makes.
    """
    with connect() as conn, conn.cursor() as cur:
        cur.execute(
            """
            SELECT id, created_at FROM crawl
             WHERE slug = %s ORDER BY created_at DESC, id DESC LIMIT 2
            """,
            (slug,),
        )
        crawls = cur.fetchall()

        cur.execute(
            """
            SELECT c.id, c.created_at, c.spend, c.billable_calls,
                   count(DISTINCT e.child_id) AS questions
              FROM crawl c
              LEFT JOIN paa_edge e ON e.crawl_id = c.id
             WHERE c.slug = %s
             GROUP BY c.id
             ORDER BY c.created_at DESC, c.id DESC
             LIMIT 20
            """,
            (slug,),
        )
        history = [
            {
                "crawl_id": r["id"],
                "at": r["created_at"].isoformat(timespec="seconds"),
                "questions": r["questions"],
                "spend": float(r["spend"] or 0),
                "billable_calls": r["billable_calls"],
            }
            for r in cur.fetchall()
        ]

        diff = None
        if len(crawls) >= 2:
            current, previous = crawls[0], crawls[1]
            now = _paa_questions(cur, current["id"])
            before = _paa_questions(cur, previous["id"])
            diff = {
                "current": {
                    "crawl_id": current["id"],
                    "at": current["created_at"].isoformat(timespec="seconds"),
                },
                "previous": {
                    "crawl_id": previous["id"],
                    "at": previous["created_at"].isoformat(timespec="seconds"),
                },
                **compare_questions(now, before),
                "crawl_count": len(history),
            }

    return {"diff": diff, "history": history}


# ============================================================== accounts
#
# Every function below opens ONE connection and issues ONE statement. That is
# not a style preference: the api service runs in California and Postgres did
# not move with it, so each round trip measures ~150 ms (see the performance
# note in CLAUDE.md). A helper that "just" ran two queries would put a third of
# a second on the spending path, and the gate runs on every paid request.
#
# The decision logic itself is NOT here. It lives in answergap/gate.py, pure and
# testable without a database; these functions only gather what it needs.


def accounts_ready() -> bool:
    """Whether the accounts tables exist yet."""
    if not available():
        return False
    with connect() as conn, conn.cursor() as cur:
        cur.execute("SELECT to_regclass('public.app_user') IS NOT NULL AS ok")
        row = cur.fetchone()
        return bool(row and row["ok"])


def user_upsert(
    *,
    google_sub: str,
    email: str,
    name: str | None,
    picture_url: str | None,
    signup_credits: int,
) -> dict:
    """Find, LINK or create the account behind a Google identity.

    Three outcomes, and the middle one is what 0007 added:

    1. `google_sub` already known  -> that account, refreshed.
    2. The ADDRESS is known and belongs to a password account -> LINK. Google
       asserts `email_verified` and `oauth.claims_from_id_token` checks it, so
       Google has proven exactly what our own verification mail proves: control
       of the mailbox. Creating a second account here instead would split one
       person into two balances, which `app_user_email_key` now refuses anyway.
    3. Neither -> a new account, verified on the spot.

    `google_sub` is looked up FIRST and the address is only ever the fallback.
    That preserves 0005's reasoning intact: a Google account that changes its
    primary address is still recognised as the same person, because the subject
    id has not moved.

    FOUR SMALL STATEMENTS IN ONE TRANSACTION, NOT ONE CLEVER ONE.

    This was a single statement built out of chained data-modifying CTEs, for
    the one-round-trip reason that governs the rest of this file. It was WRONG,
    and it broke Google sign-in in production on 2026-09-15: `google_callback`
    turns a falsy return into `?auth=failed`, so the failure surfaced to users
    as "Sign-in did not finish" with the real error visible only in the logs.

    The trade was mis-made. The ~150 ms this saves is real on the SPENDING path,
    which runs on every search - but sign-in happens ONCE PER SESSION, and no
    human notices 300 ms inside an OAuth redirect that already crossed the
    network to Google and back. What the clever version cost instead was
    testability: it could not be verified by reading, and there is no Postgres
    on the development machine to run it against.

    CLAUDE.md already records two bugs against exactly this construct (see
    "Data-modifying CTEs share the main query's snapshot", 2026-09-08). That is
    now three. Chained data-modifying CTEs are not worth one round trip on a
    cold path - keep them for the hot ones, where the measurement justifies the
    risk.

    The multi-statement form also DELETES the snapshot trap rather than working
    around it: statements in one transaction see each other's writes, so the
    closing SELECT reads the ledger row this function just inserted. No adding
    the delta back on by hand, which is what the CTE version had to do.

    Returns `{}` on any failure, having logged it. A falsy return is already
    the caller's "sign-in did not finish" signal.
    """
    credits = max(0, int(signup_credits))
    try:
        with connect() as conn, conn.cursor() as cur:
            # 1. WHO IS THIS? Subject id first, address second.
            #
            # FOR UPDATE on both, and it fixes a real race rather than being
            # tidy: a plain SELECT never blocks under READ COMMITTED, so two
            # concurrent callbacks against the same row both read
            # `signup_granted_at IS NULL`, both decide to grant, and both
            # insert - twenty credits for one signup. `user_verify_email` took
            # this lock from the start; this function's step-3 comment below
            # claimed the same protection without ever taking it.
            cur.execute(
                "SELECT id, signup_granted_at, erased_at "
                "FROM app_user WHERE google_sub = %s FOR UPDATE",
                (google_sub,),
            )
            found = cur.fetchone()
            if not found:
                # Restricted to accounts with NO google_sub, so linking can
                # only ever absorb a password account - never re-point someone
                # else's Google row at a new subject id.
                #
                # An ERASED row matches here, because erasure blanks
                # `google_sub`. That is deliberate and it is the Google revival
                # door; step 2 turns the match into an explicit revival instead
                # of letting one happen by accident.
                cur.execute(
                    """
                    SELECT id, signup_granted_at, erased_at FROM app_user
                     WHERE google_sub IS NULL AND lower(email) = lower(%s)
                     FOR UPDATE
                    """,
                    (email,),
                )
                found = cur.fetchone()

            # 2. REFRESH OR CREATE. `grant` is decided from the row as it was
            #    BEFORE this write, which is the whole point of reading first.
            if found:
                user_id = int(found["id"])
                grant = credits > 0 and found["signup_granted_at"] is None
                cur.execute(
                    """
                    UPDATE app_user
                       SET google_sub        = %(sub)s,
                           email             = %(email)s,
                           -- COALESCE, not assignment: a password account being
                           -- linked may already carry a name and a picture, and
                           -- Google sending null for either must not blank what
                           -- the person set.
                           name              = COALESCE(%(name)s, name),
                           picture_url       = COALESCE(%(pic)s, picture_url),
                           email_verified_at = COALESCE(email_verified_at, now()),
                           signup_granted_at = CASE WHEN %(grant)s THEN now()
                                                    ELSE signup_granted_at END,
                           last_seen_at      = now()
                     WHERE id = %(id)s
                    """,
                    {
                        "sub": google_sub,
                        "email": email,
                        "name": name,
                        "pic": picture_url,
                        "grant": grant,
                        "id": user_id,
                    },
                )

                # THE GOOGLE REVIVAL DOOR, and it is explicit because without
                # it this path was silently broken: the address fallback above
                # already matched an erased row, so a Google sign-in would link
                # a subject id, re-verify the address and hand out a session
                # while leaving `status = 'erased'`. A zombie account with the
                # old balance and nothing in the audit log to say so.
                #
                # `grant` was decided above from `signup_granted_at`, which
                # erasure preserved, so revival is paid nothing here either.
                if found["erased_at"] is not None:
                    _revive(cur, user_id=user_id, via="google", actor=email)
            else:
                grant = credits > 0
                cur.execute(
                    """
                    INSERT INTO app_user (google_sub, email, name, picture_url,
                                          email_verified_at, signup_granted_at,
                                          last_seen_at)
                    VALUES (%(sub)s, %(email)s, %(name)s, %(pic)s, now(),
                            CASE WHEN %(grant)s THEN now() END, now())
                    RETURNING id
                    """,
                    {
                        "sub": google_sub,
                        "email": email,
                        "name": name,
                        "pic": picture_url,
                        "grant": grant,
                    },
                )
                created = cur.fetchone()
                if not created:
                    return {}
                user_id = int(created["id"])

            # 3. PAY THE SIGNUP GRANT, at most once ever. Guarded by
            #    `signup_granted_at`, which step 2 has just claimed in the same
            #    transaction - so a concurrent second sign-in blocks on that
            #    row's lock and then reads it as already granted.
            if grant:
                cur.execute(
                    """
                    INSERT INTO credit_ledger (user_id, delta, reason)
                    VALUES (%s, %s, 'signup')
                    """,
                    (user_id, credits),
                )

            # 4. READ BACK. Same transaction, so this sees the insert above -
            #    which is exactly what the CTE version could NOT do.
            cur.execute(
                """
                SELECT u.id, u.email, u.status, u.token_epoch,
                       TRUE AS email_verified,
                       COALESCE((SELECT sum(delta) FROM credit_ledger
                                  WHERE user_id = u.id), 0) AS balance
                  FROM app_user u
                 WHERE u.id = %s
                """,
                (user_id,),
            )
            row = cur.fetchone()
            conn.commit()
            return dict(row) if row else {}
    except Exception as exc:  # noqa: BLE001 - reported as a failed sign-in
        # The address colliding with a DIFFERENT Google account is the one
        # failure that is a real situation rather than a bug: the unique index
        # refuses, and a silent merge of two balances is not a decision a
        # sign-in handler gets to make. Everything else is ours and the log is
        # the only place it can be seen, so it is printed with its type.
        print(
            f"[auth] user_upsert failed for {google_sub[:8]}...: "
            f"{type(exc).__name__}: {exc}",
            flush=True,
        )
        return {}


def user_for_gate(user_id: int) -> dict | None:
    """The row plus its balance, in one round trip.

    Status is read live on every spending request, which is what makes a
    suspension take effect immediately rather than whenever a token happens to
    expire. token_epoch comes back for the same reason - it is the only
    revocation there is, since there is no session table.
    """
    with connect() as conn, conn.cursor() as cur:
        cur.execute(
            """
            SELECT u.id, u.email, u.name, u.picture_url, u.status, u.token_epoch,
                   -- A boolean rather than the timestamp: the gate asks "may
                   -- this person spend", not "when did they confirm". Anything
                   -- reading the date would be reading it to re-derive this.
                   (u.email_verified_at IS NOT NULL) AS email_verified,
                   -- Whether a password is set at all, NEVER the hash. This
                   -- row travels to /api/me and into the admin panel; a hash
                   -- that is not fetched cannot be logged, serialised or
                   -- leaked by a future caller who did not think about it.
                   (u.password_hash IS NOT NULL) AS has_password,
                   (u.google_sub IS NOT NULL) AS has_google,
                   COALESCE((SELECT sum(delta) FROM credit_ledger
                              WHERE user_id = u.id), 0) AS balance
              FROM app_user u
             WHERE u.id = %s
            """,
            (user_id,),
        )
        row = cur.fetchone()
        return dict(row) if row else None


def record_usage(
    *,
    user_id: int | None,
    ip_hash: str | None,
    anon_id: str | None,
    action: str,
    outcome: str,
    credits: int,
    spend_usd: float,
    tree_slug: str | None = None,
    question_slug: str | None = None,
    is_admin: bool = False,
) -> None:
    """Write the event and its debit together, in one statement.

    A data-modifying CTE, so the two cannot half-happen: an event with no debit
    is a search nobody was billed for, and a debit with no event is a charge
    with no receipt behind it.

    A zero-credit action writes NO ledger row - a zero delta is noise in an
    append-only money log. An admin writes a usage_event carrying real dollars
    but no ledger row either, so admin spend stays attributed without inventing
    a balance for someone who never bought credits.

    The debit is UNCONDITIONAL and the balance may go negative. By the time this
    runs the money is already spent upstream; clamping at zero would erase the
    record of an overspend, which is exactly the mistake this file documents
    against crawl.spend. Two tabs racing can cost one extra $0.0026, and it will
    be visible rather than silently absorbed.
    """
    with connect() as conn, conn.cursor() as cur:
        cur.execute(
            """
            WITH ev AS (
                INSERT INTO usage_event (user_id, ip_hash, anon_id, action,
                                         outcome, credits, spend_usd,
                                         tree_slug, question_slug)
                VALUES (%(uid)s, %(ip)s, %(anon)s, %(action)s, %(outcome)s,
                        %(credits)s, %(spend)s, %(slug)s, %(qslug)s)
                RETURNING id
            )
            INSERT INTO credit_ledger (user_id, delta, reason, ref)
            SELECT %(uid)s, -%(credits)s, %(action)s, %(slug)s
             WHERE %(uid)s IS NOT NULL
               AND %(credits)s > 0
               AND %(admin)s = false
            """,
            {
                "uid": user_id,
                "ip": ip_hash,
                "anon": anon_id,
                "action": action,
                "outcome": outcome,
                "credits": int(credits),
                "spend": spend_usd,
                "slug": tree_slug,
                "qslug": question_slug,
                "admin": bool(is_admin),
            },
        )
        conn.commit()


def settings_all() -> dict[str, str]:
    """Every runtime setting at its latest value. Latest wins, gap_score shape."""
    with connect() as conn, conn.cursor() as cur:
        cur.execute(
            """
            SELECT DISTINCT ON (setting_key) setting_key, setting_value
              FROM app_setting
             ORDER BY setting_key, created_at DESC, id DESC
            """
        )
        return {r["setting_key"]: r["setting_value"] for r in cur.fetchall()}


# ------------------------------------------------------------ one-time codes


def auth_code_put(*, code_hash: str, user_id: int, ttl_seconds: int = 60) -> None:
    """Store a single-use login code for the admin service to redeem."""
    with connect() as conn, conn.cursor() as cur:
        cur.execute(
            """
            INSERT INTO auth_code (code_hash, user_id, expires_at)
            VALUES (%s, %s, now() + make_interval(secs => %s))
            """,
            (code_hash, user_id, ttl_seconds),
        )
        conn.commit()


def auth_code_redeem(code_hash: str) -> int | None:
    """Burn a code and return its user, or None.

    Single-use by construction rather than by convention: `WHERE used_at IS
    NULL ... RETURNING` means two concurrent redemptions cannot both succeed,
    because only one UPDATE can match the row.
    """
    with connect() as conn, conn.cursor() as cur:
        cur.execute(
            """
            UPDATE auth_code SET used_at = now()
             WHERE code_hash = %s AND used_at IS NULL AND expires_at > now()
            RETURNING user_id
            """,
            (code_hash,),
        )
        row = cur.fetchone()
        conn.commit()
        return int(row["user_id"]) if row else None


# ------------------------------------------------------- password accounts
#
# Added 0007. Everything here follows the same one-connection-one-statement
# rule as the Google path above, for the same ~150 ms reason.
#
# TOKEN PURPOSES AND THEIR LIFETIMES. Both are written down here rather than
# in the API layer because they describe `email_token`, and a TTL kept
# somewhere else is a TTL that can disagree with the mail that quotes it.

PURPOSE_VERIFY = "verify"
PURPOSE_RESET = "reset"

# 24 hours. Long enough to survive a mail that arrives while someone is
# asleep, which is the common case and the one a short window punishes.
VERIFY_TTL_SECONDS = 24 * 60 * 60

# 1 hour, and deliberately far shorter. A reset link is a live credential for
# an account someone else may be trying to reach; a verification link only
# confirms an address the holder already gave us.
RESET_TTL_SECONDS = 60 * 60


def user_by_email(email: str) -> dict | None:
    """The account behind an address, WITH its password hash.

    The one function that fetches `password_hash`, because verifying a sign-in
    is the one thing that needs it. Everything else goes through
    `user_for_gate`, which returns only whether a password exists.
    """
    with connect() as conn, conn.cursor() as cur:
        cur.execute(
            """
            SELECT u.id, u.email, u.name, u.status, u.token_epoch,
                   u.password_hash, u.google_sub,
                   (u.email_verified_at IS NOT NULL) AS email_verified,
                   COALESCE((SELECT sum(delta) FROM credit_ledger
                              WHERE user_id = u.id), 0) AS balance
              FROM app_user u
             WHERE lower(u.email) = lower(%s)
            """,
            (email,),
        )
        row = cur.fetchone()
        return dict(row) if row else None


def user_create_password(
    *, email: str, password_hash: str, name: str | None
) -> dict | None:
    """Create an UNVERIFIED password account. Grants NOTHING.

    No credits here, and that is the security decision rather than an
    omission: the signup grant is 10 free searches that cost real money, so
    handing it out before the address is proven turns a throwaway mailbox
    into a free-search farm. `user_verify_email` is where the grant happens,
    once, guarded by `signup_granted_at`.

    Returns None when the address is taken - the unique index refuses, and
    the caller turns that into the SAME reply a fresh signup gets, because
    a different reply would make this endpoint an account-enumeration oracle.
    """
    try:
        with connect() as conn, conn.cursor() as cur:
            cur.execute(
                """
                INSERT INTO app_user (email, name, password_hash, last_seen_at)
                VALUES (%(email)s, %(name)s, %(hash)s, now())
                RETURNING id, email, status, token_epoch
                """,
                {"email": email, "name": name, "hash": password_hash},
            )
            row = cur.fetchone()
            conn.commit()
            return dict(row) if row else None
    except Exception:  # noqa: BLE001 - a taken address is not an error here
        return None


def user_set_password(*, user_id: int, password_hash: str, revoke: bool) -> bool:
    """Write a new password hash.

    `revoke` bumps `token_epoch`, which invalidates every session already
    issued to this account. A password RESET must pass True: the whole point
    of the flow is that someone may have lost control of the account, and
    leaving the attacker's existing session alive would make the reset
    cosmetic. A voluntary change from inside a live session passes False, or
    the user signs themselves out by changing their own password.
    """
    with connect() as conn, conn.cursor() as cur:
        cur.execute(
            """
            UPDATE app_user
               SET password_hash = %(hash)s,
                   token_epoch   = token_epoch + CASE WHEN %(revoke)s THEN 1
                                                      ELSE 0 END
             WHERE id = %(id)s
            RETURNING id
            """,
            {"hash": password_hash, "id": int(user_id), "revoke": bool(revoke)},
        )
        row = cur.fetchone()
        conn.commit()
        return bool(row)


def user_verify_email(*, user_id: int, signup_credits: int) -> dict | None:
    """Mark an address proven and pay the signup grant - at most once, ever.

    THE GUARD IS `signup_granted_at`, READ BEFORE IT IS WRITTEN. A second click
    on the same link - or a mail client prefetching it, or a replayed request -
    must be a no-op, not a second helping of free searches. Reading the column
    first and deciding from that value is what makes it one.

    Statements, not chained data-modifying CTEs, for the reason written at
    length on `user_upsert`: the clever version of that function broke Google
    sign-in in production on 2026-09-15, and this one had the same shape. One
    transaction still makes it atomic - a crash between marking the address
    verified and paying the grant rolls back both, which matters because the
    ledger is append-only and there is no "fix it later" for money.

    The closing SELECT runs inside the same transaction, so it SEES the ledger
    row just written. The CTE version could not, and had to add the delta back
    on by hand.
    """
    credits = max(0, int(signup_credits))
    try:
        with connect() as conn, conn.cursor() as cur:
            # FOR UPDATE, and it is the concurrency half of "at most once".
            # Two requests redeeming at the same moment would otherwise both
            # read `signup_granted_at IS NULL` and both insert a grant. The
            # row lock makes the second one wait and then read the truth.
            cur.execute(
                "SELECT id, email, signup_granted_at, erased_at "
                "FROM app_user WHERE id = %s FOR UPDATE",
                (int(user_id),),
            )
            found = cur.fetchone()
            if not found:
                return None

            grant = credits > 0 and found["signup_granted_at"] is None
            cur.execute(
                """
                UPDATE app_user
                   SET email_verified_at = COALESCE(email_verified_at, now()),
                       signup_granted_at = CASE WHEN %(grant)s THEN now()
                                                ELSE signup_granted_at END,
                       last_seen_at      = now()
                 WHERE id = %(id)s
                """,
                {"grant": grant, "id": int(user_id)},
            )

            # THE PRIMARY REVIVAL DOOR. Erasure clears `email_verified_at`, so
            # a returning person signing up again with the erased address takes
            # the signup endpoint's unverified branch and is mailed a fresh
            # link. Redeeming it lands HERE, which is the point: revival
            # happens only where control of the mailbox has just been proven.
            #
            # Before the closing SELECT so the read-back reports the RESTORED
            # status - the endpoint refuses anything that is not active, and a
            # normal revival must not be refused. A suspended-before-erasure
            # account still is, which is correct.
            #
            # `grant` was decided above from `signup_granted_at`, which erasure
            # preserved, so a revived account is paid nothing. That is the
            # anti-farming guard working through this door.
            did_revive = False
            if found["erased_at"] is not None:
                did_revive = (
                    _revive(
                        cur,
                        user_id=int(user_id),
                        via="verify",
                        actor=found["email"] or "",
                    )
                    is not None
                )

            if grant:
                cur.execute(
                    """
                    INSERT INTO credit_ledger (user_id, delta, reason)
                    VALUES (%s, %s, 'signup')
                    """,
                    (int(user_id), credits),
                )

            cur.execute(
                """
                SELECT u.id, u.email, u.status, u.token_epoch,
                       TRUE AS email_verified,
                       COALESCE((SELECT sum(delta) FROM credit_ledger
                                  WHERE user_id = u.id), 0) AS balance
                  FROM app_user u
                 WHERE u.id = %s
                """,
                (int(user_id),),
            )
            row = cur.fetchone()
            conn.commit()
            if not row:
                return None
            out = dict(row)
            out["did_grant"] = grant
            out["did_revive"] = did_revive
            return out
    except Exception as exc:  # noqa: BLE001 - reported as a failed verification
        print(
            f"[auth] user_verify_email failed for {user_id}: "
            f"{type(exc).__name__}: {exc}",
            flush=True,
        )
        return None


def email_token_put(
    *, token_hash: str, user_id: int, purpose: str, email: str, ttl_seconds: int
) -> None:
    """Record an emailed one-time token, hashed.

    Any UNUSED token of the same purpose for the same user is deleted first.
    Pressing "resend" three times must not leave three live links: the newest
    mail is the one the person is looking at, and the older ones are loose
    credentials sitting in a mailbox with nothing to invalidate them.
    """
    with connect() as conn, conn.cursor() as cur:
        cur.execute(
            "DELETE FROM email_token WHERE user_id = %s AND purpose = %s "
            "AND used_at IS NULL",
            (int(user_id), purpose),
        )
        cur.execute(
            """
            INSERT INTO email_token (token_hash, user_id, purpose, email,
                                     expires_at)
            VALUES (%(hash)s, %(id)s, %(purpose)s, %(email)s,
                    now() + make_interval(secs => %(ttl)s))
            """,
            {
                "hash": token_hash,
                "id": int(user_id),
                "purpose": purpose,
                "email": email,
                "ttl": int(ttl_seconds),
            },
        )
        conn.commit()


def email_token_redeem(*, token_hash: str, purpose: str) -> int | None:
    """Burn a token and return its user, or None.

    Single-use by construction, the same `WHERE used_at IS NULL ... RETURNING`
    as `auth_code_redeem`: two concurrent redemptions cannot both match.

    `purpose` is part of the WHERE rather than checked afterwards. Without it
    a verification token - the weaker of the two, mailed on a 24-hour TTL to
    an address nobody has proven yet - would be redeemable at the password
    reset endpoint, which is the whole account.

    The address is compared against the row's CURRENT one, so a link mailed
    to an address that has since changed is dead.
    """
    with connect() as conn, conn.cursor() as cur:
        cur.execute(
            """
            UPDATE email_token t SET used_at = now()
              FROM app_user u
             WHERE t.token_hash = %(hash)s
               AND t.purpose    = %(purpose)s
               AND t.used_at IS NULL
               AND t.expires_at > now()
               AND u.id = t.user_id
               AND lower(u.email) = lower(t.email)
            RETURNING t.user_id
            """,
            {"hash": token_hash, "purpose": purpose},
        )
        row = cur.fetchone()
        conn.commit()
        return int(row["user_id"]) if row else None


def email_token_settled(*, token_hash: str, purpose: str) -> bool:
    """Did this token's owner already get what the token was for?

    Read-only, and deliberately blind to `used_at` and `expires_at` — the row
    survives redemption, so it can still say WHO a refused token belonged to.

    It exists because "this link no longer works" has two completely different
    causes and only one of them is a problem. A mail scanner that prefetches
    the link to preview it verifies the account and burns the token before the
    human ever clicks; the human's click then fails against an account that is
    already fine. Offering that person a fresh link is wrong twice over — they
    do not need one, and `resend_verification` refuses to mail a verified
    account anyway, so they would wait on a message that never comes.

    Returns False for a token nobody ever issued, which is the safe reading:
    an unknown token proves nothing about anybody.
    """
    with connect() as conn, conn.cursor() as cur:
        cur.execute(
            """
            SELECT (u.email_verified_at IS NOT NULL) AS settled
              FROM email_token t
              JOIN app_user u ON u.id = t.user_id
             WHERE t.token_hash = %(hash)s
               AND t.purpose    = %(purpose)s
            """,
            {"hash": token_hash, "purpose": purpose},
        )
        row = cur.fetchone()
        return bool(row and row["settled"])


def email_token_recent(*, user_id: int, purpose: str, window_seconds: int) -> int:
    """How many of these we have mailed this user lately.

    The mail-bomb control. The endpoints that send are open by necessity -
    "resend my verification" cannot require a session, and "I forgot my
    password" cannot require the password - so without a cap here, anyone
    could point our sending reputation at an address as a weapon and burn
    the provider quota doing it.
    """
    with connect() as conn, conn.cursor() as cur:
        cur.execute(
            """
            SELECT count(*) AS n FROM email_token
             WHERE user_id = %(id)s AND purpose = %(purpose)s
               AND created_at > now() - make_interval(secs => %(window)s)
            """,
            {"id": int(user_id), "purpose": purpose, "window": int(window_seconds)},
        )
        row = cur.fetchone()
        return int(row["n"]) if row else 0


# ---------------------------------------------------------------- admin reads
#
# The rule for this whole surface: one screen = one API call = one statement.
# Three hops separate the admin's browser from Postgres (browser -> admin
# service -> api service -> database) and only the last one is the 150 ms hop,
# but a page that issues four API calls still pays 600 ms before it renders.


def admin_overview() -> dict:
    """Every counter on the dashboard, in ONE statement.

    The obvious implementation is eight SELECT count(*) calls. spend_summary
    already shows what that costs - it issues seven queries in one connection,
    which is roughly a second from here. Scalar subqueries collapse it to a
    single round trip.
    """
    with connect() as conn, conn.cursor() as cur:
        cur.execute(
            """
            SELECT
              (SELECT count(*) FROM app_user) AS users_total,
              (SELECT count(*) FROM app_user WHERE status = 'active') AS users_active,
              (SELECT count(*) FROM app_user WHERE status = 'suspended') AS users_suspended,
              -- Counted separately, or erased accounts vanish from a breakdown
              -- that still sums them into `users_total`.
              (SELECT count(*) FROM app_user WHERE status = 'erased') AS users_erased,
              (SELECT count(*) FROM app_user
                WHERE created_at > now() - interval '7 days') AS users_new_7d,
              (SELECT COALESCE(sum(delta) FILTER (WHERE delta > 0), 0)
                 FROM credit_ledger) AS credits_granted,
              (SELECT COALESCE(-sum(delta) FILTER (WHERE delta < 0), 0)
                 FROM credit_ledger) AS credits_spent,
              (SELECT count(*) FROM usage_event
                WHERE day_utc = (now() AT TIME ZONE 'utc')::date
                  AND outcome = 'allowed') AS allowed_today,
              -- `user_id IS NULL` alone stopped meaning "signed-out visitor"
              -- when erasure arrived: it blanks user_id, anon_id AND ip_hash,
              -- leaving rows that are UNATTRIBUTED rather than anonymous.
              -- Counting those as signed-out traffic would inflate the one
              -- number the free-tier limit is set from.
              (SELECT count(*) FROM usage_event
                WHERE day_utc = (now() AT TIME ZONE 'utc')::date
                  AND user_id IS NULL AND outcome = 'allowed'
                  AND (anon_id IS NOT NULL OR ip_hash IS NOT NULL)
              ) AS anonymous_today,
              (SELECT count(*) FROM usage_event
                WHERE day_utc = (now() AT TIME ZONE 'utc')::date
                  AND outcome <> 'allowed') AS refused_today,
              (SELECT COALESCE(sum(spend_usd), 0) FROM usage_event) AS spend_attributed,
              (SELECT COALESCE(sum(spend), 0) FROM crawl) AS spend_live,
              (SELECT COALESCE(sum(cost), 0) FROM serp_task) AS spend_standard
            """
        )
        row = cur.fetchone() or {}
        granted = int(row.get("credits_granted") or 0)
        spent = int(row.get("credits_spent") or 0)
        return {
            "users": {
                "total": int(row.get("users_total") or 0),
                "active": int(row.get("users_active") or 0),
                "suspended": int(row.get("users_suspended") or 0),
                "erased": int(row.get("users_erased") or 0),
                "new_7d": int(row.get("users_new_7d") or 0),
            },
            "credits": {
                "granted": granted,
                "spent": spent,
                "outstanding": granted - spent,
            },
            "usage": {
                "allowed_today": int(row.get("allowed_today") or 0),
                "anonymous_today": int(row.get("anonymous_today") or 0),
                "refused_today": int(row.get("refused_today") or 0),
            },
            "spend": {
                "attributed_usd": float(row.get("spend_attributed") or 0),
                "live_usd": float(row.get("spend_live") or 0),
                "standard_usd": float(row.get("spend_standard") or 0),
            },
        }


def admin_users(
    *, q: str = "", status: str = "", limit: int = 50, offset: int = 0
) -> list[dict]:
    """The user list with balance and spend, in ONE statement.

    PAGE FIRST, THEN JOIN. Writing the laterals directly against app_user would
    run both subqueries for EVERY user before the LIMIT applies - that is the
    trap, and it is the same trap that made /api/meta take 8.9 seconds by
    answering "how many trees" with all of them.
    """
    with connect() as conn, conn.cursor() as cur:
        cur.execute(
            """
            WITH page AS (
                SELECT id, email, name, picture_url, status, created_at,
                       last_seen_at,
                       -- Added with password accounts. An operator asked "why
                       -- can this person not spend?" has exactly two answers -
                       -- suspended, or never confirmed their address - and
                       -- without this column the second one is invisible.
                       (email_verified_at IS NOT NULL) AS email_verified,
                       (password_hash IS NOT NULL) AS has_password,
                       (google_sub IS NOT NULL) AS has_google
                  FROM app_user
                 WHERE (%(q)s = '' OR email ILIKE '%%' || %(q)s || '%%')
                   AND (%(status)s = '' OR status = %(status)s)
                 ORDER BY created_at DESC, id DESC
                 LIMIT %(limit)s OFFSET %(offset)s
            )
            SELECT p.*,
                   COALESCE(l.balance, 0)  AS balance,
                   COALESCE(v.searches, 0) AS searches,
                   COALESCE(v.spend_usd, 0) AS spend_usd
              FROM page p
              LEFT JOIN LATERAL (
                    SELECT sum(delta) AS balance
                      FROM credit_ledger WHERE user_id = p.id
              ) l ON true
              LEFT JOIN LATERAL (
                    SELECT count(*) AS searches, sum(spend_usd) AS spend_usd
                      FROM usage_event
                     WHERE user_id = p.id AND outcome = 'allowed'
              ) v ON true
             ORDER BY p.created_at DESC, p.id DESC
            """,
            {"q": q or "", "status": status or "", "limit": limit, "offset": offset},
        )
        return [dict(r) for r in cur.fetchall()]


def admin_user_detail(user_id: int) -> dict | None:
    """Profile, ledger, usage and crawls in ONE statement via json_agg.

    Four separate queries in one connection is the shape diff_and_history uses
    and it costs ~600 ms from here. This is the same data for ~150 ms.
    """
    with connect() as conn, conn.cursor() as cur:
        cur.execute(
            """
            SELECT u.id, u.email, u.name, u.picture_url, u.status, u.token_epoch,
                   u.created_at, u.last_seen_at, u.erased_at,
                   (u.email_verified_at IS NOT NULL) AS email_verified,
                   -- Which doors this account has. NEVER the hash itself: this
                   -- row travels to the admin browser, and a value that is not
                   -- fetched cannot be logged or leaked by a later caller who
                   -- did not think about it.
                   (u.password_hash IS NOT NULL) AS has_password,
                   (u.google_sub IS NOT NULL) AS has_google,
                   COALESCE((SELECT sum(delta) FROM credit_ledger
                              WHERE user_id = u.id), 0) AS balance,
                   COALESCE((SELECT json_agg(x) FROM (
                        SELECT delta, reason, ref, note, created_at
                          FROM credit_ledger WHERE user_id = u.id
                         ORDER BY created_at DESC, id DESC LIMIT 50) x), '[]') AS ledger,
                   COALESCE((SELECT json_agg(x) FROM (
                        SELECT action, outcome, credits, spend_usd, tree_slug,
                               question_slug, created_at
                          FROM usage_event WHERE user_id = u.id
                         ORDER BY created_at DESC, id DESC LIMIT 50) x), '[]') AS usage,
                   COALESCE((SELECT json_agg(x) FROM (
                        SELECT id, slug, seed, language_code, location_code,
                               spend, created_at
                          FROM crawl WHERE user_id = u.id
                         ORDER BY created_at DESC LIMIT 50) x), '[]') AS crawls
              FROM app_user u
             WHERE u.id = %s
            """,
            (user_id,),
        )
        row = cur.fetchone()
        return dict(row) if row else None


# --------------------------------------------------------------- reporting
#
# Three questions the operator has to be able to answer at a month end: what
# did we spend, who spent it, and how much of it came back as revenue.
#
# ALL THREE READ `usage_event`, WHICH IS THE ONLY TABLE THAT CAN ANSWER THEM.
# `crawl.spend` cannot: `live.score` adds its spend to an EXISTING crawl row,
# so a crawl's total is the seed search plus every later scoring, with no way
# to split them or to say who ran which.
#
# WHO AN EVENT BELONGS TO IS A FOUR-WAY SPLIT, not two, and getting it to two
# is how a budget stops adding up:
#
#   customer     a signed-in account that is not an admin
#   admin        a signed-in account whose address is in ADMIN_EMAILS. Admins
#                are NOT billed but their dollars ARE recorded, so this money
#                is real spend that no credit ever paid for. Counting it as
#                customer usage would overstate demand and understate margin.
#   anonymous    the free daily search, signed out
#   unattributed erased accounts. `user_erase` blanks user_id, anon_id AND
#                ip_hash, so these rows belong to nobody by design. They are
#                still money we spent, so they stay in the totals rather than
#                being quietly dropped.
#
# ADMIN_EMAILS IS PASSED IN, NOT READ FROM THE DATABASE. There is no is_admin
# column on `usage_event` - `record_usage` takes the flag but uses it only to
# suppress the ledger row - and admin is an environment variable on the api
# service rather than a row. So the caller supplies the list; `api/admin.py`
# already imports it.


def _admin_filter(admin_emails: set[str] | None) -> tuple[str, list[str]]:
    """The SQL fragment that decides whether a row is an admin's.

    Returns `(expression, params)`. Folded with `lower()` the same way
    `gate.is_admin` and `app_user_email_key` fold, or the report would disagree
    with the gate about who an admin is.
    """
    addresses = sorted({a.strip().lower() for a in (admin_emails or set()) if a.strip()})
    if not addresses:
        return "false", []
    return "lower(u.email) = ANY(%s)", [addresses]


def admin_usage_by_month(
    *, months: int = 12, admin_emails: set[str] | None = None
) -> list[dict]:
    """Spend and volume per calendar month, newest first.

    The budget table. `billable` counts the requests that actually cost money;
    `attempts` counts every request including the ones a cache answered for
    free and the ones the gate refused. The gap between them is the cache
    working, and it is the number that says whether the corpus is paying off.

    Revenue is joined in from `payment_event` by month rather than summed in
    the same pass, because a payment has no usage row to hang on and a LEFT
    JOIN on a month key is the only honest way to put them in one table.
    """
    is_admin, params = _admin_filter(admin_emails)
    with connect() as conn, conn.cursor() as cur:
        cur.execute(
            f"""
            WITH usage AS (
                -- `day_utc`, not `created_at`: it is the only indexed date
                -- column on this table AND it is already UTC. Bucketing on
                -- the timestamp would miss the index and put a 23:30 UTC
                -- request in a different month from the counter that
                -- rate-limited it.
                SELECT date_trunc('month', e.day_utc) AS month,
                       count(*) FILTER (WHERE e.spend_usd > 0)  AS billable,
                       count(*)                                  AS attempts,
                       count(*) FILTER (WHERE e.outcome <> 'allowed') AS refused,
                       COALESCE(sum(e.spend_usd), 0)             AS cost_usd,
                       COALESCE(sum(e.credits), 0)               AS credits_spent,
                       -- The four-way split, each summing DOLLARS rather than
                       -- rows: "where did the money go" is the question, and a
                       -- refused request costs nothing but still counts once.
                       COALESCE(sum(e.spend_usd) FILTER (
                           WHERE e.user_id IS NOT NULL AND NOT ({is_admin})), 0)
                           AS cost_customer,
                       COALESCE(sum(e.spend_usd) FILTER (
                           WHERE e.user_id IS NOT NULL AND ({is_admin})), 0)
                           AS cost_admin,
                       COALESCE(sum(e.spend_usd) FILTER (
                           WHERE e.user_id IS NULL
                             AND (e.anon_id IS NOT NULL OR e.ip_hash IS NOT NULL)), 0)
                           AS cost_anonymous,
                       COALESCE(sum(e.spend_usd) FILTER (
                           WHERE e.user_id IS NULL
                             AND e.anon_id IS NULL AND e.ip_hash IS NULL), 0)
                           AS cost_unattributed,
                       count(DISTINCT e.user_id) AS active_accounts
                  FROM usage_event e
                  LEFT JOIN app_user u ON u.id = e.user_id
                 WHERE e.day_utc >= (date_trunc('month', now())
                                     - make_interval(months => %s))::date
                 GROUP BY 1
            ),
            paid AS (
                -- `livemode` only. A test payment in a revenue figure is how
                -- the figure becomes a lie, which is why the column is stored.
                SELECT date_trunc('month', created_at) AS month,
                       COALESCE(sum(amount_cents), 0)  AS revenue_cents,
                       count(*)                        AS payments
                  FROM payment_event
                 WHERE livemode IS TRUE
                   AND created_at >= date_trunc('month', now())
                                     - make_interval(months => %s)
                 GROUP BY 1
            )
            SELECT COALESCE(usage.month, paid.month) AS month,
                   COALESCE(usage.billable, 0)          AS billable,
                   COALESCE(usage.attempts, 0)          AS attempts,
                   COALESCE(usage.refused, 0)           AS refused,
                   COALESCE(usage.cost_usd, 0)          AS cost_usd,
                   COALESCE(usage.credits_spent, 0)     AS credits_spent,
                   COALESCE(usage.cost_customer, 0)     AS cost_customer,
                   COALESCE(usage.cost_admin, 0)        AS cost_admin,
                   COALESCE(usage.cost_anonymous, 0)    AS cost_anonymous,
                   COALESCE(usage.cost_unattributed, 0) AS cost_unattributed,
                   COALESCE(usage.active_accounts, 0)   AS active_accounts,
                   COALESCE(paid.revenue_cents, 0)      AS revenue_cents,
                   COALESCE(paid.payments, 0)           AS payments
              FROM usage FULL OUTER JOIN paid ON paid.month = usage.month
             ORDER BY 1 DESC
            """,
            # Two `is_admin` fragments in the usage CTE, then one month
            # window per CTE. The count has to match the SQL exactly.
            [*params, *params, int(months), int(months)],
        )
        return _as_floats([dict(r) for r in cur.fetchall()])


def admin_usage_by_user(
    *, limit: int = 100, months: int | None = None, admin_emails: set[str] | None = None
) -> list[dict]:
    """Per account: what they ran, what it cost us, what they have left.

    NOT a LIMIT on the aggregate - the counts are over every row that matches,
    and the limit only decides how many accounts come back. A truncated total
    presented as a whole is the one thing a reporting screen must never do.

    `credits_left` is the ledger sum, never a stored total, exactly as
    everywhere else in this file: a balance that can drift from its own history
    is worse than no balance.
    """
    is_admin, params = _admin_filter(admin_emails)
    window = (
        "AND e.day_utc >= (date_trunc('month', now()) "
        "- make_interval(months => %s))::date"
        if months
        else ""
    )
    window_params = [int(months)] if months else []
    with connect() as conn, conn.cursor() as cur:
        cur.execute(
            f"""
            SELECT u.id,
                   u.email,
                   u.status,
                   u.created_at,
                   u.last_seen_at,
                   ({is_admin}) AS is_admin,
                   COALESCE(x.billable, 0)      AS billable,
                   COALESCE(x.attempts, 0)      AS attempts,
                   COALESCE(x.refused, 0)       AS refused,
                   COALESCE(x.cost_usd, 0)      AS cost_usd,
                   COALESCE(x.credits_spent, 0) AS credits_spent,
                   COALESCE(x.last_activity, u.last_seen_at) AS last_activity,
                   COALESCE((SELECT sum(delta) FROM credit_ledger
                              WHERE user_id = u.id), 0) AS credits_left,
                   COALESCE((SELECT sum(amount_cents) FROM payment_event p
                              WHERE p.livemode IS TRUE
                                AND lower(p.email) = lower(u.email)), 0)
                       AS paid_cents
              FROM app_user u
              LEFT JOIN LATERAL (
                  SELECT count(*) FILTER (WHERE e.spend_usd > 0) AS billable,
                         count(*)                                 AS attempts,
                         count(*) FILTER (WHERE e.outcome <> 'allowed') AS refused,
                         COALESCE(sum(e.spend_usd), 0)            AS cost_usd,
                         COALESCE(sum(e.credits), 0)              AS credits_spent,
                         max(e.created_at)                        AS last_activity
                    FROM usage_event e
                   WHERE e.user_id = u.id {window}
              ) x ON TRUE
             ORDER BY COALESCE(x.cost_usd, 0) DESC, u.id
             LIMIT %s
            """,
            [*params, *window_params, int(limit)],
        )
        return _as_floats([dict(r) for r in cur.fetchall()])


def _as_floats(rows: list[dict]) -> list[dict]:
    """NUMERIC comes back as Decimal; the TypeScript on the other side says
    `number`.

    `admin_overview` casts for the same reason: a Decimal that survives into
    JSON as a string turns `.toFixed` into a runtime error at the top of a page
    somebody opened specifically to look at money.
    """
    for row in rows:
        for key, value in list(row.items()):
            if isinstance(value, Decimal):
                row[key] = float(value)
    return rows


def admin_usage_totals(*, admin_emails: set[str] | None = None) -> dict:
    """All-time totals, for the cards above the tables.

    Separate from `admin_overview`, which answers "what is happening today".
    This answers "what has this cost us since the beginning", which is the
    number a year-end needs and which no existing query returns.
    """
    is_admin, params = _admin_filter(admin_emails)
    with connect() as conn, conn.cursor() as cur:
        cur.execute(
            f"""
            SELECT count(*) FILTER (WHERE e.spend_usd > 0) AS billable,
                   count(*)                                 AS attempts,
                   count(*) FILTER (WHERE e.outcome <> 'allowed') AS refused,
                   COALESCE(sum(e.spend_usd), 0)            AS cost_usd,
                   COALESCE(sum(e.spend_usd) FILTER (
                       WHERE e.user_id IS NOT NULL AND ({is_admin})), 0) AS cost_admin,
                   COALESCE(sum(e.credits), 0)              AS credits_spent,
                   count(DISTINCT e.user_id)                AS accounts_active,
                   min(e.created_at)                        AS first_event
              FROM usage_event e
              LEFT JOIN app_user u ON u.id = e.user_id
            """,
            params,
        )
        usage = dict(cur.fetchone() or {})

        cur.execute(
            """
            SELECT COALESCE(sum(amount_cents) FILTER (WHERE livemode), 0) AS revenue_cents,
                   count(*) FILTER (WHERE livemode) AS payments,
                   count(*) FILTER (WHERE NOT livemode) AS test_payments
              FROM payment_event
            """
        )
        money = dict(cur.fetchone() or {})

        # THE RECONCILIATION, and it belongs on a budget screen rather than in
        # a footnote. `usage_event` is written best-effort - the two call sites
        # swallow their own exceptions, because losing a receipt is bad but
        # losing the customer's result on top of it is worse - and it is not
        # written at all when accounts are disabled. It also only exists from
        # the day accounts shipped.
        #
        # `crawl.spend` and `serp_task.cost` are the closer-to-complete record:
        # both are reported figures, both predate accounts, and neither can be
        # skipped by a failed insert on the attribution path. The difference
        # between the two totals is money we spent but cannot attribute to
        # anybody, and a report that showed only the attributed half would
        # quietly understate the bill.
        cur.execute(
            """
            SELECT COALESCE((SELECT sum(spend) FROM crawl), 0)    AS crawl_spend,
                   COALESCE((SELECT sum(cost) FROM serp_task), 0) AS task_spend
            """
        )
        ledgerless = dict(cur.fetchone() or {})

        cur.execute(
            """
            SELECT COALESCE(sum(delta) FILTER (WHERE delta > 0), 0) AS granted,
                   COALESCE(-sum(delta) FILTER (WHERE delta < 0), 0) AS spent
              FROM credit_ledger
            """
        )
        credits = dict(cur.fetchone() or {})

    # NUMERIC arrives as Decimal. `admin_overview` casts for the same reason:
    # the TypeScript on the other side declares `number`, and a Decimal that
    # survives as a JSON string turns `.toFixed` into a runtime error at the
    # top of a page the operator opened to look at money.
    for row in (usage, ledgerless):
        for key, value in list(row.items()):
            if isinstance(value, Decimal):
                row[key] = float(value)

    attributed = float(usage.get("cost_usd") or 0)
    provider = float(ledgerless.get("crawl_spend") or 0) + float(
        ledgerless.get("task_spend") or 0
    )
    return {
        "usage": usage,
        "money": money,
        "credits": credits,
        "reconcile": {
            "attributed_usd": attributed,
            "provider_usd": provider,
            # Positive means money we spent and cannot trace to anyone: work
            # done before accounts existed, or a receipt that failed to write.
            "unattributed_usd": round(provider - attributed, 6),
        },
    }


def admin_actions(limit: int = 100) -> list[dict]:
    with connect() as conn, conn.cursor() as cur:
        cur.execute(
            """
            SELECT a.id, a.actor, a.action, a.target_user, a.detail, a.created_at,
                   u.email AS target_email
              FROM admin_action a
              LEFT JOIN app_user u ON u.id = a.target_user
             ORDER BY a.created_at DESC, a.id DESC
             LIMIT %s
            """,
            (limit,),
        )
        return [dict(r) for r in cur.fetchall()]


# --------------------------------------------------------------- admin writes
#
# Every one of these writes an admin_action row in the SAME statement as the
# change it audits. An audit that can be skipped by a failure halfway through is
# not an audit.


def admin_credit(
    *, user_id: int, delta: int, note: str | None, actor: str
) -> int:
    """Grant or revoke credits. Returns the new balance.

    THE BALANCE IS SUMMED FROM THE TABLE AND THEN THE NEW DELTA IS ADDED. That
    is not a long way round: data-modifying CTEs and the main query run on the
    SAME SNAPSHOT, so a plain `sum(delta) FROM credit_ledger` here cannot see
    the row `led` just inserted and would return the balance from BEFORE the
    grant. The reply would be off by exactly the amount that was granted -
    right on the one number this endpoint exists to change.

    Taking the delta back out of `led` rather than passing the parameter again
    keeps the arithmetic tied to the row that was actually written.
    """
    reason = "admin_grant" if delta > 0 else "admin_revoke"
    with connect() as conn, conn.cursor() as cur:
        cur.execute(
            """
            WITH led AS (
                INSERT INTO credit_ledger (user_id, delta, reason, ref, note)
                VALUES (%(uid)s, %(delta)s, %(reason)s, %(actor)s, %(note)s)
                RETURNING delta
            ), audit AS (
                INSERT INTO admin_action (actor, action, target_user, detail)
                SELECT %(actor)s, %(reason)s, %(uid)s,
                       jsonb_build_object('delta', %(delta)s, 'note', %(note)s)
                  FROM led
                RETURNING 1
            )
            SELECT COALESCE((SELECT sum(delta) FROM credit_ledger
                              WHERE user_id = %(uid)s), 0)
                   + (SELECT delta FROM led) AS balance
            """,
            {
                "uid": user_id,
                "delta": int(delta),
                "reason": reason,
                "actor": actor,
                "note": note,
            },
        )
        row = cur.fetchone()
        conn.commit()
        return int(row["balance"]) if row else 0


def admin_set_status(*, user_id: int, status: str, actor: str) -> bool:
    """Suspend or reactivate. The one UPDATE in an append-only design.

    Justified because status is read on every spending request and a DISTINCT ON
    there would be a second query on the hot path. The history is not lost - the
    admin_action row written by the same statement is the log.

    REFUSES AN ERASED ROW, and that guard is load-bearing. `StatusRequest` only
    permits 'active' or 'suspended', so without it the suspend/reactivate toggle
    would offer "Reactivate" on an erased account and either half-revive it -
    status active, `erased_at` still set, no revival audit, nothing restored -
    or, with the CHECK from migration 0010, throw a constraint violation that
    reaches the operator as a 500. Un-erasing is `_revive`'s job alone.
    """
    with connect() as conn, conn.cursor() as cur:
        cur.execute(
            """
            WITH upd AS (
                UPDATE app_user SET status = %(status)s
                 WHERE id = %(uid)s AND status <> %(status)s
                   AND status <> 'erased'
                RETURNING id
            )
            INSERT INTO admin_action (actor, action, target_user, detail)
            SELECT %(actor)s,
                   CASE WHEN %(status)s = 'suspended' THEN 'suspend'
                        ELSE 'reactivate' END,
                   id, jsonb_build_object('status', %(status)s)
              FROM upd
            """,
            {"uid": user_id, "status": status, "actor": actor},
        )
        changed = cur.rowcount > 0
        conn.commit()
        return changed


def admin_revoke_tokens(*, user_id: int, actor: str) -> int:
    """Sign this user out everywhere. Returns the new token_epoch."""
    with connect() as conn, conn.cursor() as cur:
        cur.execute(
            """
            WITH upd AS (
                UPDATE app_user SET token_epoch = token_epoch + 1
                 WHERE id = %(uid)s
                RETURNING id, token_epoch
            ), audit AS (
                INSERT INTO admin_action (actor, action, target_user, detail)
                SELECT %(actor)s, 'revoke_tokens', id,
                       jsonb_build_object('token_epoch', token_epoch)
                  FROM upd
                RETURNING 1
            )
            SELECT token_epoch FROM upd
            """,
            {"uid": user_id, "actor": actor},
        )
        row = cur.fetchone()
        conn.commit()
        return int(row["token_epoch"]) if row else 0


def user_erase(*, user_id: int, actor: str, reason: str) -> dict | None:
    """Erase a person, keeping the money and the address. Returns what it did.

    SEVERAL STATEMENTS IN ONE TRANSACTION, NOT ONE CLEVER ONE - see the long
    argument in `user_upsert`, which is the third bug this codebase has paid
    for against chained data-modifying CTEs. Erasure is the coldest path in the
    product, runs once per account ever, and touches six tables plus the audit.
    One statement would be seven chained CTEs sharing a snapshot, and the audit
    detail below wants REAL counts, which a CTE could not see. A transaction
    gives the same "the audit cannot be skipped by a failure halfway" guarantee
    that the same-statement rule was protecting, and gives honest numbers too.
    Do NOT wrap the body in try/except: catching inside the block and carrying
    on would let the context manager commit a half-erasure and report success.

    THE ADDRESS AND THE LEDGER STAY. The Privacy Policy promises both - the
    address is the recovery key that lets a returning person be handed back a
    balance they paid for, and `credit_ledger.user_id` is NOT NULL and
    ON DELETE RESTRICT precisely so no erasure can destroy the money history.
    This function is why a plain `DELETE FROM app_user` is not the design.

    `signup_granted_at` IS PRESERVED, and that is the anti-abuse half. Clearing
    it would make erase-and-sign-up-again a free-credit tap: ten searches, a
    delete, ten more, forever, against one mailbox. It is the only column kept
    for OUR benefit rather than the person's, which is why it is named here
    rather than left to be noticed.

    WHAT IT SEVERS, and why each one is on the list:
      * `crawl.user_id` AND `crawl.anon_id`. BOTH, because `api/main.py` writes
        both on a signed-in search - the "a crawl carries EITHER, not both"
        comment on migration 0006 has not been true since - and `can_access`
        matches EITHER. Blanking only `user_id` would take the tree out of the
        person's list while leaving it open to anyone holding that browser's
        anon id, which for a self-service erasure is the very browser that just
        pressed delete. Looking erased is worse than not being erased.
      * `serp_task.user_id` - the provider receipt stays, the owner goes.
      * `usage_event.user_id`, `.anon_id` AND `.ip_hash`. The last two were
        originally kept in step with the anonymous daily allowance, which
        counted `user_id IS NULL` by `anon_id` and again by `ip_hash`: blanking
        only `user_id` would have donated this person's same-day searches to a
        stranger's free allowance. That allowance was retired on 2026-09-23 and
        the reason is now plainer - a browser id and an address hash identify
        the person being erased, so an erasure that left them behind would not
        be one.
      * Every `email_token` and `auth_code` row. These are LIVE CREDENTIALS.
        They do not cascade here because the row is not deleted, and
        `email_token_redeem` asks about expiry and use but never about status -
        so a reset link mailed ten minutes before an erasure would still be
        redeemable afterwards, and would revive the account from stale mail.
      * `token_epoch + 1`, which kills every session already issued. There is
        no session table; the epoch is the only revocation there is.

    WHAT IT DOES NOT TOUCH: `email`, `credit_ledger`, `created_at`,
    `signup_granted_at`, and every `payment_event` column except `payload`.

    `reason` IS WRITTEN TO THE AUDIT, so it must not be free text from a
    visitor: the self-service endpoint passes a fixed code, an admin types a
    short note. Nothing redacts `admin_action.detail`, so a name typed in here
    would outlive the erasure meant to remove it.

    Returns None for no such row, and `already_erased` when there is nothing
    left to do - a second call writes NOTHING, including no second audit row.
    """
    with connect() as conn, conn.cursor() as cur:
        # FOR UPDATE does three jobs at once: fails fast on a missing row,
        # captures `status` and `email` as they were BEFORE the blanking, and
        # serialises against sign-in. `user_verify_email` takes the same lock,
        # so a verification racing this waits and then reads the truth instead
        # of reviving a row mid-erasure.
        cur.execute(
            "SELECT id, email, status, erased_at, token_epoch "
            "FROM app_user WHERE id = %s FOR UPDATE",
            (int(user_id),),
        )
        found = cur.fetchone()
        if not found:
            return None
        if found["erased_at"] is not None:
            return {
                "user_id": int(found["id"]),
                "already_erased": True,
                "erased_at": found["erased_at"],
                "token_epoch": int(found["token_epoch"]),
            }

        email = found["email"]
        # Derived from the ROW, never from what the caller claims to be.
        # `actor` is an email either way - an admin is an entry in an
        # environment variable rather than a row - so the only thing telling
        # the two cases apart is whether that address is this account's own.
        self_service = (actor or "").strip().lower() == (email or "").lower()

        cur.execute(
            """
            UPDATE app_user
               SET name                  = NULL,
                   picture_url           = NULL,
                   password_hash         = NULL,
                   google_sub            = NULL,
                   -- Cleared on purpose, and it is what makes revival WORK
                   -- rather than what breaks it. With the address unverified,
                   -- a returning person signing up again takes the signup
                   -- endpoint's unverified branch - "nobody has proven control
                   -- of this address yet", which after an erasure is exactly
                   -- true - and gets a fresh verify link. Redemption is where
                   -- the account comes back. Left set, they would be routed
                   -- into password RESET against a hash we just destroyed.
                   email_verified_at     = NULL,
                   status                = 'erased',
                   -- Reads the OLD value: a SET expression sees the row as it
                   -- was. This is what stops revival from laundering a ban - a
                   -- suspended account that is erased comes back suspended.
                   status_before_erasure = status,
                   erased_at             = now(),
                   token_epoch           = token_epoch + 1
             WHERE id = %(id)s
            RETURNING token_epoch, erased_at
            """,
            {"id": int(user_id)},
        )
        erased = cur.fetchone()

        # Credentials first, so no ordering of failures can leave a usable link
        # behind. The transaction already makes that theoretical; the ordering
        # costs nothing and stops it being theoretical-plus-trust.
        cur.execute("DELETE FROM email_token WHERE user_id = %s", (int(user_id),))
        creds = cur.rowcount
        cur.execute("DELETE FROM auth_code WHERE user_id = %s", (int(user_id),))
        creds += cur.rowcount

        cur.execute(
            "UPDATE crawl SET user_id = NULL, anon_id = NULL WHERE user_id = %s",
            (int(user_id),),
        )
        crawls = cur.rowcount
        cur.execute(
            "UPDATE serp_task SET user_id = NULL WHERE user_id = %s", (int(user_id),)
        )
        tasks = cur.rowcount
        cur.execute(
            "UPDATE usage_event SET user_id = NULL, anon_id = NULL, ip_hash = NULL "
            "WHERE user_id = %s",
            (int(user_id),),
        )
        events = cur.rowcount

        # Matched on the address as text, because that is the only link there
        # is: `payment_event` has no user_id and no foreign key, since the
        # webhook is recorded before we know whose it is. `lower()` folds the
        # same way as `app_user_email_key`, so this cannot miss a row the
        # unique index considers the same person. Best-effort by construction -
        # a checkout completed under a different address than the account's is
        # not matched - which is why the count goes into the audit rather than
        # being assumed.
        #
        # A MARKER, not NULL and not '{}'. NULL cannot tell "removed" from
        # "never arrived", so six months later there would be no way to show
        # the redaction happened. An empty object is worse: it reads to
        # anything walking `payload->'data'` as a Stripe event that lost its
        # contents - a redaction indistinguishable from a bug. The marker says
        # what happened and when, keeps the column's shape, and gives the
        # re-run guard below for free.
        cur.execute(
            """
            UPDATE payment_event
               SET payload = jsonb_build_object(
                       'redacted',    true,
                       'redacted_at', now(),
                       'reason',      'account_erasure')
             WHERE lower(email) = lower(%(email)s)
               AND payload IS NOT NULL
               AND payload -> 'redacted' IS NULL
            """,
            {"email": email},
        )
        payments = cur.rowcount

        # LAST, so the audit carries the counts that actually happened rather
        # than the ones this function hoped for.
        cur.execute(
            """
            INSERT INTO admin_action (actor, action, target_user, detail)
            VALUES (%(actor)s, %(action)s, %(id)s,
                    -- EVERY ONE OF THESE IS CAST, and it is not decoration.
                    -- `jsonb_build_object` takes `"any"` arguments, so a
                    -- parameter that appears ONLY inside it has no column to
                    -- take its type from and Postgres refuses the statement
                    -- with "could not determine data type of parameter $4".
                    -- The admin writes above get away with bare parameters
                    -- because each one is also written to a typed column.
                    jsonb_build_object(
                        'reason',              %(reason)s::text,
                        'self_service',        %(self)s::boolean,
                        'status_before',       %(before)s::text,
                        'crawls',              %(crawls)s::int,
                        'serp_tasks',          %(tasks)s::int,
                        'usage_events',        %(events)s::int,
                        'payments_redacted',   %(payments)s::int,
                        'credentials_deleted', %(creds)s::int))
            """,
            {
                "actor": actor,
                "action": "erase_self" if self_service else "erase",
                "id": int(user_id),
                "reason": (reason or "")[:200],
                "self": self_service,
                "before": found["status"],
                "crawls": crawls,
                "tasks": tasks,
                "events": events,
                "payments": payments,
                "creds": creds,
            },
        )
        conn.commit()
        return {
            "user_id": int(user_id),
            "already_erased": False,
            "email": email,
            "erased_at": erased["erased_at"],
            "token_epoch": int(erased["token_epoch"]),
            "crawls": crawls,
            "serp_tasks": tasks,
            "usage_events": events,
            "payments_redacted": payments,
            "credentials_deleted": creds,
        }


def _revive(cur: Any, *, user_id: int, via: str, actor: str) -> str | None:
    """Undo an erasure, inside the caller's transaction. Returns the status.

    The counterpart of `user_erase`, and deliberately NOT its mirror image:
    almost nothing comes back. The name, the picture, the old password and the
    old Google link are gone for good; the searches stay severed; the payment
    payloads stay redacted. What returns is the ACCOUNT - the row, the address
    and the balance - which is the whole of what the Privacy Policy promises.

    `signup_granted_at` is not cleared here either. Same guard from the other
    side: a revived account must not be paid a second signup grant.

    Restores `status_before_erasure`, never a flat 'active'. Otherwise erasure
    is a ban-laundering machine, and that is the first thing an abuser finds.

    Takes a cursor rather than opening its own connection, because reviving and
    deciding the grant have to be one transaction - the same reason
    `user_verify_email` does its four statements together.
    """
    cur.execute(
        """
        UPDATE app_user
           SET status                = COALESCE(status_before_erasure, 'active'),
               status_before_erasure = NULL,
               erased_at             = NULL
         WHERE id = %(id)s AND erased_at IS NOT NULL
        RETURNING status
        """,
        {"id": int(user_id)},
    )
    row = cur.fetchone()
    if not row:
        return None
    # Audited like every other privileged change to a row, and it is one: it
    # hands somebody a balance back.
    cur.execute(
        """
        INSERT INTO admin_action (actor, action, target_user, detail)
        VALUES (%(actor)s, 'revive', %(id)s,
                -- Cast for the same reason as `user_erase`'s audit row: these
                -- two appear nowhere but inside `jsonb_build_object`.
                jsonb_build_object('via', %(via)s::text, 'status', %(status)s::text))
        """,
        {"actor": actor, "id": int(user_id), "via": via, "status": row["status"]},
    )
    return str(row["status"])


def setting_put(*, key: str, value: str, actor: str) -> None:
    """Append a new setting value. Never an UPDATE - the old value stays."""
    with connect() as conn, conn.cursor() as cur:
        cur.execute(
            """
            WITH s AS (
                INSERT INTO app_setting (setting_key, setting_value, set_by)
                VALUES (%(key)s, %(value)s, %(actor)s)
                RETURNING setting_key
            )
            INSERT INTO admin_action (actor, action, detail)
            SELECT %(actor)s, 'set_setting',
                   jsonb_build_object('key', %(key)s, 'value', %(value)s)
              FROM s
            """,
            {"key": key, "value": str(value), "actor": actor},
        )
        conn.commit()


def admin_log(*, actor: str, action: str, detail: dict) -> None:
    """Audit an admin act whose effect happens OUTSIDE this database.

    Triggering CI is a call to GitHub, so it cannot share a statement with its
    audit row the way the writes above do. The row is written FIRST, before
    the call: an attempt that then fails is still an attempt somebody made,
    and a log written only on success would hide exactly the failures worth
    seeing.
    """
    with connect() as conn, conn.cursor() as cur:
        cur.execute(
            "INSERT INTO admin_action (actor, action, detail) VALUES (%s, %s, %s)",
            (actor, action, json.dumps(detail)),
        )
        conn.commit()


def payment_event_put(record: dict, payload: dict) -> bool:
    """Record one Stripe event. Returns False when it was already there.

    A redelivered webhook must not appear twice; the unique index decides that,
    not a SELECT this code would have to race against.
    """
    with connect() as conn, conn.cursor() as cur:
        cur.execute(
            """
            INSERT INTO payment_event (event_id, kind, livemode, amount_cents,
                                       currency, email, status, object_id, payload)
            VALUES (%(event_id)s, %(kind)s, %(livemode)s, %(amount_cents)s,
                    %(currency)s, %(email)s, %(status)s, %(object_id)s, %(payload)s)
            ON CONFLICT (event_id) DO NOTHING
            RETURNING id
            """,
            {**record, "payload": json.dumps(payload, ensure_ascii=False)[:100000]},
        )
        row = cur.fetchone()
        conn.commit()
        return bool(row)


def payment_events(limit: int = 50) -> list[dict]:
    with connect() as conn, conn.cursor() as cur:
        cur.execute(
            """
            SELECT event_id, kind, livemode, amount_cents, currency, email,
                   status, object_id, created_at,
                   -- The FLAG, never the payload itself: the raw event is 30 KB
                   -- of Stripe and belongs in no list view. Without this the
                   -- only proof an erasure redacted anything is invisible to
                   -- the operator who has to answer for it.
                   (payload -> 'redacted' IS NOT NULL) AS redacted
              FROM payment_event
             ORDER BY created_at DESC, id DESC
             LIMIT %s
            """,
            (limit,),
        )
        return [dict(r) for r in cur.fetchall()]
