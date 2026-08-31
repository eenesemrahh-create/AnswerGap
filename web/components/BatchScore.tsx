"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { ApiError, fetchJobs, scoreBatch } from "@/lib/api";
import type { BatchPlan, JobsStatus, Pricing } from "@/lib/types";
import { useI18n } from "@/i18n";

/**
 * Score several questions at once, on the Standard queue.
 *
 * THE PRICE IS ALWAYS SHOWN BEFORE IT IS SPENT. Clicking the button does not
 * queue anything - it runs a dry run and puts the plan on screen. Confirming is
 * a second, deliberate act. CLAUDE.md's operating rule is that the cost is
 * visible before the request, and a batch is exactly where a surprise would be
 * expensive: one click, ten charges.
 *
 * The Live comparison sits next to the number rather than in a tooltip. The
 * whole argument for the Standard queue is a ratio, and a ratio with one half
 * hidden is just a number.
 *
 * Results do not arrive in the response. Tasks land 30 seconds to a few minutes
 * later, so this polls `/jobs` - which also sweeps any task whose callback went
 * missing - and refreshes the tree once nothing is pending.
 */
export function BatchScore({
  slug,
  pricing,
  unscored,
  onFinished,
}: {
  slug: string;
  pricing: Pricing;
  /** How many questions have never been checked. Drives the default batch size. */
  unscored: number;
  onFinished: () => void;
}) {
  const { t } = useI18n();
  const [plan, setPlan] = useState<BatchPlan | null>(null);
  const [jobs, setJobs] = useState<JobsStatus | null>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Ten is a default, not a limit. Enough to be worth queueing, small enough
  // that a mis-click costs well under a cent.
  const [size, setSize] = useState(10);

  const pending = jobs?.pending ?? 0;
  const running = pending > 0;

  // `onFinished` would otherwise re-arm the interval on every parent render.
  const finishedRef = useRef(onFinished);
  finishedRef.current = onFinished;

  const poll = useCallback(async () => {
    try {
      const next = await fetchJobs(slug);
      setJobs(next);
      return next.pending;
    } catch {
      return null; // a failed poll is not a failed batch; try again next tick
    }
  }, [slug]);

  useEffect(() => {
    if (!running) return;
    const id = setInterval(async () => {
      const left = await poll();
      if (left === 0) finishedRef.current();
    }, 6000);
    return () => clearInterval(id);
  }, [running, poll]);

  const preview = async () => {
    setBusy(true);
    setError(null);
    try {
      setPlan(await scoreBatch(slug, { top_n: size, dry_run: true }));
    } catch (e) {
      setError(e instanceof ApiError ? (e.detail ?? e.kind) : String(e));
    } finally {
      setBusy(false);
    }
  };

  const confirm = async () => {
    setBusy(true);
    setError(null);
    try {
      await scoreBatch(slug, { top_n: size });
      setPlan(null);
      await poll();
    } catch (e) {
      setError(e instanceof ApiError ? (e.detail ?? e.kind) : String(e));
    } finally {
      setBusy(false);
    }
  };

  const money = (value: number) => `$${value.toFixed(4)}`;

  if (running) {
    const total = (jobs?.done ?? 0) + pending;
    return (
      <div className="batch running">
        <span className="spinner" aria-hidden />
        <span>
          {t("batch.running", { done: jobs?.done ?? 0, total })}
        </span>
        <span className="batch-cost">{money(jobs?.spend ?? 0)}</span>
        {jobs?.failed ? (
          <span className="batch-failed">{t("batch.failed", { count: jobs.failed })}</span>
        ) : null}
      </div>
    );
  }

  if (plan) {
    const live = plan.count * pricing.live_per_request;
    return (
      <div className="batch confirm">
        <div className="batch-line">
          <b>{t("batch.confirmCount", { count: plan.count })}</b>
          <span className="batch-cost">{money(plan.estimated_spend)}</span>
          <span className="muted">
            {t("batch.vsLive", { live: money(live), queue: plan.queue })}
          </span>
        </div>
        {plan.skipped.length > 0 && (
          <div className="muted batch-skipped">
            {t("batch.skipped", { count: plan.skipped.length })}
          </div>
        )}
        {!plan.callback && (
          <div className="muted batch-skipped">{t("batch.noCallback")}</div>
        )}
        <div className="batch-actions">
          <button className="primary" onClick={confirm} disabled={busy || !plan.count}>
            {busy ? t("batch.posting") : t("batch.confirm")}
          </button>
          <button onClick={() => setPlan(null)} disabled={busy}>
            {t("batch.cancel")}
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="batch">
      <label className="batch-size">
        {t("batch.size")}
        <input
          type="number"
          min={1}
          max={50}
          value={size}
          onChange={(e) => setSize(Math.max(1, Math.min(50, Number(e.target.value) || 1)))}
        />
      </label>
      <button onClick={preview} disabled={busy || unscored === 0}>
        {busy ? t("batch.pricing") : t("batch.check", { count: Math.min(size, unscored) })}
      </button>
      {unscored === 0 && <span className="muted">{t("batch.allChecked")}</span>}
      {error && <span className="batch-failed">{error}</span>}
    </div>
  );
}
