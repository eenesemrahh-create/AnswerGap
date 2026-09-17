"use client";

import { useCallback, useEffect, useRef, useState, useTransition } from "react";
import type { CiJob, CiOverview, CiRun, CiTriggerResult } from "@/lib/types";
import { cancelRun, loadCi, rerun, runNow } from "./actions";

/* Live while something runs, relaxed otherwise. The api caches GitHub for a
 * few seconds, so polling faster than that would only re-read the cache. */
const POLL_ACTIVE_MS = 5_000;
const POLL_IDLE_MS = 30_000;

const ERRORS: Record<string, string> = {
  noToken: "Triggering needs CI_GITHUB_TOKEN on the api service - see below.",
  tokenRefused:
    "GitHub refused the token. It may have expired, or lack \"Actions: read and write\" on this repository.",
  rateLimited:
    "GitHub's rate limit is spent for now. Showing the last good data; it recovers within the hour.",
  unreachable: "GitHub did not answer. Showing the last good data.",
  notFound:
    "GitHub does not know this workflow yet - it appears after .github/workflows/ci.yml is pushed.",
  conflict: "GitHub refused: that run is not in a state that allows this.",
  unprocessable: "GitHub refused the request as invalid.",
  githubError: "GitHub answered with an error. Showing the last good data.",
};

type Tone = "pass" | "fail" | "run" | "idle";

function state(status: string | null, conclusion: string | null): { label: string; tone: Tone } {
  if (status && status !== "completed") {
    return status === "in_progress"
      ? { label: "Running", tone: "run" }
      : { label: "Queued", tone: "idle" };
  }
  switch (conclusion) {
    case "success":
      return { label: "Passed", tone: "pass" };
    case "failure":
      return { label: "Failed", tone: "fail" };
    case "timed_out":
      return { label: "Timed out", tone: "fail" };
    case "cancelled":
      return { label: "Cancelled", tone: "idle" };
    case "skipped":
      return { label: "Skipped", tone: "idle" };
    default:
      return { label: conclusion ?? "Unknown", tone: "idle" };
  }
}

function Status({ status, conclusion }: { status: string | null; conclusion: string | null }) {
  const s = state(status, conclusion);
  return <span className={`pill ci-${s.tone}`}>{s.label}</span>;
}

function duration(start: string | null, end: string | null, now: number): string {
  if (!start) return "—";
  const ms = (end ? Date.parse(end) : now) - Date.parse(start);
  if (!Number.isFinite(ms) || ms < 0) return "—";
  const s = Math.round(ms / 1000);
  return s < 60 ? `${s}s` : `${Math.floor(s / 60)}m ${String(s % 60).padStart(2, "0")}s`;
}

function ago(seconds: number | null, now: number): string {
  if (seconds === null) return "never";
  const s = Math.max(0, Math.round(now / 1000 - seconds));
  return s < 60 ? `${s}s ago` : `${Math.floor(s / 60)}m ago`;
}

function Jobs({ jobs, now }: { jobs: CiJob[]; now: number }) {
  if (jobs.length === 0) return <p className="empty">No jobs reported yet.</p>;
  return (
    <ul className="ci-jobs">
      {jobs.map((job) => (
        <li key={job.id ?? job.name}>
          <Status status={job.status} conclusion={job.conclusion} />
          <b>{job.name}</b>
          <span className="ci-muted">{duration(job.started_at, job.completed_at, now)}</span>
          {job.failed_step && <span className="ci-failed-step">failed at: {job.failed_step}</span>}
          {job.url && (
            <a href={job.url} target="_blank" rel="noreferrer">
              log
            </a>
          )}
        </li>
      ))}
    </ul>
  );
}

export function CiBoard({ initial }: { initial: CiOverview }) {
  const [data, setData] = useState(initial);
  const [now, setNow] = useState(() => Date.now());
  const [message, setMessage] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();
  const busy = useRef(false);

  const refresh = useCallback(async () => {
    if (busy.current) return;
    busy.current = true;
    try {
      setData(await loadCi());
    } catch {
      /* a failed poll leaves the last good board on screen */
    } finally {
      busy.current = false;
    }
  }, []);

  // Poll: fast while a run is unfinished, slow otherwise, never in a hidden tab.
  // Never faster than the api's own cache - without a token that is a minute,
  // and polling inside it would only re-read the same answer.
  const pollMs = Math.max(
    data.active ? POLL_ACTIVE_MS : POLL_IDLE_MS,
    data.cache_seconds * 1000
  );
  useEffect(() => {
    const id = window.setInterval(() => {
      if (document.visibilityState === "visible") void refresh();
    }, pollMs);
    return () => window.clearInterval(id);
  }, [pollMs, refresh]);

  // A one-second clock so running durations and "checked Xs ago" move.
  useEffect(() => {
    const id = window.setInterval(() => setNow(Date.now()), 1000);
    return () => window.clearInterval(id);
  }, []);

  const act = (label: string, call: () => Promise<CiTriggerResult>) =>
    startTransition(async () => {
      setMessage(null);
      const result = await call();
      if (result.ok) {
        setMessage(`${label}: requested. GitHub usually shows it within a few seconds.`);
        // Twice: GitHub often lists a new or re-queued run a moment after accepting it.
        await refresh();
        window.setTimeout(() => void refresh(), 4000);
      } else {
        setMessage(ERRORS[result.error ?? ""] ?? `GitHub refused (${result.error}).`);
      }
    });

  const [latest, ...older] = data.runs;
  const repoUrl = `https://github.com/${data.repo}/actions/workflows/${data.workflow}`;

  return (
    <>
      <div className="ci-bar">
        {/* No token, no buttons at all - a permanently disabled control is
            worse than none. Setting CI_GITHUB_TOKEN on the api service brings
            every trigger back with no code change; CLAUDE.md says how. */}
        {data.can_trigger && (
          <button className="act" disabled={pending} onClick={() => act("Run now", runNow)}>
            Run now on {data.branch}
          </button>
        )}
        <button className="linkish" onClick={() => void refresh()} disabled={pending}>
          Refresh
        </button>
        <span className="ci-muted">
          {data.active ? "● live" : "idle"} · checked {ago(data.fetched_at, now)} · refreshing every{" "}
          {pollMs / 1000}s
        </span>
        <a className="ci-right" href={repoUrl} target="_blank" rel="noreferrer">
          Open on GitHub
        </a>
      </div>

      {data.error && <div className="notice">{ERRORS[data.error] ?? data.error}</div>}
      {message && <div className="ci-message">{message}</div>}

      {!latest ? (
        <p className="empty">
          No runs yet. The first one starts when .github/workflows/ci.yml reaches {data.branch}.
        </p>
      ) : (
        <>
          <section className={`card ci-latest ci-edge-${state(latest.status, latest.conclusion).tone}`}>
            <div className="ci-latest-head">
              <Status status={latest.status} conclusion={latest.conclusion} />
              <b>
                #{latest.number}
                {latest.attempt > 1 && ` (attempt ${latest.attempt})`}
              </b>
              <code>{latest.sha}</code>
              <span className="ci-message-line">{latest.message}</span>
            </div>
            <div className="ci-muted ci-meta">
              {latest.event} by {latest.actor ?? "?"} ·{" "}
              {duration(latest.started_at, latest.status === "completed" ? latest.updated_at : null, now)}
              {" · "}
              <a href={latest.url} target="_blank" rel="noreferrer">
                run on GitHub
              </a>
            </div>
            {latest.jobs && <Jobs jobs={latest.jobs} now={now} />}
            <RunButtons run={latest} data={data} pending={pending} act={act} />
          </section>

          {older.length > 0 && (
            <>
              <h2>Earlier runs</h2>
              <div className="tablewrap">
                <table>
                  <thead>
                    <tr>
                      <th>Run</th><th>Result</th><th>Commit</th><th>Trigger</th>
                      <th className="num">Took</th><th>Jobs</th><th />
                    </tr>
                  </thead>
                  <tbody>
                    {older.map((run) => (
                      <tr key={run.id}>
                        <td>
                          <a href={run.url} target="_blank" rel="noreferrer">#{run.number}</a>
                        </td>
                        <td><Status status={run.status} conclusion={run.conclusion} /></td>
                        <td className="ci-commit">
                          <code>{run.sha}</code> {run.message}
                        </td>
                        <td>{run.event}</td>
                        <td className="num">
                          {duration(run.started_at, run.status === "completed" ? run.updated_at : null, now)}
                        </td>
                        <td>
                          {run.jobs
                            ? run.jobs.map((j) => (
                                <span key={j.id ?? j.name} title={j.name} className="ci-dot-wrap">
                                  <span className={`ci-dot ci-${state(j.status, j.conclusion).tone}`} />
                                </span>
                              ))
                            : <span className="ci-muted">—</span>}
                        </td>
                        <td><RunButtons run={run} data={data} pending={pending} act={act} compact /></td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </>
          )}
        </>
      )}

    </>
  );
}

function RunButtons({
  run,
  data,
  pending,
  act,
  compact = false,
}: {
  run: CiRun;
  data: CiOverview;
  pending: boolean;
  act: (label: string, call: () => Promise<CiTriggerResult>) => void;
  compact?: boolean;
}) {
  if (!data.can_trigger) return null;
  const running = run.status !== "completed";
  const failed = run.conclusion === "failure" || run.conclusion === "timed_out";
  return (
    <div className={compact ? "ci-buttons compact" : "ci-buttons"}>
      {running ? (
        <button className="act warn" disabled={pending}
                onClick={() => act(`Cancel #${run.number}`, () => cancelRun(run.id))}>
          Cancel
        </button>
      ) : (
        <>
          <button className="act" disabled={pending}
                  onClick={() => act(`Re-run #${run.number}`, () => rerun(run.id, false))}>
            Re-run{compact ? "" : " all jobs"}
          </button>
          {failed && (
            <button className="act" disabled={pending}
                    onClick={() => act(`Re-run failed jobs of #${run.number}`, () => rerun(run.id, true))}>
              Re-run failed
            </button>
          )}
        </>
      )}
    </div>
  );
}
