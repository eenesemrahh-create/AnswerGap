"""The SQL itself, against a real Postgres.

Every other test in this directory is pure, and that is why none of them could
have caught the bug that took Google sign-in down on 2026-09-15: `user_upsert`
was SQL, and SQL was only ever reasoned about. These run the statements.

Skipped unless `ANSWERGAP_TEST_DATABASE_URL` is set. CI sets it to a throwaway
Postgres service container; locally, point it at any scratch database.

THE SCHEMA IS DROPPED AND REBUILT. So the URL must name a local host - a test
suite that could be aimed at production by pasting the wrong variable would be
the most expensive test ever written. `_local_only` refuses anything else.
"""

from __future__ import annotations

import os
from urllib.parse import urlparse

import pytest

from answergap import db
from answergap.dataforseo import slugify
from answergap.tree import all_trees

TEST_URL = os.environ.get("ANSWERGAP_TEST_DATABASE_URL")

pytestmark = pytest.mark.skipif(
    not TEST_URL, reason="ANSWERGAP_TEST_DATABASE_URL is not set"
)

LOCAL_HOSTS = {"localhost", "127.0.0.1", "::1", "postgres"}


def _local_only(url: str) -> None:
    host = urlparse(url).hostname or ""
    if host not in LOCAL_HOSTS:
        pytest.exit(
            f"Refusing to drop the schema on host {host!r}: "
            "ANSWERGAP_TEST_DATABASE_URL must point at a local database.",
            returncode=2,
        )


def _reset_pool() -> None:
    if db._POOL is not None:
        db._POOL.close()
    db._POOL = None


@pytest.fixture(scope="module", autouse=True)
def database():
    _local_only(TEST_URL)
    saved = {k: os.environ.get(k) for k in ("DATABASE_URL", "DATABASE_PUBLIC_URL")}
    os.environ["DATABASE_URL"] = TEST_URL
    os.environ.pop("DATABASE_PUBLIC_URL", None)
    _reset_pool()
    with db.connect() as conn, conn.cursor() as cur:
        cur.execute("DROP SCHEMA public CASCADE; CREATE SCHEMA public;")
        conn.commit()
    db.migrate()
    yield
    _reset_pool()
    for key, value in saved.items():
        if value is None:
            os.environ.pop(key, None)
        else:
            os.environ[key] = value


@pytest.fixture(autouse=True)
def empty_tables(database):
    """Every test starts from empty rows on the migrated schema."""
    with db.connect() as conn, conn.cursor() as cur:
        names = [t for t in db.tables() if t != "schema_migration"]
        cur.execute(
            "TRUNCATE " + ", ".join(f'"{n}"' for n in names) + " RESTART IDENTITY CASCADE"
        )
        conn.commit()


def _ledger(user_id: int) -> list[dict]:
    with db.connect() as conn, conn.cursor() as cur:
        cur.execute(
            "SELECT delta, reason FROM credit_ledger WHERE user_id = %s ORDER BY id",
            (user_id,),
        )
        return cur.fetchall()


# ----------------------------------------------------------------- schema


def test_migrations_are_applied_once() -> None:
    assert db.migrate() == []
    assert {"app_user", "crawl", "paa_edge", "gap_score", "credit_ledger"} <= set(
        db.tables()
    )


# ------------------------------------------------------------ Google sign-in


def _google(sub: str = "sub-1", email: str = "a@example.com", credits: int = 10) -> dict:
    return db.user_upsert(
        google_sub=sub, email=email, name="A", picture_url=None, signup_credits=credits
    )


def test_first_google_sign_in_creates_the_account_with_its_grant() -> None:
    user = _google()
    assert user, "user_upsert returned {} - this is the 2026-09-15 outage"
    assert user["balance"] == 10
    assert _ledger(user["id"]) == [{"delta": 10, "reason": "signup"}]


def test_signing_in_again_is_the_same_account_and_no_second_grant() -> None:
    first = _google()
    again = _google()
    assert again["id"] == first["id"]
    assert again["balance"] == 10
    assert len(_ledger(first["id"])) == 1


def test_google_links_an_existing_password_account_by_address() -> None:
    made = db.user_create_password(
        email="Person@Example.com", password_hash="scrypt$x", name=None
    )
    assert made
    linked = _google(sub="sub-linked", email="person@example.com")
    assert linked["id"] == made["id"]
    assert linked["balance"] == 10


def test_a_changed_google_address_is_still_the_same_person() -> None:
    first = _google(email="old@example.com")
    moved = _google(email="new@example.com")
    assert moved["id"] == first["id"]
    assert moved["email"] == "new@example.com"


# --------------------------------------------------------- email verification


def test_a_password_signup_grants_nothing_until_verified() -> None:
    made = db.user_create_password(email="b@example.com", password_hash="h", name=None)
    assert made
    assert _ledger(made["id"]) == []


def test_the_address_is_unique_regardless_of_case() -> None:
    assert db.user_create_password(email="c@example.com", password_hash="h", name=None)
    assert db.user_create_password(email="C@EXAMPLE.COM", password_hash="h", name=None) is None


def test_verification_pays_the_grant_exactly_once() -> None:
    made = db.user_create_password(email="d@example.com", password_hash="h", name=None)
    first = db.user_verify_email(user_id=made["id"], signup_credits=10)
    second = db.user_verify_email(user_id=made["id"], signup_credits=10)
    assert first["did_grant"] is True and first["balance"] == 10
    # The second click on the same link - the step never run in production.
    assert second["did_grant"] is False and second["balance"] == 10
    assert len(_ledger(made["id"])) == 1


def test_verifying_a_missing_account_is_none() -> None:
    assert db.user_verify_email(user_id=999_999, signup_credits=10) is None


# ----------------------------------------------------------------- the tree


def _archive_tree() -> dict:
    tree = next(t for t in all_trees() if t["slug"] == "teeth-whitening")
    tree.update(location_code=2840, language_code="en", source="live")
    return tree


def test_a_re_crawl_inserts_and_never_overwrites() -> None:
    """The 2026-08-27 data loss, as a test: a second crawl must not touch the first."""
    first = _archive_tree()
    first_id = db.save_tree(first, new_crawl=True, add_spend=0.0026)

    smaller = _archive_tree()
    smaller["nodes"] = smaller["nodes"][:3]
    second_id = db.save_tree(smaller, new_crawl=True)

    assert second_id != first_id
    with db.connect() as conn, conn.cursor() as cur:
        cur.execute("SELECT count(*) AS n FROM paa_edge WHERE crawl_id = %s", (first_id,))
        first_edges = cur.fetchone()["n"]
    assert first_edges == sum(len(n.get("parents") or [None]) for n in first["nodes"])

    latest = db.load_tree("teeth-whitening", slugify)
    assert latest["node_count"] == 3


def test_a_score_survives_a_re_crawl() -> None:
    tree = _archive_tree()
    db.save_tree(tree, new_crawl=True)
    node = next(n for n in tree["nodes"] if n["depth"] == 1)
    db.save_score(
        normalized=node["id"],
        question=node["question"],
        language_code="en",
        location_code=2840,
        status="gap",
        matching_pages=0,
        results_checked=8,
        results=[],
        ai_sources=["www.example.com"],
        ai_state="cited",
        threshold=0.6,
        strategy="words",
    )
    db.save_tree(_archive_tree(), new_crawl=True)

    back = {n["id"]: n for n in db.load_tree("teeth-whitening", slugify)["nodes"]}
    assert back[node["id"]]["status"] == "gap"
    assert back[node["id"]]["ai_sources"] == ["www.example.com"]
    assert back[node["id"]]["ai_state"] == "cited"


def test_an_external_admin_act_is_audited() -> None:
    db.admin_log(actor="op@example.com", action="ci_rerun", detail={"run_id": 42})
    rows = db.admin_actions(limit=5)
    assert rows[0]["action"] == "ci_rerun"
    assert rows[0]["detail"] == {"run_id": 42}
    assert rows[0]["target_user"] is None


# ------------------------------------------------------------------ payments


def _event(event_id: str = "evt_1") -> dict:
    return {
        "event_id": event_id,
        "kind": "checkout.session.completed",
        "livemode": False,
        "amount_cents": 100,
        "currency": "usd",
        "email": "op@example.com",
        "status": "paid",
        "object_id": "cs_1",
    }


def test_a_redelivered_webhook_is_recorded_once() -> None:
    """Stripe retries until it gets a 2xx, so the same event WILL arrive twice."""
    assert db.payment_event_put(_event(), {"id": "evt_1"}) is True
    assert db.payment_event_put(_event(), {"id": "evt_1"}) is False
    assert len(db.payment_events()) == 1


def test_payments_come_back_newest_first_with_their_mode() -> None:
    db.payment_event_put(_event("evt_a"), {"id": "evt_a"})
    live = _event("evt_b")
    live["livemode"] = True
    db.payment_event_put(live, {"id": "evt_b"})
    rows = db.payment_events()
    assert [r["event_id"] for r in rows] == ["evt_b", "evt_a"]
    assert rows[0]["livemode"] is True and rows[1]["livemode"] is False
