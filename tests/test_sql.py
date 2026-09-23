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


def _put_verify_token(user_id: int, email: str, token_hash: str, ttl: int = 3600) -> None:
    db.email_token_put(
        token_hash=token_hash,
        user_id=user_id,
        purpose=db.PURPOSE_VERIFY,
        email=email,
        ttl_seconds=ttl,
    )


def test_a_spent_link_still_names_a_verified_owner() -> None:
    """The mail-scanner case: the token is burned before the human clicks it.

    Redemption must refuse the second time - but `email_token_settled` has to
    keep saying "this person is fine", or the page offers them a replacement
    link that `resend` will never send to a verified account.
    """
    made = db.user_create_password(email="e@example.com", password_hash="h", name=None)
    _put_verify_token(made["id"], "e@example.com", "hash-e")

    assert db.email_token_settled(token_hash="hash-e", purpose=db.PURPOSE_VERIFY) is False
    assert db.email_token_redeem(token_hash="hash-e", purpose=db.PURPOSE_VERIFY) == made["id"]
    db.user_verify_email(user_id=made["id"], signup_credits=10)

    assert db.email_token_redeem(token_hash="hash-e", purpose=db.PURPOSE_VERIFY) is None
    assert db.email_token_settled(token_hash="hash-e", purpose=db.PURPOSE_VERIFY) is True


def test_an_expired_link_on_an_unverified_account_is_not_settled() -> None:
    """The other half: a real expiry, where a fresh link IS the answer."""
    made = db.user_create_password(email="f@example.com", password_hash="h", name=None)
    _put_verify_token(made["id"], "f@example.com", "hash-f", ttl=-1)

    assert db.email_token_redeem(token_hash="hash-f", purpose=db.PURPOSE_VERIFY) is None
    assert db.email_token_settled(token_hash="hash-f", purpose=db.PURPOSE_VERIFY) is False


def test_a_token_nobody_issued_is_not_settled() -> None:
    assert db.email_token_settled(token_hash="never", purpose=db.PURPOSE_VERIFY) is False


def test_a_verify_token_does_not_answer_for_a_reset() -> None:
    """`purpose` is part of the WHERE here too, for the reason it is there."""
    made = db.user_create_password(email="g@example.com", password_hash="h", name=None)
    _put_verify_token(made["id"], "g@example.com", "hash-g")
    db.user_verify_email(user_id=made["id"], signup_credits=10)

    assert db.email_token_settled(token_hash="hash-g", purpose=db.PURPOSE_RESET) is False


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


# --------------------------------------------------------- account erasure


def _row(user_id: int) -> dict:
    """The raw row. These tests assert on columns no accessor returns."""
    with db.connect() as conn, conn.cursor() as cur:
        cur.execute("SELECT * FROM app_user WHERE id = %s", (user_id,))
        return cur.fetchone()


def _leaver(email: str = "leaver@example.com") -> dict:
    """A person with something to erase.

    One helper, because every erasure test needs the same preamble: an account
    with credits, a tree carrying BOTH owner columns the way a real signed-in
    search does, a usage row carrying all three identifiers, a payment under
    the same address, and a live credential.
    """
    made = db.user_upsert(
        google_sub="sub-leaver",
        email=email,
        name="A Leaver",
        picture_url="https://x.test/a.png",
        signup_credits=10,
    )
    uid = int(made["id"])
    tree = _archive_tree()
    db.save_tree(tree, new_crawl=True, user_id=uid, anon_id="anon-1")
    db.record_usage(
        user_id=uid,
        ip_hash="ip-1",
        anon_id="anon-1",
        action="search",
        outcome="allowed",
        credits=1,
        spend_usd=0.0026,
        tree_slug=tree["slug"],
    )
    db.payment_event_put(
        {**_event("evt_leaver"), "email": email},
        {"id": "evt_leaver", "billing_name": "A Leaver"},
    )
    db.email_token_put(
        token_hash="hash-leaver",
        user_id=uid,
        purpose=db.PURPOSE_RESET,
        email=email,
        ttl_seconds=3600,
    )
    return made


# ------------------------------------------------------ what erasure KEEPS


def test_erasure_keeps_the_address_and_the_balance() -> None:
    """The Privacy Policy's two deliberate exceptions, as a test."""
    uid = int(_leaver()["id"])
    db.user_erase(user_id=uid, actor="op@example.com", reason="support request")

    assert _row(uid)["email"] == "leaver@example.com"
    # The signup grant AND the debit for the search `_leaver` ran: erasure
    # leaves the money history exactly as it found it.
    assert _ledger(uid) == [{"delta": 10, "reason": "signup"}, {"delta": -1, "reason": "search"}]


def test_erasure_keeps_the_signup_grant_marker() -> None:
    """The anti-farming guard. Clear this and delete-then-resignup is a tap."""
    uid = int(_leaver()["id"])
    db.user_erase(user_id=uid, actor="op@example.com", reason="")
    assert _row(uid)["signup_granted_at"] is not None


def test_erasure_keeps_the_payment_summary_and_removes_only_the_dossier() -> None:
    uid = int(_leaver()["id"])
    db.user_erase(user_id=uid, actor="op@example.com", reason="")

    paid = next(p for p in db.payment_events() if p["event_id"] == "evt_leaver")
    assert paid["amount_cents"] == 100 and paid["currency"] == "usd"
    assert paid["livemode"] is False and paid["redacted"] is True

    with db.connect() as conn, conn.cursor() as cur:
        cur.execute("SELECT payload FROM payment_event WHERE event_id = 'evt_leaver'")
        payload = cur.fetchone()["payload"]
    # A MARKER, not NULL and not {}: NULL cannot tell "removed" from "never
    # arrived", and {} reads as a Stripe event that lost its contents.
    assert payload["redacted"] is True
    assert payload["reason"] == "account_erasure"
    assert "billing_name" not in payload


# ----------------------------------------------------- what erasure REMOVES


def test_erasure_blanks_the_profile_and_signs_them_out() -> None:
    uid = int(_leaver()["id"])
    before = int(_row(uid)["token_epoch"])
    db.user_erase(user_id=uid, actor="op@example.com", reason="")

    row = _row(uid)
    for column in (
        "name",
        "picture_url",
        "password_hash",
        "google_sub",
        "email_verified_at",
    ):
        assert row[column] is None, column
    assert row["status"] == "erased"
    assert row["erased_at"] is not None
    # The only revocation there is - there is no session table.
    assert int(row["token_epoch"]) == before + 1


def test_erasure_severs_every_link_to_the_searches() -> None:
    """All three tables at once, because missing one of them is the failure."""
    uid = int(_leaver()["id"])
    db.user_erase(user_id=uid, actor="op@example.com", reason="")

    with db.connect() as conn, conn.cursor() as cur:
        cur.execute("SELECT user_id, anon_id FROM crawl")
        assert all(
            c["user_id"] is None and c["anon_id"] is None for c in cur.fetchall()
        )
        cur.execute("SELECT user_id, anon_id, ip_hash FROM usage_event")
        for event in cur.fetchall():
            assert event["user_id"] is None
            assert event["anon_id"] is None
            assert event["ip_hash"] is None
    assert db.load_trees(slugify, user_id=uid) == []


def test_an_erased_tree_is_not_reachable_by_the_browser_that_made_it() -> None:
    """`crawl` carries BOTH owner columns on a signed-in search.

    The comment on migration 0006 says it carries either one or the other; the
    API has passed both since accounts shipped, and `can_access` matches
    EITHER. Blanking only `user_id` would take the tree out of the person's
    list while leaving it open to the very browser that pressed delete - which
    looks erased and is not.
    """
    uid = int(_leaver()["id"])
    slug = _archive_tree()["slug"]
    assert db.can_access(slug, user_id=uid, anon_id="anon-1") is True

    db.user_erase(user_id=uid, actor="op@example.com", reason="")
    assert db.can_access(slug, user_id=uid, anon_id="anon-1") is False


def test_erasure_blanks_the_browser_and_address_on_usage_rows() -> None:
    """Erasure has to take the identifiers, not just the account key.

    This was written against `anon_counters`: blanking only `user_id` would
    have donated an erased person's same-day searches to a stranger's free
    allowance. That allowance is gone, and the rule outlived its first reason -
    a browser id and an address hash identify the person being erased, so a row
    still carrying either is a row the erasure did not reach.

    Asserted against the columns directly rather than through a reader, which
    is what let the original version of this test die with the function it
    called.
    """
    def identified() -> int:
        with db.connect() as conn, conn.cursor() as cur:
            cur.execute(
                """
                SELECT count(*) AS n FROM usage_event
                 WHERE anon_id IS NOT NULL OR ip_hash IS NOT NULL
                """
            )
            return int((cur.fetchone() or {}).get("n") or 0)

    uid = int(_leaver()["id"])
    # Counted BEFORE as well, or an erasure that deleted the rows outright -
    # or a fixture that stopped writing them - would pass by having nothing
    # left to find.
    assert identified() > 0

    db.user_erase(user_id=uid, actor="op@example.com", reason="")
    assert identified() == 0


def test_erasure_deletes_every_live_credential() -> None:
    """A reset link mailed before the erasure must not survive it.

    `email_token_redeem` asks about expiry and use, never about status, so a
    surviving token would revive the account from stale mail.
    """
    uid = int(_leaver()["id"])
    db.user_erase(user_id=uid, actor="op@example.com", reason="")

    assert (
        db.email_token_redeem(token_hash="hash-leaver", purpose=db.PURPOSE_RESET)
        is None
    )
    with db.connect() as conn, conn.cursor() as cur:
        cur.execute("SELECT count(*) AS n FROM email_token WHERE user_id = %s", (uid,))
        assert cur.fetchone()["n"] == 0


def test_only_that_persons_payments_are_redacted() -> None:
    uid = int(_leaver()["id"])
    db.payment_event_put(
        {**_event("evt_other"), "email": "other@example.com"}, {"id": "evt_other"}
    )
    db.user_erase(user_id=uid, actor="op@example.com", reason="")

    events = {p["event_id"]: p for p in db.payment_events()}
    assert events["evt_leaver"]["redacted"] is True
    assert events["evt_other"]["redacted"] is False


def test_payments_are_matched_case_insensitively() -> None:
    """The same folding as `app_user_email_key`, or the index and this
    statement would disagree about who somebody is."""
    uid = int(_leaver()["id"])
    db.payment_event_put(
        {**_event("evt_shout"), "email": "LEAVER@EXAMPLE.COM"}, {"id": "evt_shout"}
    )
    db.user_erase(user_id=uid, actor="op@example.com", reason="")

    events = {p["event_id"]: p for p in db.payment_events()}
    assert events["evt_shout"]["redacted"] is True


# ------------------------------------------------ the audit and idempotency


def test_erasure_writes_one_audit_row_carrying_the_real_counts() -> None:
    uid = int(_leaver()["id"])
    db.user_erase(user_id=uid, actor="op@example.com", reason="support request")

    entry = db.admin_actions(limit=5)[0]
    assert entry["action"] == "erase"
    assert entry["actor"] == "op@example.com"
    assert entry["target_user"] == uid
    detail = entry["detail"]
    assert detail["reason"] == "support request"
    assert detail["self_service"] is False
    assert detail["status_before"] == "active"
    assert detail["crawls"] == 1
    assert detail["payments_redacted"] == 1
    assert detail["credentials_deleted"] == 1


def test_a_self_service_erasure_is_labelled_as_one() -> None:
    """`actor` is an email either way, so the row's own address is the only
    thing that tells the two cases apart."""
    uid = int(_leaver()["id"])
    db.user_erase(user_id=uid, actor="LEAVER@example.com", reason="self_service")

    entry = db.admin_actions(limit=5)[0]
    assert entry["action"] == "erase_self"
    assert entry["detail"]["self_service"] is True


def test_erasing_twice_writes_nothing_the_second_time() -> None:
    uid = int(_leaver()["id"])
    first = db.user_erase(user_id=uid, actor="op@example.com", reason="")
    before = len(db.admin_actions(limit=50))

    second = db.user_erase(user_id=uid, actor="op@example.com", reason="")
    assert second["already_erased"] is True
    assert second["erased_at"] == first["erased_at"]
    assert len(db.admin_actions(limit=50)) == before


def test_erasing_a_missing_account_is_none() -> None:
    assert db.user_erase(user_id=999_999, actor="op@example.com", reason="") is None


# ------------------------------------------------------------------ revival


def test_signing_in_with_google_revives_the_same_row_and_its_balance() -> None:
    """The round trip the Privacy Policy promises."""
    uid = int(_leaver()["id"])
    db.admin_credit(user_id=uid, delta=5, note=None, actor="op@example.com")
    db.user_erase(user_id=uid, actor="op@example.com", reason="")

    back = db.user_upsert(
        google_sub="sub-new",
        email="leaver@example.com",
        name="Back",
        picture_url=None,
        signup_credits=10,
    )
    assert int(back["id"]) == uid
    assert back["balance"] == 14

    row = _row(uid)
    assert row["status"] == "active"
    assert row["erased_at"] is None
    assert row["google_sub"] == "sub-new"


def test_revival_does_not_pay_a_second_signup_grant() -> None:
    """The anti-farming guard from the other side - the whole reason
    `signup_granted_at` survives an erasure."""
    uid = int(_leaver()["id"])
    db.user_erase(user_id=uid, actor="op@example.com", reason="")
    db.user_upsert(
        google_sub="sub-new",
        email="leaver@example.com",
        name=None,
        picture_url=None,
        signup_credits=10,
    )
    # One signup row, not two. The debit below is `_leaver`'s search.
    assert _ledger(uid) == [{"delta": 10, "reason": "signup"}, {"delta": -1, "reason": "search"}]


def test_signing_up_again_with_the_erased_address_revives_on_verification() -> None:
    """The email door, end to end.

    Erasure clears `email_verified_at`, so the signup endpoint takes its
    unverified branch and mails a link. Redeeming it is where the account
    comes back - revival only happens where mailbox control was just proven.
    """
    uid = int(_leaver()["id"])
    db.user_erase(user_id=uid, actor="op@example.com", reason="")
    assert db.user_by_email("leaver@example.com")["email_verified"] is False

    db.user_set_password(user_id=uid, password_hash="new-hash", revoke=False)
    out = db.user_verify_email(user_id=uid, signup_credits=10)
    assert out["did_revive"] is True
    assert out["did_grant"] is False
    assert out["status"] == "active"
    assert out["balance"] == 9


def test_an_account_that_was_suspended_comes_back_suspended() -> None:
    """Erasure is not a way to launder a ban."""
    uid = int(_leaver()["id"])
    db.admin_set_status(user_id=uid, status="suspended", actor="op@example.com")
    db.user_erase(user_id=uid, actor="op@example.com", reason="")
    db.user_upsert(
        google_sub="sub-new",
        email="leaver@example.com",
        name=None,
        picture_url=None,
        signup_credits=10,
    )
    row = _row(uid)
    assert row["status"] == "suspended"
    assert row["status_before_erasure"] is None
    assert row["erased_at"] is None


def test_the_status_and_the_erased_flag_cannot_disagree() -> None:
    """One fact recorded twice is a fact that can disagree - unless a CHECK
    makes the disagreement unrepresentable."""
    import psycopg

    uid = int(_leaver()["id"])
    db.user_erase(user_id=uid, actor="op@example.com", reason="")
    with pytest.raises(psycopg.errors.CheckViolation):
        with db.connect() as conn, conn.cursor() as cur:
            cur.execute("UPDATE app_user SET status = 'active' WHERE id = %s", (uid,))
            conn.commit()


def test_an_erased_account_cannot_be_reactivated_from_the_status_toggle() -> None:
    """Un-erasing is `_revive`'s job alone. Without the guard the admin
    toggle would offer 'Reactivate' and half-revive the row."""
    uid = int(_leaver()["id"])
    db.user_erase(user_id=uid, actor="op@example.com", reason="")
    assert (
        db.admin_set_status(user_id=uid, status="active", actor="op@example.com")
        is False
    )
    row = _row(uid)
    assert row["status"] == "erased" and row["erased_at"] is not None


# ------------------------------------------------------------- reporting


def _spend(user_id: int | None, dollars: float, *, outcome: str = "allowed",
           anon: str | None = None, ip: str | None = None) -> None:
    db.record_usage(
        user_id=user_id,
        ip_hash=ip,
        anon_id=anon,
        action="search",
        outcome=outcome,
        credits=1 if dollars > 0 and outcome == "allowed" else 0,
        spend_usd=dollars,
        is_admin=False,
    )


ADMINS = {"boss@example.com"}


def test_the_month_split_adds_up_to_the_month_total() -> None:
    """The four cost columns are the SAME dollars grouped by who spent them.

    If they stop summing to `cost_usd` the budget stops adding up, which is the
    one thing a reporting screen must never do quietly.
    """
    customer = int(_google(sub="c", email="c@example.com")["id"])
    boss = int(_google(sub="b", email="boss@example.com")["id"])
    _spend(customer, 0.0026)
    _spend(boss, 0.0020)
    _spend(None, 0.0026, anon="anon-x", ip="ip-x")

    row = db.admin_usage_by_month(months=1, admin_emails=ADMINS)[0]
    parts = (
        row["cost_customer"]
        + row["cost_admin"]
        + row["cost_anonymous"]
        + row["cost_unattributed"]
    )
    assert round(parts, 6) == round(row["cost_usd"], 6)
    assert round(row["cost_customer"], 6) == 0.0026
    assert round(row["cost_admin"], 6) == 0.0020
    assert round(row["cost_anonymous"], 6) == 0.0026


def test_billable_and_attempts_are_deliberately_different_numbers() -> None:
    """A cache hit costs nothing and still happened; a refusal likewise.

    Collapsing the two into one "searches" column hides the cache paying off
    and hides people being turned away.
    """
    uid = int(_google(sub="c", email="c@example.com")["id"])
    _spend(uid, 0.0026)                                   # paid
    _spend(uid, 0.0)                                      # cache hit
    _spend(uid, 0.0, outcome="refused_no_credits")        # turned away

    row = db.admin_usage_by_month(months=1, admin_emails=ADMINS)[0]
    assert row["billable"] == 1
    assert row["attempts"] == 3
    assert row["refused"] == 1


def test_an_admins_dollars_are_real_but_billed_to_nobody() -> None:
    """Admins are not charged credits, and their spend is still money."""
    boss = int(_google(sub="b", email="BOSS@example.com")["id"])
    db.record_usage(
        user_id=boss, ip_hash=None, anon_id=None, action="search",
        outcome="allowed", credits=1, spend_usd=0.0026, is_admin=True,
    )
    row = db.admin_usage_by_month(months=1, admin_emails=ADMINS)[0]
    assert round(row["cost_admin"], 6) == 0.0026
    assert round(row["cost_customer"], 6) == 0.0
    # No ledger row: the admin bought no credits to spend.
    assert _ledger(boss) == [{"delta": 10, "reason": "signup"}]


def test_admin_matching_folds_case_like_the_gate_does() -> None:
    boss = int(_google(sub="b", email="Boss@Example.COM")["id"])
    _spend(boss, 0.0026)
    row = db.admin_usage_by_month(months=1, admin_emails={"BOSS@example.com"})[0]
    assert round(row["cost_admin"], 6) == 0.0026


def test_with_no_admins_configured_everything_is_a_customer() -> None:
    uid = int(_google(sub="c", email="c@example.com")["id"])
    _spend(uid, 0.0026)
    row = db.admin_usage_by_month(months=1, admin_emails=set())[0]
    assert round(row["cost_customer"], 6) == 0.0026
    assert round(row["cost_admin"], 6) == 0.0


def test_the_per_user_total_is_not_truncated() -> None:
    """`admin_user_detail` caps its usage list at 50 and the detail page used
    to sum that as if it were the whole. This one counts every row."""
    uid = int(_google(sub="c", email="c@example.com")["id"])
    for _ in range(60):
        _spend(uid, 0.001)

    row = next(u for u in db.admin_usage_by_user(admin_emails=ADMINS) if u["id"] == uid)
    assert row["billable"] == 60
    assert round(row["cost_usd"], 6) == 0.06


def test_per_user_rows_carry_the_balance_and_the_ordering_is_by_cost() -> None:
    cheap = int(_google(sub="a", email="a@example.com")["id"])
    dear = int(_google(sub="b", email="b@example.com")["id"])
    _spend(cheap, 0.001)
    _spend(dear, 0.005)

    rows = db.admin_usage_by_user(admin_emails=ADMINS)
    assert rows[0]["id"] == dear, "most expensive account first"
    # The ledger sum, never a stored total: signup 10 minus one credit spent.
    assert next(r for r in rows if r["id"] == dear)["credits_left"] == 9


def test_an_erased_persons_spend_stays_in_the_total_and_leaves_the_user_row() -> None:
    """Erasure blanks attribution, not money.

    The dollars have to remain in the month total - we paid them - while
    disappearing from every per-account row, and they must land in
    `unattributed` rather than in `anonymous`, which is a different thing.
    """
    # `_leaver` already ran one paid search; a second would double the total
    # this test is asserting on.
    uid = int(_leaver()["id"])
    db.user_erase(user_id=uid, actor="op@example.com", reason="")

    row = db.admin_usage_by_month(months=1, admin_emails=ADMINS)[0]
    assert round(row["cost_unattributed"], 6) == 0.0026
    assert round(row["cost_anonymous"], 6) == 0.0
    assert round(row["cost_usd"], 6) == 0.0026

    erased = next(u for u in db.admin_usage_by_user(admin_emails=ADMINS) if u["id"] == uid)
    assert erased["billable"] == 0
    assert round(erased["cost_usd"], 6) == 0.0


def test_revenue_counts_live_payments_only() -> None:
    """A test payment in a revenue figure is how the figure becomes a lie."""
    db.payment_event_put({**_event("evt_live"), "livemode": True}, {"id": "evt_live"})
    db.payment_event_put({**_event("evt_test"), "livemode": False}, {"id": "evt_test"})

    totals = db.admin_usage_totals(admin_emails=ADMINS)
    assert totals["money"]["revenue_cents"] == 100
    assert totals["money"]["payments"] == 1
    assert totals["money"]["test_payments"] == 1

    row = db.admin_usage_by_month(months=1, admin_emails=ADMINS)[0]
    assert row["revenue_cents"] == 100


def test_a_month_with_revenue_and_no_usage_still_appears() -> None:
    """The FULL OUTER JOIN earning its keep: a payment has no usage row to
    hang on, and a month that took money must not vanish from the budget."""
    db.payment_event_put({**_event("evt_only"), "livemode": True}, {"id": "evt_only"})
    rows = db.admin_usage_by_month(months=1, admin_emails=ADMINS)
    assert len(rows) == 1
    assert rows[0]["revenue_cents"] == 100
    assert rows[0]["attempts"] == 0


def test_the_reconciliation_names_what_attribution_missed() -> None:
    """`usage_event` is best-effort and post-accounts; the provider receipts
    are neither. The gap is money we spent and cannot trace to anybody."""
    # `estimated_spend`, which is the key `decompose` reads on the way in -
    # `crawl.spend` is what it becomes on the way out, and the two names do
    # not match. `add_spend=` would be wrong here as well: it only applies
    # when an EXISTING crawl is topped up by scoring.
    tree = _archive_tree()
    tree["estimated_spend"] = 0.0026                       # a crawl receipt
    db.save_tree(tree, new_crawl=True)
    uid = int(_google(sub="c", email="c@example.com")["id"])
    _spend(uid, 0.001)                                     # attributed only

    totals = db.admin_usage_totals(admin_emails=ADMINS)
    assert round(totals["reconcile"]["attributed_usd"], 6) == 0.001
    assert round(totals["reconcile"]["provider_usd"], 6) == 0.0026
    assert round(totals["reconcile"]["unattributed_usd"], 6) == 0.0016


def test_report_numbers_come_back_as_floats_not_decimals() -> None:
    """The TypeScript says `number`; a Decimal serialised as a JSON string
    turns `.toFixed` into a runtime error on a page about money."""
    uid = int(_google(sub="c", email="c@example.com")["id"])
    _spend(uid, 0.0026)

    month = db.admin_usage_by_month(months=1, admin_emails=ADMINS)[0]
    user = db.admin_usage_by_user(admin_emails=ADMINS)[0]
    totals = db.admin_usage_totals(admin_emails=ADMINS)
    assert isinstance(month["cost_usd"], float)
    assert isinstance(user["cost_usd"], float)
    assert isinstance(totals["usage"]["cost_usd"], float)


def test_an_empty_database_reports_zero_rather_than_failing() -> None:
    assert db.admin_usage_by_month(months=12, admin_emails=ADMINS) == []
    assert db.admin_usage_by_user(admin_emails=ADMINS) == []
    totals = db.admin_usage_totals(admin_emails=ADMINS)
    assert totals["usage"]["attempts"] == 0
    assert totals["money"]["revenue_cents"] == 0
    assert totals["reconcile"]["unattributed_usd"] == 0
