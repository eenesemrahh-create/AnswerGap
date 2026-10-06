"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { ApiError, deepSearch, fetchJobs, scoreBatch } from "@/lib/api";
import type { DeepPlan, JobsStatus, Pricing } from "@/lib/types";
import { useI18n } from "@/i18n";

/**
 * The two things that spend credits on the Standard queue: checking questions,
 * and opening the branches Google left closed.
 *
 * ONE COMPONENT FOR BOTH, because they are one transaction wearing two labels.
 * Same queue, same half-credit price, same postback, same `/jobs` poll - and,
 * crucially, the same progress display: two independent progress bars over one
 * queue would disagree with each other the moment both had work in it.
 *
 * THE PRICE IS ALWAYS SHOWN BEFORE IT IS SPENT. Clicking a button does not
 * queue anything - it runs a dry run and puts the plan on screen. Confirming is
 * a second, deliberate act. CLAUDE.md's operating rule is that the cost is
 * visible before the request, and these are exactly where a surprise would be
 * expensive: one click, several charges.
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
  canDeepSearch,
  topLevel,
  onFinished,
}: {
  slug: string;
  pricing: Pricing;
  /** How many questions have never been checked. Drives the default batch size. */
  unscored: number;
  /**
   * Whether this account's plan includes deep search.
   *
   * A courtesy, not a control - `/api/tree/{slug}/deep` checks the same
   * capability server-side and refuses without it. Hiding the button keeps
   * somebody from being quoted a price for something they cannot buy.
   */
  canDeepSearch: boolean;
  /**
   * The seed's own questions: how many there are, and how many Google left
   * closed. A click-depth response opens ONE of them, so on most trees three
   * of four are leaves - and that is where the breadth a reader compares
   * against a competitor is missing. Said in counts from this tree only; a
   * promised number of questions would be an average of somebody else's.
   */
  topLevel: { total: number; closed: number };
  onFinished: () => void;
}) {
  const { t } = useI18n();
  const [plan, setPlan] = useState<DeepPlan | null>(null);
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

  // Which of the two is being priced. Read from the plan rather than held
  // separately, so the confirm button cannot buy one thing while the dialog
  // above it describes the other.
  const deep = plan?.action === "deep";

  const run = async (
    call: () => Promise<DeepPlan>,
    { dryRun }: { dryRun: boolean }
  ) => {
    setBusy(true);
    setError(null);
    try {
      const next = await call();
      if (dryRun) {
        setPlan(next);
      } else {
        setPlan(null);
        await poll();
      }
    } catch (e) {
      setError(e instanceof ApiError ? (e.detail ?? e.kind) : String(e));
    } finally {
      setBusy(false);
    }
  };

  const previewBatch = () =>
    run(() => scoreBatch(slug, { top_n: size, dry_run: true }), { dryRun: true });
  const previewDeep = () =>
    run(() => deepSearch(slug, { dry_run: true }), { dryRun: true });
  const confirm = () =>
    run(
      () => (deep ? deepSearch(slug, {}) : scoreBatch(slug, { top_n: size })),
      { dryRun: false }
    );

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
          <b>
            {deep
              ? t("deep.confirmCount", { count: plan.count })
              : t("batch.confirmCount", { count: plan.count })}
          </b>
          {/* WHAT IT COSTS THE READER comes first and in their own currency.
              This line used to open with our DataForSEO bill, and the credits
              the reader was actually about to spend appeared nowhere at all -
              which was survivable while a question cost one credit and is not
              now that a queued one costs half. The full price is struck
              through beside it, because a discount nobody can see is not a
              discount. */}
          {typeof plan.credits === "number" && (
            <b className="batch-credits">
              {t("batch.credits", { count: plan.credits })}
              {plan.credits < plan.count && (
                <s aria-hidden>{plan.count}</s>
              )}
            </b>
          )}
          <span className="batch-cost">{money(plan.estimated_spend)}</span>
          <span className="muted">
            {t("batch.vsLive", { live: money(live), queue: plan.queue })}
          </span>
        </div>
        {/* The reason is the same queue either way, but the sentence names
            what is actually being bought. "Checking in bulk" is not what a
            deep search does, and a discount explained by the wrong thing reads
            as a number somebody got wrong. */}
        {typeof plan.credits === "number" && plan.credits < plan.count && (
          <div className="muted batch-skipped">
            {deep ? t("deep.queueDiscount") : t("batch.queueDiscount")}
          </div>
        )}
        {/* WHICH branches, by name. "Queue 6 requests" is a number nobody can
            check; the questions about to be opened are a claim they can. Each
            one is also scored on the way, which is the part that is easy to
            undersell - the response carries its organic results anyway. */}
        {deep && plan.expanding && plan.expanding.length > 0 && (
          <ul className="batch-skipped deep-branches">
            {plan.expanding.map((b) => (
              <li key={b.slug}>{b.question}</li>
            ))}
          </ul>
        )}
        {deep && <div className="muted batch-skipped">{t("deep.alsoScores")}</div>}
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
      <button onClick={previewBatch} disabled={busy || unscored === 0}>
        {busy ? t("batch.pricing") : t("batch.check", { count: Math.min(size, unscored) })}
      </button>
      {canDeepSearch && (
        <button
          className={topLevel.closed > 0 ? "primary" : undefined}
          onClick={previewDeep}
          disabled={busy}
          title={
            topLevel.closed > 0
              ? t("deep.closedHint", {
                  open: topLevel.total - topLevel.closed,
                  total: topLevel.total,
                  closed: topLevel.closed,
                })
              : undefined
          }
        >
          {topLevel.closed > 0
            ? t("deep.openCount", { count: topLevel.closed })
            : t("deep.open")}
        </button>
      )}
      {canDeepSearch && topLevel.closed > 0 && (
        <span className="muted batch-hint">
          {t("deep.closedHint", {
            open: topLevel.total - topLevel.closed,
            total: topLevel.total,
            closed: topLevel.closed,
          })}
        </span>
      )}
      {unscored === 0 && <span className="muted">{t("batch.allChecked")}</span>}
      {error && <span className="batch-failed">{error}</span>}
    </div>
  );
}
