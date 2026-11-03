"""No empty search: when the desktop page shows no PAA, `crawl` falls back.

Measured 2026-11-03 on "wall art" (US): desktop 0 questions, mobile 15, and
"what wall art" autocomplete 10 suggestions. Order is mobile, then
autocomplete; each step stops the chain once it finds questions.

No database and no DataForSEO: a fake client answers by device and endpoint.
"""

from __future__ import annotations

import copy
import json
from pathlib import Path

import pytest

from answergap import db, live

PROBE = Path(__file__).resolve().parents[1] / "data" / "raw" / "probe-A-click4.json"


def _with_paa() -> dict:
    return json.loads(PROBE.read_text(encoding="utf-8"))


def _without_paa(cost: float = 0.002) -> dict:
    response = _with_paa()
    result = response["tasks"][0]["result"][0]
    result["items"] = [
        item for item in result["items"] if item["type"] != "people_also_ask"
    ] + [{"type": "related_searches", "items": ["wall art unique", "wall art 3d"]}]
    response["cost"] = cost
    return response


def _suggestions(*texts: str) -> dict:
    items = [{"type": "autocomplete", "suggestion": t} for t in texts]
    return {"cost": 0.002, "tasks": [{"result": [{"items": items}]}]}


class FakeClient:
    def __init__(self, desktop: dict, mobile: dict, autocomplete: dict) -> None:
        self.answers = {"desktop": desktop, "mobile": mobile}
        self.autocompletes = autocomplete
        self.billable_calls = 0
        self.cache_hits = 0
        self.estimated_spend = 0.0
        self.calls: list[tuple] = []

    def serp(self, keyword, location_code, language_code, *, cache_key,
             extra_params=None, device="desktop"):
        self.billable_calls += 1
        self.calls.append(("serp", device, keyword))
        return copy.deepcopy(self.answers[device])

    def autocomplete(self, keyword, location_code, language_code, *, cache_key):
        self.billable_calls += 1
        self.calls.append(("autocomplete", keyword))
        return copy.deepcopy(self.autocompletes.get(keyword, _suggestions()))


@pytest.fixture
def run(tmp_path, monkeypatch):
    monkeypatch.setattr(db, "available", lambda: False)
    monkeypatch.setattr(live, "SERP_DIR", tmp_path / "serp")
    monkeypatch.setattr(live, "TREES_DIR", tmp_path / "trees")

    def go(client: FakeClient, seed: str = "wall art") -> dict:
        monkeypatch.setattr(live, "_client", lambda **_: client)
        return live.crawl(seed, 2840, "en")

    return go


def test_a_seed_with_paa_never_falls_back(run) -> None:
    client = FakeClient(_with_paa(), _with_paa(), {})
    tree = run(client)
    assert client.calls == [("serp", "desktop", "wall art")]
    assert {n["discovered_by"] for n in tree["nodes"]} == {"paa"}


def test_the_mobile_page_is_asked_next(run) -> None:
    client = FakeClient(_without_paa(), _with_paa(), {})
    tree = run(client)
    assert client.calls == [("serp", "desktop", "wall art"), ("serp", "mobile", "wall art")]
    assert tree["question_count"] == 15
    questions = [n for n in tree["nodes"] if n["depth"]]
    assert {n["discovered_by"] for n in questions} == {"mobile"}
    # The chain keeps its depth, and the desktop page's phrases are kept.
    assert max(n["depth"] for n in questions) == 5
    assert "wall art unique" in tree["related_searches"]


def test_autocomplete_is_the_last_step(run) -> None:
    ac = {"what wall art": _suggestions(
        "what wall art", "what wall art is trending 2026", "what wall art for bedroom",
    )}
    client = FakeClient(_without_paa(), _without_paa(), ac)
    tree = run(client)
    questions = [n["question"] for n in tree["nodes"] if n["depth"]]
    # The prefix itself comes back as a suggestion and is dropped.
    assert questions == ["what wall art is trending 2026", "what wall art for bedroom"]
    assert {n["discovered_by"] for n in tree["nodes"] if n["depth"]} == {"autocomplete"}
    assert all(n["depth"] == 1 and n["status"] == "no_data" for n in tree["nodes"] if n["depth"])
    # Too few from the first prefix, so every prefix was asked.
    assert [c[1] for c in client.calls if c[0] == "autocomplete"] == [
        "what wall art", "how wall art", "why wall art",
    ]


def test_autocomplete_stops_once_it_has_enough(run) -> None:
    ac = {"what wall art": _suggestions(*(f"what wall art {i}" for i in range(10)))}
    client = FakeClient(_without_paa(), _without_paa(), ac)
    tree = run(client)
    assert [c[0] for c in client.calls] == ["serp", "serp", "autocomplete"]
    assert tree["question_count"] == 10


def test_what_every_bought_response_cost_is_added_up(run) -> None:
    client = FakeClient(_without_paa(0.002), _without_paa(0.002), {})
    tree = run(client)
    # Desktop + mobile + three autocompletes, all reported $0.002.
    assert client.billable_calls == 5
    assert tree["estimated_spend"] == pytest.approx(0.010)
    assert tree["question_count"] == 0


def test_the_budget_covers_the_whole_chain() -> None:
    from answergap import languages

    for lang in languages.LANGUAGES.values():
        assert 1 + len(lang.question_prefixes) <= live.FALLBACK_MAX_REQUESTS
        assert all("{seed}" in t for t in lang.question_prefixes)
