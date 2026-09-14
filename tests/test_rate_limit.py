"""Per-slug sweep cooldown on `/api/tree/{slug}/jobs`.

The concern this closes is REQUEST AMPLIFICATION rather than cost: every call
to `/jobs` runs `sweep_pending(limit=3)`, and every swept task is a `task_get`
on DataForSEO. The individual calls are free, but the 3-to-1 ratio between
one inbound HTTP GET and up to three outbound API calls is the kind of shape
that turns a legitimate poll loop into an outbound rate-limit trip against
our DataForSEO account.

Ownership gating (2026-09-14) already means only owners reach `/jobs`, so
the surface is smaller, but an owner-turned-abuser (compromised token,
runaway client-side polling) still shouldn't be able to burn upstream quota.
Cooldown breaks the ratio at the source: at most one sweep per slug per
window, regardless of who calls or how often.

No network, no database. `_should_sweep` is pure timing logic and injectable
via the `now` kwarg - real `time.time()` never runs in these tests.
"""

from __future__ import annotations

import pytest

from api import main


@pytest.fixture(autouse=True)
def _clean_cooldown():
    """Every test starts with an empty last-sweep table.

    Cooldown state is a MODULE-level dict; without a reset a passing test
    would carry a stale sweep timestamp into the next one and flip the
    expected result. Clear before AND after, so a failing test does not
    pollute unrelated tests further down the run.
    """
    main._last_sweep_at.clear()
    yield
    main._last_sweep_at.clear()


def test_first_call_for_a_slug_sweeps() -> None:
    """A fresh process has swept nothing - the very first call must run
    the sweep, or the fallback path never gets its first chance to
    recover a stranded task.
    """
    assert main._should_sweep("a-slug", now=0.0) is True


def test_second_call_within_cooldown_is_skipped() -> None:
    """The whole point of the cooldown: back-to-back polls don't stack.

    An overzealous UI or a runaway client that hits `/jobs` twice in the
    same second finds the second call reading task state from Postgres
    without triggering another outbound sweep.
    """
    main._should_sweep("a-slug", now=0.0)  # first call marks
    assert main._should_sweep("a-slug", now=5.0) is False


def test_call_past_the_cooldown_sweeps_again() -> None:
    """Cooldown is bounded, not permanent - after the window the sweep
    resumes so long-running batches without callback still make progress.
    """
    main._should_sweep("a-slug", now=0.0)
    assert main._should_sweep("a-slug", now=main.SWEEP_COOLDOWN_SECONDS + 1) is True


def test_call_just_inside_cooldown_is_skipped() -> None:
    """At `cooldown - epsilon` the second call still hits the cap.

    Pins the inequality: `< threshold` blocks, `>= threshold` allows. The
    threshold second itself is the moment the sweep is allowed to run
    again, not the last moment of the block.
    """
    main._should_sweep("a-slug", now=0.0)
    assert main._should_sweep("a-slug", now=main.SWEEP_COOLDOWN_SECONDS - 0.001) is False


def test_call_at_the_boundary_sweeps_again() -> None:
    """At exactly `cooldown` seconds the sweep resumes.

    "Wait at least 30 seconds" is the natural reading of a 30-second
    cooldown, and this pin protects it against a `<=` refactor that would
    silently shift the semantics to "wait strictly more than 30".
    """
    main._should_sweep("a-slug", now=0.0)
    assert main._should_sweep("a-slug", now=main.SWEEP_COOLDOWN_SECONDS) is True


def test_two_slugs_have_independent_cooldowns() -> None:
    """The cap is per-slug because the amplification worry is per-slug:
    each slug maps to its own set of pending DataForSEO tasks. A user
    polling five trees at once should not throttle each other's sweeps.
    """
    main._should_sweep("slug-a", now=0.0)
    assert main._should_sweep("slug-b", now=0.0) is True


def test_should_sweep_marks_optimistically(monkeypatch) -> None:
    """After `_should_sweep` returns True, `_last_sweep_at[slug]` MUST
    hold the current time - otherwise a concurrent second call could
    also see the old value and both would sweep. The commit-first order
    is documented in the docstring and this test pins it.
    """
    assert "s" not in main._last_sweep_at
    main._should_sweep("s", now=42.0)
    assert main._last_sweep_at["s"] == 42.0
