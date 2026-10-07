"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { planName, useMe } from "@/lib/me";
import { clearSearch, useSearchJob } from "@/lib/search-job";
import { useDayFormat, useI18n } from "@/i18n";

/**
 * "97 credits left · Starter · renews 5 November 2026"  [Upgrade]
 *
 * One line under the nav on every page a signed-in reader sees, so the two
 * numbers that decide whether the next click is affordable - what is left and
 * until when - never need a trip to the account page. Modelled on the strip
 * AlsoAsked keeps under its own header.
 *
 * Draws nothing for a signed-out visitor, and nothing until `/api/me` has
 * answered: a strip that appears as "0 credits" and corrects itself a moment
 * later is a scare, not information.
 *
 * The thin bar along the bottom is what remains of THIS period's allowance,
 * not of the balance - credits roll over, so the balance has no denominator.
 */
export function CreditStrip() {
  const { t } = useI18n();
  const formatDay = useDayFormat();
  const { me, known, plans } = useMe();
  const job = useSearchJob();
  const pathname = usePathname();
  if (!known || !me) return null;
  /* The search in flight, on every page but the search page itself - which
     shows the full waiting panel. Running links back to it; ready links
     straight to the tree. */
  const showJob = job && pathname !== "/";
  const jobChip =
    showJob && (job.status === "running" || job.status === "recovering") ? (
      <Link className="credit-strip-job is-running" href="/">
        <i aria-hidden />
        {t("strip.jobRunning", { seed: job.seed })}
      </Link>
    ) : showJob && job.status === "done" && job.slug ? (
      <Link
        className="credit-strip-job is-done"
        href={`/tree/${encodeURIComponent(job.slug)}`}
        onClick={() => clearSearch()}
      >
        {t("strip.jobReady", { seed: job.seed })} →
      </Link>
    ) : null;

  const sub = me.subscription?.active ? me.subscription : null;
  const until = sub?.current_period_end ?? me.period?.end ?? null;
  const left = me.period ? Math.max(0, 1 - me.period.fraction) : null;
  const empty = me.credits <= 0;

  return (
    <div className={`credit-strip${empty ? " is-empty" : ""}`} role="status">
      <div className="credit-strip-inner">
        <span className="credit-strip-text">
          {empty ? (
            <b>{t("credits.empty")}</b>
          ) : (
            <>
              <b>{me.credits}</b> {t("strip.left")}
            </>
          )}
          <span className="credit-strip-sep" aria-hidden>·</span>
          <span>{sub ? planName(plans, sub.plan_id) : t("account.noPlan")}</span>
          {sub && until && (
            <>
              <span className="credit-strip-sep" aria-hidden>·</span>
              <span>
                {sub.cancel_at_period_end
                  ? t("account.endsOn", { date: formatDay(until) })
                  : t("account.renews", { date: formatDay(until) })}
              </span>
            </>
          )}
        </span>
        {jobChip}
        <Link className="credit-strip-cta" href="/account/subscription">
          {sub ? t("strip.upgrade") : t("strip.choosePlan")}
        </Link>
      </div>
      {left !== null && (
        <i className="credit-strip-meter" style={{ width: `${left * 100}%` }} aria-hidden />
      )}
    </div>
  );
}
