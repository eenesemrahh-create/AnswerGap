"""Credit pockets (answergap/credits.py): the operator's rules, 2026-10-17.

1. Each plan period is a pocket; what is left burns when the period ends.
2. Spending takes the live plan pocket that ends earliest first.
3. Non-plan credits (signup, manual grants) never expire and go last.
"""

from __future__ import annotations

import random
from datetime import datetime, timedelta, timezone

from answergap import credits

T0 = datetime(2026, 10, 1, tzinfo=timezone.utc)


def day(n: float) -> datetime:
    return T0 + timedelta(days=n)


class Ledger:
    def __init__(self) -> None:
        self.rows: list[dict] = []

    def add(self, at, delta, reason="search", ref=None, sub=None, ends=None) -> int:
        rid = len(self.rows) + 1
        self.rows.append({"id": rid, "delta": delta, "reason": reason, "ref": ref,
                          "subscription_id": sub, "expires_at": ends,
                          "created_at": at})
        return rid

    def plan(self, at, credits_, sub, ends) -> int:
        return self.add(at, credits_, "subscription", sub=sub, ends=ends)

    def burn(self, now) -> None:
        """What `db.expire_credits` does: write each pending burn."""
        for pocket, amount in credits.replay(self.rows, now).to_burn():
            self.add(now, -amount, credits.EXPIRED, ref=f"lot:{pocket.id}")

    def total(self) -> int:
        return sum(r["delta"] for r in self.rows)


def test_spending_takes_the_plan_that_ends_first() -> None:
    led = Ledger()
    led.add(day(0), 10, "signup")
    led.plan(day(0), 300, sub=1, ends=day(30))
    led.plan(day(1), 1000, sub=2, ends=day(20))
    led.add(day(2), -50)
    rep = credits.replay(led.rows, day(3))
    left = {p.subscription_id: p.remaining for p in rep.pockets}
    assert left == {None: 10, 1: 300, 2: 950}


def test_the_next_plan_starts_when_the_first_is_empty() -> None:
    led = Ledger()
    led.plan(day(0), 100, sub=1, ends=day(10))
    led.plan(day(0), 300, sub=2, ends=day(30))
    led.add(day(1), -130)
    rep = credits.replay(led.rows, day(2))
    assert {p.subscription_id: p.remaining for p in rep.pockets} == {1: 0, 2: 270}


def test_non_plan_credits_go_last() -> None:
    led = Ledger()
    led.add(day(0), 20, "signup")
    led.plan(day(0), 30, sub=1, ends=day(10))
    led.add(day(1), -40)
    rep = credits.replay(led.rows, day(2))
    assert {p.subscription_id: p.remaining for p in rep.pockets} == {None: 10, 1: 0}


def test_what_is_left_burns_at_the_end_of_the_period() -> None:
    led = Ledger()
    led.add(day(0), 5, "signup")
    led.plan(day(0), 300, sub=1, ends=day(30))
    led.add(day(5), -100)
    led.burn(day(31))
    assert led.total() == 5
    assert led.rows[-1]["delta"] == -200 and led.rows[-1]["reason"] == credits.EXPIRED


def test_a_renewal_starts_a_fresh_pocket_and_the_old_one_burns() -> None:
    led = Ledger()
    led.plan(day(0), 300, sub=1, ends=day(30))
    led.add(day(10), -100)
    led.plan(day(30), 300, sub=1, ends=day(60))
    led.burn(day(31))
    assert led.total() == 300
    led.add(day(40), -10)
    rep = credits.replay(led.rows, day(41))
    assert credits.remaining_for(rep, 1, day(41)) == 290


def test_burning_twice_writes_nothing_more() -> None:
    led = Ledger()
    led.plan(day(0), 300, sub=1, ends=day(30))
    led.burn(day(31))
    n = len(led.rows)
    led.burn(day(32))
    assert len(led.rows) == n


def test_a_pocket_spent_to_zero_is_settled_with_a_zero_row() -> None:
    led = Ledger()
    led.plan(day(0), 10, sub=1, ends=day(30))
    led.add(day(1), -10)
    led.burn(day(31))
    assert led.rows[-1]["delta"] == 0
    assert credits.replay(led.rows, day(40)).to_burn() == []


def test_spending_after_the_end_never_touches_the_burned_pocket() -> None:
    """Between the end and the row being written, a spend must come from
    somewhere else - not from credits that were already gone."""
    led = Ledger()
    led.add(day(0), 50, "signup")
    led.plan(day(0), 300, sub=1, ends=day(30))
    led.add(day(31), -20)          # before anybody wrote the burn
    led.burn(day(32))
    assert led.total() == 30


def test_a_clawback_comes_out_of_its_own_plan() -> None:
    led = Ledger()
    led.plan(day(0), 100, sub=1, ends=day(10))
    led.plan(day(0), 300, sub=2, ends=day(30))
    led.add(day(1), -300, credits.CLAWBACK, ref="subscription:2")
    rep = credits.replay(led.rows, day(2))
    assert {p.subscription_id: p.remaining for p in rep.pockets} == {1: 100, 2: 0}


def test_debt_is_repaid_by_the_next_grant() -> None:
    led = Ledger()
    led.add(day(0), -5)
    led.plan(day(1), 100, sub=1, ends=day(30))
    rep = credits.replay(led.rows, day(2))
    assert rep.debt == 0 and credits.remaining_for(rep, 1, day(2)) == 95


def test_old_grants_with_no_pocket_never_expire() -> None:
    led = Ledger()
    led.add(day(0), 300, "subscription")          # from before pockets
    led.burn(day(400))
    assert led.total() == 300


def test_the_summary_is_in_spending_order() -> None:
    led = Ledger()
    led.add(day(0), 10, "signup")
    led.plan(day(0), 300, sub=1, ends=day(30))
    led.plan(day(0), 100, sub=2, ends=day(15))
    out = credits.summary(credits.replay(led.rows, day(1)), day(1))
    assert [p["subscription_id"] for p in out] == [2, 1, None]


def test_after_every_burn_the_plain_sum_is_the_pockets() -> None:
    """THE INVARIANT the rest of the product leans on: once the burns are
    written, `sum(delta)` - what every balance query reads - equals what the
    pockets say is left."""
    rnd = random.Random(7)
    for _ in range(300):
        led = Ledger()
        t = 0.0
        for _ in range(rnd.randint(1, 25)):
            t += rnd.random() * 6
            kind = rnd.random()
            if kind < 0.2:
                led.plan(day(t), rnd.choice([50, 300]), sub=rnd.randint(1, 3),
                         ends=day(t + rnd.choice([5, 15, 30])))
            elif kind < 0.3:
                led.add(day(t), rnd.randint(1, 30), "admin_grant")
            elif kind < 0.35:
                led.add(day(t), -rnd.randint(1, 60), credits.CLAWBACK,
                        ref=f"subscription:{rnd.randint(1, 3)}")
            elif kind < 0.45:
                led.burn(day(t))
            else:
                led.add(day(t), -rnd.randint(1, 3))
        now = day(t + rnd.random() * 40)
        led.burn(now)
        assert led.total() == credits.replay(led.rows, now).balance()
