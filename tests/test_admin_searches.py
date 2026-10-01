"""The admin Searches endpoints: who may call them, and what they refuse.

The SQL behind them runs in tests/test_sql.py against a real Postgres. These
pin the GATE and the input handling, with the database stubbed, so they run on
a laptop with no Postgres - and so a refactor that drops `require_admin` from
either endpoint fails here rather than in production.
"""

from __future__ import annotations

import pytest
from fastapi import HTTPException

from answergap import db, gate
from api import admin, auth


class _Request:
    headers: dict = {}
    client = None


def _no_db(*args, **kwargs):
    raise AssertionError("the database must not be asked before the gate passes")


@pytest.fixture
def refused(monkeypatch):
    """A signed-in, verified, NON-admin caller hitting the real gate."""
    monkeypatch.setattr(auth, "accounts_enabled", lambda: True)
    monkeypatch.setattr(
        auth, "identity",
        lambda request: gate.Identity(user_id=5, email="customer@example.com"),
    )
    monkeypatch.setattr(auth, "ADMIN_EMAILS", {"boss@example.com"})
    monkeypatch.setattr(db, "admin_searches", _no_db)
    monkeypatch.setattr(db, "admin_search_detail", _no_db)


def test_a_customer_cannot_list_everybodys_searches(refused) -> None:
    with pytest.raises(HTTPException) as exc:
        admin.searches(_Request())
    assert exc.value.status_code == 403


def test_a_customer_cannot_open_somebody_elses_search(refused) -> None:
    with pytest.raises(HTTPException) as exc:
        admin.search_detail(_Request(), "teeth-whitening")
    assert exc.value.status_code == 403


def test_signed_out_is_refused(monkeypatch) -> None:
    monkeypatch.setattr(auth, "accounts_enabled", lambda: True)
    monkeypatch.setattr(auth, "identity", lambda request: gate.Identity())
    monkeypatch.setattr(db, "admin_searches", _no_db)
    with pytest.raises(HTTPException) as exc:
        admin.searches(_Request())
    assert exc.value.status_code == 401


@pytest.fixture
def allowed(monkeypatch):
    seen: dict = {}
    monkeypatch.setattr(admin, "require_admin", lambda request: None)

    def _searches(**kwargs):
        seen.update(kwargs)
        return {"searches": [], "total": 0}

    monkeypatch.setattr(db, "admin_searches", _searches)
    return seen


@pytest.mark.parametrize("bad", [
    {"sort": "seed; DROP TABLE crawl"},
    {"date_from": "yesterday"},
    {"date_to": "2026-13-40"},
    {"location": "2840 OR 1=1"},
])
def test_a_malformed_filter_is_a_400_not_a_query(allowed, bad) -> None:
    with pytest.raises(HTTPException) as exc:
        admin.searches(_Request(), **bad)
    assert exc.value.status_code == 400
    assert allowed == {}


def test_filters_arrive_bounded_and_typed(allowed) -> None:
    admin.searches(
        _Request(), q="  teeth  ", email="a" * 500, location="2840",
        date_from="2026-09-01", paid="1", limit=10_000, offset=-5,
    )
    assert allowed["q"] == "teeth"
    assert len(allowed["email"]) == 200
    assert allowed["location_code"] == 2840
    assert allowed["date_from"] == "2026-09-01"
    assert allowed["date_to"] is None
    assert allowed["paid_only"] is True
    assert allowed["limit"] == 200
    assert allowed["offset"] == 0


def test_a_slug_that_cannot_exist_never_reaches_the_database(monkeypatch) -> None:
    monkeypatch.setattr(admin, "require_admin", lambda request: None)
    monkeypatch.setattr(db, "admin_search_detail", _no_db)
    for slug in ("../etc", "Teeth", "a b", "x" * 300, "-lead"):
        with pytest.raises(HTTPException) as exc:
            admin.search_detail(_Request(), slug)
        assert exc.value.status_code == 404


def test_the_detail_carries_the_stored_result(monkeypatch) -> None:
    monkeypatch.setattr(admin, "require_admin", lambda request: None)
    monkeypatch.setattr(db, "admin_search_detail",
                        lambda slug, **kw: {"slug": slug, "crawls": [{}]})
    monkeypatch.setattr(admin.live, "load_tree", lambda slug: {
        "seed": "teeth whitening",
        "nodes": [
            {"id": "0", "question": "teeth whitening", "depth": 0, "status": "no_data"},
            {"id": "1", "question": "Does it hurt?", "depth": 1, "parent_id": "0",
             "status": "gap", "results": [{"title": "T", "url": "u", "domain": "d",
                                           "overlap": 0.5}]},
        ],
    })
    found = admin.search_detail(_Request(), "teeth-whitening")
    assert found["tree"]["question_count"] == 1
    assert found["tree"]["nodes"][1]["results"] == [{"title": "T", "url": "u", "domain": "d"}]


def test_a_missing_tree_still_shows_the_money(monkeypatch) -> None:
    """The receipts outlive a tree that no longer loads; the page must too."""
    monkeypatch.setattr(admin, "require_admin", lambda request: None)
    monkeypatch.setattr(db, "admin_search_detail",
                        lambda slug, **kw: {"slug": slug, "crawls": [{}]})

    def _boom(slug):
        raise RuntimeError("database went away")

    monkeypatch.setattr(admin.live, "load_tree", _boom)
    assert admin.search_detail(_Request(), "teeth-whitening")["tree"] is None


# ------------------------------------------------------------- export audit


def test_a_customer_cannot_write_an_export_audit_row(refused, monkeypatch) -> None:
    monkeypatch.setattr(db, "admin_log", _no_db)
    with pytest.raises(HTTPException) as exc:
        admin.search_export(_Request(), "teeth-whitening",
                            admin.SearchExportRequest(kind="csv", items=3))
    assert exc.value.status_code == 403


def test_an_admin_export_is_audited_with_who_what_and_how_much(monkeypatch) -> None:
    logged: list[dict] = []
    monkeypatch.setattr(admin, "require_admin",
                        lambda request: gate.Identity(user_id=1, email="boss@example.com"))
    monkeypatch.setattr(db, "admin_log", lambda **kw: logged.append(kw))
    admin.search_export(_Request(), "teeth-whitening",
                        admin.SearchExportRequest(kind="png", items=16))
    assert logged == [{
        "actor": "boss@example.com",
        "action": "search_export",
        "detail": {"slug": "teeth-whitening", "kind": "png", "items": 16},
    }]


def test_only_csv_and_png_are_export_kinds() -> None:
    from pydantic import ValidationError

    with pytest.raises(ValidationError):
        admin.SearchExportRequest(kind="json", items=1)


def test_the_result_carries_every_csv_column(monkeypatch) -> None:
    monkeypatch.setattr(admin, "require_admin", lambda request: None)
    monkeypatch.setattr(db, "admin_search_detail",
                        lambda slug, **kw: {"slug": slug, "crawls": [{}]})
    monkeypatch.setattr(admin.live, "load_tree", lambda slug: {"nodes": [
        {"id": "1", "question": "q", "depth": 1, "status": "gap", "repeat_count": 3,
         "parents": ["a", "b"], "updated_at": "2026-10-01T00:00:00Z"},
    ]})
    node = admin.search_detail(_Request(), "s")["tree"]["nodes"][0]
    assert (node["repeat_count"], node["parents"], node["updated_at"]) == (
        3, ["a", "b"], "2026-10-01T00:00:00Z")
