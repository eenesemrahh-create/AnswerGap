"""Admin: search the empty searches again now that the fallback exists.

The SQL that finds them runs in tests/test_sql.py. These pin the gate, the
owner the new crawl is written for, and that a paused provider stops the run.
"""

from __future__ import annotations

import pytest
from fastapi import HTTPException

from answergap import db, gate, live
from answergap.dataforseo import AccountBlocked
from api import admin, auth


class _Request:
    headers: dict = {}
    client = None


ROWS = [
    {"slug": "wall-art-en-2840", "seed": "wall art", "language_code": "en",
     "location_code": 2840, "user_id": 7, "anon_id": "b1", "created_at": None},
    {"slug": "iron-en-2840", "seed": "iron", "language_code": "en",
     "location_code": 2840, "user_id": None, "anon_id": "b2", "created_at": None},
]


@pytest.fixture
def admin_db(monkeypatch):
    logged: list = []
    monkeypatch.setattr(admin, "require_admin",
                        lambda request: gate.Identity(user_id=1, email="boss@example.com"))
    monkeypatch.setattr(db, "empty_searches", lambda limit=200: ROWS[:limit])
    monkeypatch.setattr(db, "admin_log", lambda **kw: logged.append(kw))
    return logged


def test_a_customer_cannot_run_it(monkeypatch) -> None:
    monkeypatch.setattr(auth, "accounts_enabled", lambda: True)
    monkeypatch.setattr(auth, "identity",
                        lambda request: gate.Identity(user_id=5, email="c@example.com"))
    monkeypatch.setattr(auth, "ADMIN_EMAILS", {"boss@example.com"})
    monkeypatch.setattr(live, "crawl", lambda *a, **k: pytest.fail("crawled"))
    with pytest.raises(HTTPException) as exc:
        admin.empty_searches_run(_Request(), admin.EmptySearchRunRequest())
    assert exc.value.status_code == 403


def test_each_is_searched_again_for_its_own_owner(monkeypatch, admin_db) -> None:
    calls = []

    def crawl(seed, location_code, language_code, *, user_id, anon_id):
        calls.append((seed, user_id, anon_id))
        return {"question_count": 15 if seed == "wall art" else 0, "estimated_spend": 0.0052}

    monkeypatch.setattr(live, "crawl", crawl)
    result = admin.empty_searches_run(_Request(), admin.EmptySearchRunRequest())
    assert calls == [("wall art", 7, "b1"), ("iron", None, "b2")]
    assert (result["filled"], result["still_empty"], result["failed"]) == (1, 1, 0)
    assert result["spend"] == pytest.approx(0.0104)
    # Audited before anything was bought.
    assert admin_db[0]["action"] == "empty_searches_run"


def test_a_paused_provider_stops_the_run(monkeypatch, admin_db) -> None:
    calls = []

    def crawl(seed, *a, **k):
        calls.append(seed)
        raise AccountBlocked("paused", 40201)

    monkeypatch.setattr(live, "crawl", crawl)
    result = admin.empty_searches_run(_Request(), admin.EmptySearchRunRequest())
    assert calls == ["wall art"]
    assert result["stopped"] == 40201


def test_the_list_says_the_ceiling(admin_db) -> None:
    listed = admin.empty_searches(_Request())
    assert [s["slug"] for s in listed["searches"]] == ["wall-art-en-2840", "iron-en-2840"]
    assert "anon_id" not in listed["searches"][0]
    assert listed["max_cost_each"] == pytest.approx(0.0112)
