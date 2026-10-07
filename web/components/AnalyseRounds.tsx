"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { ApiError, analyseRound, fetchJobs } from "@/lib/api";
import type { JobsStatus, RoundPlan } from "@/lib/types";
import { useI18n } from "@/i18n";

/**
 * Analyse the tree in at most two flat-priced rounds (2026-10-07).
 *
 *   round 1   every question not analysed yet      2 credits
 *   round 2   what round 1 added to the tree       3 credits
 *
 * Each analysis also brings that question's own PAA questions, so a round
 * GROWS the tree, and round 2 is what analyses the growth. There is no
 * round 3: whatever round 2 adds stays unanalysed, and the screen says how
 * many rather than letting a grey box pass for a checked one.
 *
 * Same transaction shape as `BatchScore`: a click prices the round with a dry
 * run, confirming is a second act, and results arrive over the Standard queue
 * and are polled through `/jobs`. The price comes from the API - the rule
 * lives in `gate.FLAT_PRICES`, and a copy here would be a second place for it
 * to be wrong.
 */
export function AnalyseRounds({
  slug,
  roundsUsed,
  unanalysed,
  onFinished,
}: {
  slug: string;
  /** 0, 1 or 2, from the tree. */
  roundsUsed: number;
  /** Questions with no analysis yet. */
  unanalysed: number;
  onFinished: () => void;
}) {
  const { t } = useI18n();
  const [plan, setPlan] = useState<RoundPlan | null>(null);
  const [jobs, setJobs] = useState<JobsStatus | null>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<ApiError | null>(null);

  const pending = jobs?.pending ?? 0;
  const running = pending > 0;

  // `onFinished` would otherwise re-arm the interval on every parent render.
  const finishedRef = useRef(onFinished);
  useEffect(() => {
    finishedRef.current = onFinished;
  });

  const poll = useCallback(async () => {
    try {
      const next = await fetchJobs(slug);
      setJobs(next);
      return next.pending;
    } catch {
      return null; // a failed poll is not a failed round; try again next tick
    }
  }, [slug]);

  /* Once on arrival, so a page reloaded mid-round shows the round still
     arriving instead of offering the next one - which the API would refuse
     with `roundInFlight` anyway. */
  useEffect(() => {
    let live = true;
    fetchJobs(slug)
      .then((next) => {
        if (live) setJobs(next);
      })
      .catch(() => {});
    return () => {
      live = false;
    };
  }, [slug]);

  useEffect(() => {
    if (!running) return;
    const id = setInterval(async () => {
      const left = await poll();
      if (left === 0) finishedRef.current();
    }, 6000);
    return () => clearInterval(id);
  }, [running, poll]);

  const run = async (dryRun: boolean) => {
    setBusy(true);
    setError(null);
    try {
      const next = await analyseRound(slug, { dry_run: dryRun });
      if (dryRun) {
        setPlan(next);
      } else {
        setPlan(null);
        if ((await poll()) === 0) finishedRef.current();
      }
    } catch (e) {
      setError(e instanceof ApiError ? e : new ApiError("http", {}));
    } finally {
      setBusy(false);
    }
  };

  const failure = error && (
    <span className="batch-failed">
      {t(`error.${error.kind}`, error.values)}
    </span>
  );

  if (running) {
    const total = (jobs?.done ?? 0) + pending;
    return (
      <div className="batch running">
        <span className="spinner" aria-hidden />
        <span>{t("batch.running", { done: jobs?.done ?? 0, total })}</span>
        {jobs?.failed ? (
          <span className="batch-failed">{t("batch.failed", { count: jobs.failed })}</span>
        ) : null}
      </div>
    );
  }

  if (plan) {
    return (
      <div className="batch confirm">
        <div className="batch-line">
          <b>{t("rounds.confirmCount", { count: plan.count })}</b>
          <b className="batch-credits">{t("batch.credits", { count: plan.credits ?? 0 })}</b>
        </div>
        <div className="muted batch-skipped">{t("rounds.grows")}</div>
        {plan.left_out > 0 && (
          <div className="muted batch-skipped">
            {t("rounds.leftOut", { count: plan.left_out })}
          </div>
        )}
        <div className="batch-actions">
          <button className="primary" onClick={() => run(false)} disabled={busy || !plan.count}>
            {busy ? t("batch.posting") : t("batch.confirm")}
          </button>
          <button onClick={() => setPlan(null)} disabled={busy}>
            {t("batch.cancel")}
          </button>
        </div>
        {failure}
      </div>
    );
  }

  if (roundsUsed >= 2) {
    return (
      <div className="batch">
        <span className="muted">
          {unanalysed > 0
            ? t("rounds.limit", { count: unanalysed })
            : t("rounds.limitNone")}
        </span>
      </div>
    );
  }

  return (
    <div className="batch">
      <button
        className="primary"
        onClick={() => run(true)}
        disabled={busy || unanalysed === 0}
      >
        {busy
          ? t("batch.pricing")
          : roundsUsed === 0
            ? t("rounds.first")
            : t("rounds.second")}
      </button>
      {unanalysed === 0 && <span className="muted">{t("batch.allChecked")}</span>}
      {failure}
    </div>
  );
}
