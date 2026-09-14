"""Pricing endpoint plumbing: public GET's fallback behaviour.

The rule the marketing landing depends on is `/api/pricing` NEVER breaks the
page. Bad JSON, missing setting, database down - each of those has to answer
`{"plans": []}`, which the landing renders as its hardcoded i18n fallback.

Called as plain functions rather than through a TestClient, because the
project runs without httpx2 and fastapi.testclient depends on it. The
handler is a pure Python function of `db.available` / `db.settings_all`, so
patching those is enough to walk every branch.
"""

from __future__ import annotations

import json

import pytest

from answergap import gate
from api import main


# --------------------------------------------------------------- public GET


def test_pricing_no_setting_returns_empty_list(monkeypatch) -> None:
    """Fresh install: no admin has saved anything.

    The landing reads this as "use the hardcoded i18n fallback in every
    locale" - so an empty list is the RIGHT answer here, not a 404.
    """
    monkeypatch.setattr(main.db, "available", lambda: True)
    monkeypatch.setattr(main.db, "settings_all", lambda: {})
    assert main.pricing() == {"plans": []}


def test_pricing_no_database_returns_empty_list(monkeypatch) -> None:
    """Local dev without Postgres: still serves the landing.

    Marketing content must survive the storage layer being missing. The
    same fallback pattern that kept auth optional at the schema level.
    """
    monkeypatch.setattr(main.db, "available", lambda: False)
    assert main.pricing() == {"plans": []}


def test_pricing_valid_setting_is_returned(monkeypatch) -> None:
    plans = [
        {
            "id": "starter",
            "name": "Starter",
            "desc": "The little one.",
            "price": "$49",
            "per": "/month",
            "features": ["A", "B"],
            "cta": "Start",
            "featured": False,
            "badge": None,
        }
    ]
    monkeypatch.setattr(main.db, "available", lambda: True)
    monkeypatch.setattr(
        main.db,
        "settings_all",
        lambda: {gate.SETTING_PRICING_PLANS: json.dumps(plans)},
    )
    assert main.pricing() == {"plans": plans}


def test_pricing_bad_json_falls_back_to_empty(monkeypatch) -> None:
    """A syntax error in the stored value must NOT break the landing.

    The admin's job is to fix corrupt data; the visitor's landing must keep
    rendering. Same tradeoff as `/api/meta` making the DB layer optional.
    """
    monkeypatch.setattr(main.db, "available", lambda: True)
    monkeypatch.setattr(
        main.db,
        "settings_all",
        lambda: {gate.SETTING_PRICING_PLANS: "{not valid json"},
    )
    assert main.pricing() == {"plans": []}


def test_pricing_wrong_shape_falls_back_to_empty(monkeypatch) -> None:
    """Valid JSON that is not an array of plans. Landing still renders."""
    monkeypatch.setattr(main.db, "available", lambda: True)
    monkeypatch.setattr(
        main.db,
        "settings_all",
        lambda: {gate.SETTING_PRICING_PLANS: '{"nope": "object"}'},
    )
    assert main.pricing() == {"plans": []}


def test_pricing_db_exception_falls_back_to_empty(monkeypatch) -> None:
    """`settings_all` throws - landing still renders.

    A pool exhaustion, a network blip, anything: a marketing endpoint that
    500s during an outage would take the marketing site down over the
    section it decorates.
    """

    def _explode() -> dict[str, str]:
        raise RuntimeError("connection pool exhausted")

    monkeypatch.setattr(main.db, "available", lambda: True)
    monkeypatch.setattr(main.db, "settings_all", _explode)
    assert main.pricing() == {"plans": []}


def test_pricing_whitespace_only_falls_back_to_empty(monkeypatch) -> None:
    """A setting cleared to spaces should read as unset, not corrupt.

    Reader trims and treats blank as "no plans" - the admin editor's save
    path filters empty strings, but a manual DB edit could leave one.
    """
    monkeypatch.setattr(main.db, "available", lambda: True)
    monkeypatch.setattr(
        main.db,
        "settings_all",
        lambda: {gate.SETTING_PRICING_PLANS: "   \n\t  "},
    )
    assert main.pricing() == {"plans": []}
