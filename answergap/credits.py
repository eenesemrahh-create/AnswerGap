"""Credit pockets: which grant a spend came out of, and what has burned.

THE OPERATOR'S RULES (2026-10-17):

1. Every paid or assigned plan period is its own POCKET, and what is left in
   it BURNS when that period ends.
2. A spend comes out of the live plan pocket that ends EARLIEST; when that
   one is empty, the next.
3. Credits that came from no plan (the signup grant, an admin's manual
   grant) never expire and are spent LAST.

THE BALANCE STAYS `sum(delta)`. A dozen queries read it that way and the
ledger stays append-only, so nothing here rewrites a row. What this module
adds is the answer to "which pocket" - by REPLAYING the ledger in order - and
the size of each burn, which `db.expire_credits` then writes as a negative
`plan_expired` line. From that moment the plain sum is right again.

Pure on purpose: no database, no clock. Everything about the money that can
be wrong is testable here with a list of dicts.

A ROW the replay reads carries `id`, `delta`, `reason`, `ref`,
`created_at`, and, on a plan grant, `subscription_id` + `expires_at`. Rows
from before pockets existed have neither and count as never-expiring - no
one loses credits retroactively to a rule that did not exist when they were
granted.
"""

from __future__ import annotations

from dataclasses import dataclass, field
from datetime import datetime

EXPIRED = "plan_expired"
CLAWBACK = "subscription_clawback"


@dataclass
class Pocket:
    id: int                         # the granting ledger row
    granted: int
    subscription_id: int | None     # None: a non-plan grant, never expires
    expires_at: datetime | None
    created_at: datetime
    remaining: int = 0
    burned: int = 0                 # what the period's end took (replayed)
    burn_written: int = 0           # what `plan_expired` rows already took
    settled: bool = False           # a `plan_expired` row exists for it
    expired: bool = False           # its period has ended (replayed)
    repaid: int = 0                 # taken at grant time to clear earlier debt

    @property
    def is_plan(self) -> bool:
        return self.subscription_id is not None and self.expires_at is not None

    def live(self, at: datetime) -> bool:
        return self.expires_at is None or self.expires_at > at


@dataclass
class Replay:
    pockets: list[Pocket] = field(default_factory=list)
    # Spending that found no credit anywhere. `record_usage` debits
    # unconditionally, so a balance can go below zero; that debt is repaid
    # by the next grant, exactly as `sum(delta)` already does.
    debt: int = 0

    def to_burn(self) -> list[tuple[Pocket, int]]:
        """Ended pockets with no `plan_expired` row yet, and how much to burn.

        A pocket spent to zero before its end still gets a row, of 0: it
        marks the pocket settled, so the next read does not replay it again.
        """
        return [(p, max(0, p.burned - p.burn_written)) for p in self.pockets
                if p.is_plan and p.expired and not p.settled]

    def balance(self) -> int:
        return sum(p.remaining for p in self.pockets) - self.debt


def _order(p: Pocket):
    # Plan pockets first, earliest end first; then the never-expiring ones,
    # oldest first. Ties fall to the older grant.
    if p.is_plan:
        return (0, p.expires_at, p.created_at, p.id)
    return (1, p.created_at, p.created_at, p.id)


def replay(rows: list[dict], now: datetime) -> Replay:
    """Walk the ledger in order and say what is left in every pocket."""
    out = Replay()
    by_id: dict[int, Pocket] = {}
    ordered = sorted(rows, key=lambda r: (r["created_at"], r["id"]))

    def expire_until(at: datetime) -> None:
        for p in out.pockets:
            if p.is_plan and not p.expired and p.expires_at <= at:
                p.expired = True
                p.burned = p.remaining
                p.remaining = 0

    def take(amount: int, at: datetime, only_subscription: int | None = None) -> int:
        """Take up to `amount` from live pockets in spending order."""
        left = amount
        for p in sorted(out.pockets, key=_order):
            if left <= 0:
                break
            if p.remaining <= 0 or not p.live(at):
                continue
            if only_subscription is not None and p.subscription_id != only_subscription:
                continue
            got = min(p.remaining, left)
            p.remaining -= got
            left -= got
        return left

    for row in ordered:
        at = row["created_at"]
        expire_until(at)
        delta = int(row["delta"] or 0)
        reason = row.get("reason") or ""

        if reason == EXPIRED:
            # The written form of a burn the replay already performs at the
            # pocket's own end time. Recorded, never spent twice.
            ref = row.get("ref") or ""
            pid = int(ref.split(":", 1)[1]) if ref.startswith("lot:") else None
            if pid in by_id:
                by_id[pid].burn_written += -delta
                by_id[pid].settled = True
            continue

        if delta > 0:
            pocket = Pocket(
                id=int(row["id"]), granted=delta,
                subscription_id=row.get("subscription_id"),
                expires_at=row.get("expires_at") if row.get("subscription_id") else None,
                created_at=at, remaining=delta,
            )
            if out.debt:
                paid = min(out.debt, pocket.remaining)
                pocket.remaining -= paid
                pocket.repaid = paid
                out.debt -= paid
            out.pockets.append(pocket)
            by_id[pocket.id] = pocket
            continue

        if delta < 0:
            amount = -delta
            if reason == CLAWBACK:
                ref = row.get("ref") or ""
                sid = int(ref.split(":", 1)[1]) if ref.startswith("subscription:") else None
                amount = take(amount, at, only_subscription=sid) if sid else amount
            out.debt += take(amount, at)

    expire_until(now)
    return out


def remaining_for(rep: Replay, subscription_id: int, now: datetime) -> int:
    """What is still spendable in one plan's live pockets."""
    return sum(p.remaining for p in rep.pockets
               if p.subscription_id == subscription_id and p.live(now))


def summary(rep: Replay, now: datetime) -> list[dict]:
    """The live pockets, in the order they will be spent, for the screens."""
    live = [p for p in rep.pockets if p.remaining > 0 and p.live(now)]
    return [
        {
            "subscription_id": p.subscription_id,
            "granted": p.granted,
            "remaining": p.remaining,
            "expires_at": p.expires_at.isoformat() if p.is_plan and p.expires_at else None,
        }
        for p in sorted(live, key=_order)
    ]
