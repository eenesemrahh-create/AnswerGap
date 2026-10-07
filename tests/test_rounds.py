"""Analysis rounds (2026-10-07): at most two, flat-priced, each grows the tree.

    round 1   every question not analysed yet      2 credits
    round 2   what round 1 added                   3 credits

Pure tests: the database is replaced by the few calls `queue_round` makes, so
the rules - price, cap, limit, in-flight refusal, the round written on every
receipt - are pinned without Postgres. `test_sql.py` covers the SQL itself.
"""

from __future__ import annotations

import pytest

from answergap import db, gate, live


# ------------------------------------------------------------------ prices


def test_round_one_costs_two_credits_whatever_its_size() -> None:
    assert gate.credit_cost("round1", 1) == 2
    assert gate.credit_cost("round1", 40) == 2


def test_round_two_costs_three() -> None:
    assert gate.credit_cost("round2", 1) == 3
    assert gate.credit_cost("round2", 80) == 3


def test_a_round_that_buys_nothing_costs_nothing() -> None:
    """Everything already analysed - shared scores, or a cache - is free."""
    assert gate.credit_cost("round1", 0) == 0
    assert gate.credit_cost("round2", 0) == 0


def _member(balance: int) -> tuple[gate.Identity, gate.State]:
    who = gate.Identity(user_id=1, anon_id=None, ip_hash=None, email="a@example.com")
    state = gate.State(
        accounts_enabled=True, status="active", email_verified=True, balance=balance
    )
    return who, state


def test_a_short_balance_refuses_a_round_rather_than_trimming_it() -> None:
    """Half a round is not what was bought."""
    who, state = _member(1)
    decision = gate.decide(who, state, action="round1", units=40)
    assert not decision.allowed
    assert decision.outcome == gate.REFUSED_NO_CREDITS


def test_enough_balance_buys_the_whole_round() -> None:
    who, state = _member(2)
    decision = gate.decide(who, state, action="round1", units=40)
    assert decision.allowed
    assert decision.affordable_units == 40


def test_queued_batches_still_trim_as_before() -> None:
    """The flat rule must not leak into the per-request actions."""
    who, state = _member(1)
    decision = gate.decide(who, state, action="batch", units=10)
    assert decision.allowed
    assert decision.affordable_units == 2


# ------------------------------------------------------------------ rounds


def _tree(unanalysed: int, analysed: int = 0) -> dict:
    nodes = [{"id": "seed", "slug": "seed", "question": "seed", "depth": 0,
              "results_checked": 8, "repeat_count": 0}]
    for i in range(unanalysed):
        nodes.append({"id": f"q{i}", "slug": f"q{i}", "question": f"Question {i}?",
                      "depth": 1, "results_checked": 0, "repeat_count": 0})
    for i in range(analysed):
        nodes.append({"id": f"a{i}", "slug": f"a{i}", "question": f"Done {i}?",
                      "depth": 1, "results_checked": 8, "repeat_count": 0})
    return {"slug": "t", "nodes": nodes, "language_code": "en", "location_code": 2840}


@pytest.fixture
def fake_db(monkeypatch):
    """The four db calls a round makes, with the state a test sets."""
    state = {"rounds_used": 0, "tasks": [], "inserted": []}
    monkeypatch.setattr(db, "available", lambda: True)
    monkeypatch.setattr(db, "rounds_used", lambda slug: state["rounds_used"])
    monkeypatch.setattr(db, "tasks_for_tree", lambda slug: state["tasks"])
    monkeypatch.setattr(db, "task_insert", lambda **kw: state["inserted"].append(kw))

    class Client:
        def serp_task_post(self, items, postback_url=None):
            return [
                {"task_id": f"task-{i}", "cache_key": item["cache_key"],
                 "keyword": item["keyword"], "cost": 0.0006}
                for i, item in enumerate(items)
            ]

    monkeypatch.setattr(live, "_client", lambda **_: Client())
    return state


def test_round_one_analyses_every_unanalysed_question(fake_db) -> None:
    plan = live.queue_round(_tree(15, analysed=3), dry_run=True)
    assert plan["round"] == 1
    assert plan["action"] == "round1"
    assert plan["count"] == 15
    assert plan["left_out"] == 0


def test_a_round_is_capped_and_says_how_many_it_left(fake_db) -> None:
    plan = live.queue_round(_tree(55), dry_run=True)
    assert plan["count"] == live.ROUND_CAPS[1] == 40
    assert plan["left_out"] == 15


def test_round_two_follows_round_one(fake_db) -> None:
    fake_db["rounds_used"] = 1
    plan = live.queue_round(_tree(60), dry_run=True)
    assert plan["round"] == 2
    assert plan["count"] == 60  # under round 2's cap of 80


def test_there_is_no_round_three(fake_db) -> None:
    fake_db["rounds_used"] = 2
    with pytest.raises(live.RoundLimit):
        live.queue_round(_tree(10), dry_run=True)


def test_a_round_cannot_open_while_the_last_is_arriving(fake_db) -> None:
    fake_db["tasks"] = [{"status": "posted", "cache_key": "x"}]
    with pytest.raises(live.RoundInFlight):
        live.queue_round(_tree(10), dry_run=True)


def test_every_receipt_carries_its_round(fake_db) -> None:
    """The round on the receipt is how the NEXT call knows which round it is."""
    fake_db["rounds_used"] = 1
    live.queue_round(_tree(3), postback_url=None)
    assert len(fake_db["inserted"]) == 3
    assert {row["round_no"] for row in fake_db["inserted"]} == {2}


def test_a_round_never_rebuys_an_analysed_question(fake_db) -> None:
    plan = live.queue_round(_tree(0, analysed=5), dry_run=True)
    assert plan["count"] == 0
    assert gate.credit_cost(plan["action"], plan["count"]) == 0
