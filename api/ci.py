"""GitHub Actions, as the admin panel's CI page sees it.

The tests do NOT run here. They run on GitHub's machines (see
`.github/workflows/ci.yml`), against a throwaway Postgres. Running them inside
this service would put a test suite next to the production database and the
paid API keys, which is the one place it must never be. This module only READS
what GitHub reports and, with a token, asks GitHub to run again.

TWO LEVELS, TWO QUESTIONS
-------------------------
Reading needs no token: the repository is public. Unauthenticated calls are
capped at 60 an hour per IP, though, and Railway's egress IP is shared - so the
cache below is what keeps a polling page from spending that allowance.
Triggering needs `CI_GITHUB_TOKEN`: a fine-grained token scoped to THIS
repository with "Actions: read and write" and nothing else. It lives on the api
service only; the admin service and the browser never see it.

Stdlib only (`urllib`), like every other outbound client in this codebase.
"""

from __future__ import annotations

import json
import os
import threading
import time
import urllib.error
import urllib.request
from typing import Any

API = "https://api.github.com"
TIMEOUT_SECONDS = 10

# How many runs the page lists, and for how many of them the per-job breakdown
# is fetched. Jobs cost one call per run, so only the recent ones - the ones a
# person is actually watching - get it.
RUN_LIMIT = 10
JOB_DETAIL_RUNS = 5

# While something is running the page polls; a short cache keeps that to one
# upstream burst per window no matter how many tabs are open. Without a token
# the window is a minute, because 60 requests an hour is the whole allowance.
CACHE_SECONDS_WITH_TOKEN = 8
CACHE_SECONDS_ANONYMOUS = 60


def repo() -> str:
    return os.environ.get("CI_GITHUB_REPO", "eenesemrahh-create/AnswerGap")


def workflow() -> str:
    return os.environ.get("CI_WORKFLOW", "ci.yml")


def branch() -> str:
    return os.environ.get("CI_BRANCH", "main")


def token() -> str | None:
    return os.environ.get("CI_GITHUB_TOKEN") or None


def can_trigger() -> bool:
    return token() is not None


class GitHubError(RuntimeError):
    """A refusal or an outage, carrying a CODE the page can render."""

    def __init__(self, code: str, status: int | None = None, detail: str = ""):
        super().__init__(f"{code} ({status}): {detail}")
        self.code = code
        self.status = status
        self.detail = detail


def _request(method: str, path: str, body: dict | None = None) -> Any:
    headers = {
        "Accept": "application/vnd.github+json",
        "X-GitHub-Api-Version": "2022-11-28",
        "User-Agent": "answergap-admin",
    }
    if token():
        headers["Authorization"] = f"Bearer {token()}"
    data = None
    if body is not None:
        data = json.dumps(body).encode()
        headers["Content-Type"] = "application/json"
    req = urllib.request.Request(f"{API}{path}", data=data, method=method, headers=headers)
    try:
        with urllib.request.urlopen(req, timeout=TIMEOUT_SECONDS) as response:
            raw = response.read()
            return json.loads(raw) if raw else None
    except urllib.error.HTTPError as exc:
        detail = exc.read().decode("utf-8", "replace")[:300]
        raise GitHubError(error_code(exc.code, exc.headers), exc.code, detail) from exc
    except (urllib.error.URLError, TimeoutError, OSError) as exc:
        raise GitHubError("unreachable", None, str(exc)) from exc


def error_code(status: int, headers: Any) -> str:
    """GitHub answers a spent rate limit with 403 OR 429 - tell it from a
    permission problem by the header, or the page would tell the operator to
    fix a token that is fine."""
    remaining = headers.get("X-RateLimit-Remaining") if headers is not None else None
    if status == 429 or (status == 403 and remaining == "0"):
        return "rateLimited"
    if status in (401, 403):
        return "tokenRefused"
    if status == 404:
        return "notFound"
    if status == 409:
        return "conflict"
    if status == 422:
        return "unprocessable"
    return "githubError"


# ------------------------------------------------------------------ shaping


def summarize_job(job: dict) -> dict:
    failed_step = next(
        (
            s.get("name")
            for s in job.get("steps") or []
            if s.get("conclusion") in ("failure", "timed_out", "cancelled")
        ),
        None,
    )
    return {
        "id": job.get("id"),
        "name": job.get("name"),
        "status": job.get("status"),
        "conclusion": job.get("conclusion"),
        "started_at": job.get("started_at"),
        "completed_at": job.get("completed_at"),
        "url": job.get("html_url"),
        "failed_step": failed_step,
    }


def summarize_run(run: dict, jobs: list[dict] | None) -> dict:
    """The fields the page draws, and nothing that could carry a secret."""
    commit = run.get("head_commit") or {}
    message = (commit.get("message") or "").split("\n", 1)[0]
    return {
        "id": run.get("id"),
        "number": run.get("run_number"),
        "attempt": run.get("run_attempt"),
        "status": run.get("status"),
        "conclusion": run.get("conclusion"),
        "event": run.get("event"),
        "branch": run.get("head_branch"),
        "sha": (run.get("head_sha") or "")[:7],
        "message": message,
        "actor": (run.get("triggering_actor") or run.get("actor") or {}).get("login"),
        "created_at": run.get("created_at"),
        "started_at": run.get("run_started_at"),
        "updated_at": run.get("updated_at"),
        "url": run.get("html_url"),
        "jobs": None if jobs is None else [summarize_job(j) for j in jobs],
    }


def any_active(runs: list[dict]) -> bool:
    """Whether the page should keep polling fast."""
    return any(r.get("status") not in ("completed", None) for r in runs)


# --------------------------------------------------------------------- cache

_cache: dict[str, Any] = {"at": None, "value": None}
_lock = threading.Lock()


def cache_fresh(at: float | None, now: float, window: float) -> bool:
    return at is not None and now - at < window


def invalidate() -> None:
    with _lock:
        _cache["at"] = None


def overview(now: float | None = None) -> dict:
    """Recent runs of the workflow on the branch, cached.

    Never raises. A GitHub outage or a spent rate limit comes back as an
    `error` code beside the last good runs, so the page degrades to "stale,
    and here is why" instead of an error screen.
    """
    now = time.time() if now is None else now
    window = CACHE_SECONDS_WITH_TOKEN if token() else CACHE_SECONDS_ANONYMOUS
    with _lock:
        if cache_fresh(_cache["at"], now, window):
            return _cache["value"]
        previous = _cache["value"]

    base = {
        "repo": repo(),
        "workflow": workflow(),
        "branch": branch(),
        "can_trigger": can_trigger(),
        "cache_seconds": window,
    }
    try:
        listing = _request(
            "GET",
            f"/repos/{repo()}/actions/workflows/{workflow()}/runs"
            f"?branch={branch()}&per_page={RUN_LIMIT}",
        )
        runs = []
        for i, run in enumerate((listing or {}).get("workflow_runs") or []):
            jobs = None
            if i < JOB_DETAIL_RUNS:
                detail = _request("GET", f"/repos/{repo()}/actions/runs/{run['id']}/jobs")
                jobs = (detail or {}).get("jobs") or []
            runs.append(summarize_run(run, jobs))
        value = {**base, "runs": runs, "active": any_active(runs), "error": None,
                 "fetched_at": now}
    except GitHubError as exc:
        print(f"[ci] {exc}", flush=True)
        stale = (previous or {}).get("runs") or []
        value = {**base, "runs": stale, "active": any_active(stale), "error": exc.code,
                 "fetched_at": (previous or {}).get("fetched_at")}
    with _lock:
        _cache["at"] = now
        _cache["value"] = value
    return value


# ------------------------------------------------------------------ triggers


def rerun(run_id: int, *, failed_only: bool) -> None:
    suffix = "rerun-failed-jobs" if failed_only else "rerun"
    _request("POST", f"/repos/{repo()}/actions/runs/{int(run_id)}/{suffix}")
    invalidate()


def cancel(run_id: int) -> None:
    _request("POST", f"/repos/{repo()}/actions/runs/{int(run_id)}/cancel")
    invalidate()


def dispatch() -> None:
    _request(
        "POST",
        f"/repos/{repo()}/actions/workflows/{workflow()}/dispatches",
        {"ref": branch()},
    )
    invalidate()
