"""The market a search ran in travels with the tree and its summary."""

from __future__ import annotations

import pytest

from api import main

US = {"code": 2840, "name": "United States", "iso": "US", "languages": []}


def test_the_country_is_read_from_the_list(monkeypatch: pytest.MonkeyPatch) -> None:
    monkeypatch.setattr(main, "_COUNTRIES", [US])
    assert main._market({"location_code": 2840}) == {
        "location_name": "United States",
        "location_iso": "US",
    }


@pytest.mark.parametrize("tree", [{"location_code": 1}, {"location_code": None}, {}])
def test_an_unknown_market_adds_nothing(
    monkeypatch: pytest.MonkeyPatch, tree: dict
) -> None:
    monkeypatch.setattr(main, "_COUNTRIES", [US])
    assert main._market(tree) == {}


def test_the_summary_carries_it(monkeypatch: pytest.MonkeyPatch) -> None:
    monkeypatch.setattr(main, "_COUNTRIES", [US])
    summary = main._summary({"location_code": 2840, "nodes": []})
    assert summary["location_iso"] == "US"
    assert "nodes" not in summary
