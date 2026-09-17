"""The admin CI page's plumbing: shaping GitHub's answers, the cache, the buttons.

No network. `ci._request` is replaced with a fake that records what it was
asked, so every branch - outage, spent rate limit, missing token - is walked
without GitHub. The handlers are called as plain functions, like
test_pricing.py, because fastapi.testclient needs httpx.
"""

from __future__ import annotations

from types import SimpleNamespace

import pytest

from api import admin, ci


@pytest.fixture(autouse=True)
def _clean(monkeypatch):
    ci.invalidate()
    ci._cache["value"] = None
    monkeypatch.delenv("CI_GITHUB_TOKEN", raising=False)
    yield
    ci.invalidate()
    ci._cache["value"] = None


def _run(run_id: int, status: str = "completed", conclusion: str | None = "success") -> dict:
    return {
        "id": run_id,
        "run_number": run_id,
        "run_attempt": 1,
        "status": status,
        "conclusion": conclusion,
        "event": "push",
        "head_branch": "main",
        "head_sha": "13e4d00aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa",
        "head_commit": {"message": "Add a thing\n\nLong body that must not show"},
        "triggering_actor": {"login": "someone"},
        "html_url": f"https://github.com/x/y/actions/runs/{run_id}",
    }


class FakeGitHub:
    def __init__(self, runs: list[dict], fail: ci.GitHubError | None = None):
        self.runs = runs
        self.fail = fail
        self.calls: list[tuple[str, str]] = []

    def __call__(self, method: str, path: str, body=None):
        self.calls.append((method, path))
        if self.fail:
            raise self.fail
        if path.endswith("/jobs"):
            return {"jobs": [{"name": "Backend tests", "status": "completed",
                              "conclusion": "failure",
                              "steps": [{"name": "checkout", "conclusion": "success"},
                                        {"name": "pytest", "conclusion": "failure"}]}]}
        if "/runs?" in path:
            return {"workflow_runs": self.runs}
        return None


# ------------------------------------------------------------------ shaping


def test_a_run_keeps_only_the_first_line_and_a_short_sha() -> None:
    out = ci.summarize_run(_run(7), jobs=None)
    assert out["message"] == "Add a thing"
    assert out["sha"] == "13e4d00"
    assert out["actor"] == "someone"
    assert out["jobs"] is None


def test_a_failed_job_names_the_step_that_failed() -> None:
    job = ci.summarize_job({"name": "Web", "steps": [
        {"name": "npm ci", "conclusion": "success"},
        {"name": "npm test", "conclusion": "failure"},
        {"name": "npm run build", "conclusion": "skipped"},
    ]})
    assert job["failed_step"] == "npm test"


def test_polling_continues_only_while_something_is_unfinished() -> None:
    assert ci.any_active([{"status": "completed"}, {"status": "in_progress"}])
    assert ci.any_active([{"status": "queued"}])
    assert not ci.any_active([{"status": "completed"}])
    assert not ci.any_active([])


@pytest.mark.parametrize(
    ("status", "remaining", "code"),
    [
        (403, "0", "rateLimited"),
        (429, None, "rateLimited"),
        (403, "12", "tokenRefused"),
        (401, None, "tokenRefused"),
        (404, None, "notFound"),
        (500, None, "githubError"),
    ],
)
def test_a_spent_rate_limit_is_not_reported_as_a_bad_token(status, remaining, code) -> None:
    headers = {} if remaining is None else {"X-RateLimit-Remaining": remaining}
    assert ci.error_code(status, headers) == code


# -------------------------------------------------------------------- cache


def test_jobs_are_fetched_only_for_the_recent_runs(monkeypatch) -> None:
    fake = FakeGitHub([_run(i) for i in range(1, 9)])
    monkeypatch.setattr(ci, "_request", fake)
    out = ci.overview(now=1000.0)
    assert len(out["runs"]) == 8
    assert [r["jobs"] is not None for r in out["runs"]].count(True) == ci.JOB_DETAIL_RUNS
    assert out["runs"][0]["jobs"][0]["failed_step"] == "pytest"
    assert out["error"] is None


def test_a_second_look_inside_the_window_costs_no_calls(monkeypatch) -> None:
    fake = FakeGitHub([_run(1)])
    monkeypatch.setattr(ci, "_request", fake)
    ci.overview(now=1000.0)
    before = len(fake.calls)
    ci.overview(now=1000.0 + ci.CACHE_SECONDS_ANONYMOUS - 1)
    assert len(fake.calls) == before
    ci.overview(now=1000.0 + ci.CACHE_SECONDS_ANONYMOUS)
    assert len(fake.calls) > before


def test_a_token_shortens_the_window(monkeypatch) -> None:
    monkeypatch.setenv("CI_GITHUB_TOKEN", "t")
    monkeypatch.setattr(ci, "_request", FakeGitHub([_run(1)]))
    assert ci.overview(now=1.0)["cache_seconds"] == ci.CACHE_SECONDS_WITH_TOKEN
    assert ci.overview(now=1.0)["can_trigger"] is True


def test_an_outage_keeps_the_last_good_runs_and_says_why(monkeypatch) -> None:
    monkeypatch.setattr(ci, "_request", FakeGitHub([_run(1, "in_progress", None)]))
    good = ci.overview(now=1000.0)
    monkeypatch.setattr(ci, "_request", FakeGitHub([], fail=ci.GitHubError("rateLimited", 403)))
    later = ci.overview(now=5000.0)
    assert later["error"] == "rateLimited"
    assert later["runs"] == good["runs"]
    assert later["fetched_at"] == good["fetched_at"]
    assert later["active"] is True


def test_a_trigger_clears_the_cache(monkeypatch) -> None:
    monkeypatch.setattr(ci, "_request", FakeGitHub([_run(1)]))
    ci.overview(now=1000.0)
    ci.dispatch()
    assert ci._cache["at"] is None


# ------------------------------------------------------------------ buttons


@pytest.fixture
def as_admin(monkeypatch):
    logged: list[dict] = []
    monkeypatch.setattr(admin, "require_admin", lambda request: SimpleNamespace(email="op@x.com"))
    monkeypatch.setattr(admin.db, "admin_log", lambda **kw: logged.append(kw))
    return logged


def test_without_a_token_nothing_is_called_and_nothing_is_logged(monkeypatch, as_admin) -> None:
    fake = FakeGitHub([])
    monkeypatch.setattr(ci, "_request", fake)
    assert admin.ci_dispatch(None) == {"ok": False, "error": "noToken"}
    assert fake.calls == [] and as_admin == []


def test_a_trigger_is_audited_before_github_is_called(monkeypatch, as_admin) -> None:
    monkeypatch.setenv("CI_GITHUB_TOKEN", "t")
    order: list[str] = []
    monkeypatch.setattr(admin.db, "admin_log", lambda **kw: order.append(kw["action"]))
    monkeypatch.setattr(ci, "_request", lambda m, p, b=None: order.append(p))
    out = admin.ci_rerun(None, admin.CiRunRequest(run_id=42))
    assert out == {"ok": True, "error": None}
    assert order == ["ci_rerun", "/repos/eenesemrahh-create/AnswerGap/actions/runs/42/rerun"]


def test_a_refused_trigger_is_still_on_the_record(monkeypatch, as_admin) -> None:
    monkeypatch.setenv("CI_GITHUB_TOKEN", "t")
    monkeypatch.setattr(ci, "_request", FakeGitHub([], fail=ci.GitHubError("tokenRefused", 403)))
    out = admin.ci_cancel(None, admin.CiRunRequest(run_id=9))
    assert out == {"ok": False, "error": "tokenRefused"}
    assert as_admin == [{"actor": "op@x.com", "action": "ci_cancel", "detail": {"run_id": 9}}]


def test_a_run_id_must_be_positive() -> None:
    with pytest.raises(ValueError):
        admin.CiRunRequest(run_id=0)
