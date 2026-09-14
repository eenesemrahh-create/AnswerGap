"""Detail-level privacy: `_authorize_tree` and the ownership gate.

2026-09-14. `/api/trees` (the LIST) has been private since 2026-09-08. This
extends the same rule to the DETAIL endpoints - `/api/tree/{slug}`, its
questions, labels, jobs, diff, score and batch. The gate is `_authorize_tree`
in api/main.py, and its behaviour turns on three things: archive vs live,
database available or not, and whether the caller has any crawl row on the
slug (the same rule `db.can_access` writes as one SQL statement).

No network, no database. `_lookup` and `db.available` / `db.can_access` are
patched, because the point here is the SHAPE of the gate - which branch runs
in which case and what it returns - not the SQL that answers can-access at
the far end. The far end has its own tests via test_storage's fixtures.
"""

from __future__ import annotations

import pytest
from fastapi import HTTPException

from answergap import db
from api import main


class FakeIdentity:
    """Everything `_authorize_tree` reads off `who`, and nothing else."""

    def __init__(self, user_id: int | None = None, anon_id: str | None = None) -> None:
        self.user_id = user_id
        self.anon_id = anon_id
        self.signed_in = user_id is not None


def _fixed_lookup(source: str):
    """Return a `_lookup` that always yields a tree with the given source."""

    def _lookup(slug: str) -> dict:
        return {"slug": slug, "source": source, "nodes": []}

    return _lookup


def _missing_lookup(slug: str) -> dict:
    """A `_lookup` that behaves like the real one for a slug that isn't there."""
    raise HTTPException(404, f"No tree: {slug}")


# ---------------------------------------------------------- archive is public


def test_archive_tree_is_public_even_with_db(monkeypatch) -> None:
    """The three Phase 0 demos exist to show the product before sign-in.

    They carry no user data and their whole purpose is to be reachable by any
    visitor, so the ownership rule cannot apply. The gate proves it by
    NEVER calling can_access on an archive - if it ever did, the assertion
    below would fire.
    """
    monkeypatch.setattr(main, "_lookup", _fixed_lookup("archive"))
    monkeypatch.setattr(main.db, "available", lambda: True)

    def _no_call(*args, **kwargs):
        raise AssertionError("can_access must not run for archive trees")

    monkeypatch.setattr(main.db, "can_access", _no_call)
    result = main._authorize_tree("demo-slug", FakeIdentity())
    assert result["source"] == "archive"


# ---------------------------------------------------------- live + no db


def test_live_tree_without_db_is_open(monkeypatch) -> None:
    """Filesystem-only setup has no ownership concept - gate is a no-op.

    That is the local-dev case. A gate that refused everything without a
    database would make the laptop the one place the product is broken; the
    same reasoning that made accounts optional at the schema level.
    """
    monkeypatch.setattr(main, "_lookup", _fixed_lookup("live"))
    monkeypatch.setattr(main.db, "available", lambda: False)

    def _no_call(*args, **kwargs):
        raise AssertionError("can_access must not run without a database")

    monkeypatch.setattr(main.db, "can_access", _no_call)
    result = main._authorize_tree("some-slug", FakeIdentity())
    assert result["source"] == "live"


# ---------------------------------------------------------- live + db


def test_live_tree_returns_when_owner_matches(monkeypatch) -> None:
    monkeypatch.setattr(main, "_lookup", _fixed_lookup("live"))
    monkeypatch.setattr(main.db, "available", lambda: True)
    monkeypatch.setattr(main.db, "can_access", lambda slug, **kw: True)
    result = main._authorize_tree("s", FakeIdentity(user_id=1))
    assert result["slug"] == "s"


def test_stranger_gets_404_not_403(monkeypatch) -> None:
    """Existence is metadata: 403 would say "someone did search this" and
    404 does not. Aligned with `/api/trees`, which returns [] for a
    signed-out caller rather than 'you cannot see this'.
    """
    monkeypatch.setattr(main, "_lookup", _fixed_lookup("live"))
    monkeypatch.setattr(main.db, "available", lambda: True)
    monkeypatch.setattr(main.db, "can_access", lambda slug, **kw: False)
    with pytest.raises(HTTPException) as exc:
        main._authorize_tree("s", FakeIdentity(user_id=2))
    assert exc.value.status_code == 404


def test_anon_identity_is_passed_through_to_can_access(monkeypatch) -> None:
    """The signed-out visitor's cookie is what lets them BACK INTO their own
    tree after a page reload. Recorded on the crawl row at search time and
    matched here on the follow-up GET. Both identifiers travel to the SQL
    layer; whichever one matches is enough.
    """
    monkeypatch.setattr(main, "_lookup", _fixed_lookup("live"))
    monkeypatch.setattr(main.db, "available", lambda: True)

    captured: dict = {}

    def _capture(slug, *, user_id, anon_id):
        captured["slug"] = slug
        captured["user_id"] = user_id
        captured["anon_id"] = anon_id
        return True

    monkeypatch.setattr(main.db, "can_access", _capture)
    main._authorize_tree("cookie-slug", FakeIdentity(anon_id="browser-xyz"))
    assert captured == {"slug": "cookie-slug", "user_id": None, "anon_id": "browser-xyz"}


# ---------------------------------------------------------- missing tree


def test_missing_tree_is_404_before_the_gate(monkeypatch) -> None:
    """A non-existent slug is 404 whatever the identity - the tree not
    being there is not an ownership question, and `_lookup` raises the
    same HTTPException it always did.
    """
    monkeypatch.setattr(main, "_lookup", _missing_lookup)
    monkeypatch.setattr(main.db, "available", lambda: True)
    monkeypatch.setattr(main.db, "can_access", lambda slug, **kw: True)
    with pytest.raises(HTTPException) as exc:
        main._authorize_tree("no-such", FakeIdentity(user_id=1))
    assert exc.value.status_code == 404


# ---------------------------------------------------------- can_access shape


def test_can_access_with_no_identity_short_circuits(monkeypatch) -> None:
    """Neither user_id nor anon_id means no ownership claim is possible,
    and the function returns False without opening a database connection.

    This matters because the caller path (`_authorize_tree` under a live
    tree with a database) can end up here for an anonymous visitor who has
    lost their cookie: they should get a fast 404, not a wasted query.
    """

    def _explode(*a, **kw):
        raise AssertionError("db.connect should not run when neither id is set")

    monkeypatch.setattr(db, "connect", _explode)
    assert db.can_access("any-slug", user_id=None, anon_id=None) is False
