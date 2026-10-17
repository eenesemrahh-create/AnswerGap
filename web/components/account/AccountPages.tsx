"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import {
  ApiError,
  openBillingPortal,
  resendVerification,
  setDefaultPlan,
  startCheckout,
} from "@/lib/api";
import { marketingPath } from "@/lib/marketing";
import { loadMe, planName, useMe } from "@/lib/me";
import type { Me } from "@/lib/types";
import { useDayFormat, useI18n } from "@/i18n";
import { Avatar } from "../AccountMenu";
import { DeleteAccount } from "../DeleteAccount";
import { LocalePicker } from "../LocalePicker";
import { ThemeToggle } from "../ThemeToggle";
import { AccountShell } from "./AccountShell";
import { UsageRing } from "./UsageRing";
import { useBilling } from "./useBilling";

/* ================================================================ overview */

/**
 * `/account` - the whole account at a glance: what is left, what you are on,
 * who you are. Three cards, each linking to the page that goes deeper.
 * No history: what was spent where is not what somebody opens this for.
 */
export function AccountOverview() {
  const { t } = useI18n();
  const { me } = useMe();
  const name = me?.name || me?.email.split("@")[0] || "";
  const notice = useBillingReturnNotice();

  return (
    <AccountShell
      active="overview"
      title={me ? t("account.hello", { name }) : t("account.title")}
      lead={t("account.overviewLead")}
    >
      {(me) => (
        <>
          {notice && (
            <p className="acct-notice" role="status">
              {notice}
            </p>
          )}
          <div className="acct-grid">
            <CreditsCard me={me} />
            <PlanCard me={me} compact />
            <ProfileCard me={me} />
          </div>
          <Link className="acct-cta-row" href="/">
            <span>
              <b>{t("account.newSearch")}</b>
              <em>{t("account.newSearchLead")}</em>
            </span>
            <span aria-hidden>→</span>
          </Link>
        </>
      )}
    </AccountShell>
  );
}

/** Stripe sends people back to `/account?billing=done|cancelled`. `done`
 *  does not mean the plan is live yet - it arrives by webhook, possibly after
 *  the browser - so the message says it is being set up. */
function useBillingReturnNotice(): string | null {
  const { t } = useI18n();
  const [notice, setNotice] = useState<string | null>(null);
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const billing = params.get("billing");
    if (!billing) return;
    const message =
      billing === "done"
        ? t("account.billingDone")
        : billing === "cancelled"
          ? t("account.billingCancelled")
          : null;
    params.delete("billing");
    const query = params.toString();
    window.history.replaceState(null, "", window.location.pathname + (query ? `?${query}` : ""));
    // Read once from the URL that just arrived, then scrubbed from it.
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setNotice(message);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);
  return notice;
}

function CreditsCard({ me }: { me: Me }) {
  const { t } = useI18n();
  const formatDay = useDayFormat();
  const period = me.period;
  return (
    <Link href="/account/subscription" className="acct-card acct-card-credits">
      <span className="acct-eyebrow">{t("credits.label")}</span>
      {period ? (
        <UsageRing
          remaining={1 - period.fraction}
          label={String(Math.max(0, me.credits))}
          sub={t("strip.left")}
        />
      ) : (
        <div className="acct-bignum">
          <b>{Math.max(0, me.credits)}</b>
          <span>{t("strip.left")}</span>
        </div>
      )}
      <p className="acct-muted">
        {period
          ? t("credits.periodUsed", { used: period.used, granted: period.granted }) +
            (period.end ? ` · ${t("credits.periodResets", { date: formatDay(period.end) })}` : "")
          : t("account.noAllowance")}
      </p>
      {me.credits < 0 && <p className="acct-warn">{t("account.overdrawn", { count: me.credits })}</p>}
    </Link>
  );
}

function ProfileCard({ me }: { me: Me }) {
  const { t } = useI18n();
  return (
    <Link href="/account/profile" className="acct-card acct-card-profile">
      <span className="acct-eyebrow">{t("account.navProfile")}</span>
      <Avatar me={me} size={56} />
      <b className="acct-profile-name">{me.name || me.email.split("@")[0]}</b>
      <span className="acct-muted acct-ellipsis">{me.email}</span>
      <span className={`acct-pill${me.email_verified === false ? " warn" : " ok"}`}>
        {me.email_verified === false ? t("account.unverified") : t("account.verified")}
      </span>
    </Link>
  );
}

/** The plan as a card. `compact` on the overview: it links on to the
 *  subscription page instead of carrying the billing buttons itself. */
function PlanCard({ me, compact }: { me: Me; compact?: boolean }) {
  const { t } = useI18n();
  const formatDay = useDayFormat();
  const { plans } = useMe();
  const { busy, error, goTo } = useBilling();
  const sub = me.subscription ?? null;
  const live = !!sub?.active;

  const body = (
    <>
      <span className="acct-eyebrow">{t("account.planHeading")}</span>
      <b className="acct-plan-name">
        {sub ? planName(plans, sub.plan_id) ?? t("account.noPlan") : t("account.noPlan")}
      </b>
      {live && sub ? (
        <>
          <p>{t("account.planCredits", { count: sub.credits_per_period })}</p>
          <p className="acct-plan-meta">
            {/* Where it came from comes first: a plan somebody was given is
                not one they bought. */}
            {sub.source === "admin" ? t("account.given") : t("account.bought")}
            {sub.current_period_end
              ? ` · ${
                  sub.cancel_at_period_end
                    ? t("account.endsOn", { date: formatDay(sub.current_period_end) })
                    : t("account.renews", { date: formatDay(sub.current_period_end) })
                }`
              : ""}
          </p>
          {sub.status === "past_due" && <p className="acct-plan-warn">{t("account.pastDue")}</p>}
        </>
      ) : (
        <p className="acct-plan-meta">{sub ? t("account.lapsed") : t("account.noPlanLead")}</p>
      )}
    </>
  );

  if (compact) {
    return (
      <Link href="/account/subscription" className={`acct-card acct-card-plan${live ? " is-live" : ""}`}>
        {body}
        <span className="acct-plan-go">
          {live ? t("account.changePlan") : t("strip.choosePlan")} →
        </span>
      </Link>
    );
  }

  return (
    <div className={`acct-card acct-card-plan${live ? " is-live" : ""}`}>
      {body}
      {/* Only for a plan with a card behind it: the portal answers
          `noCustomer` for an account that never bought anything. */}
      {live && sub?.source === "stripe" && (
        <div className="acct-plan-actions">
          <button
            className="btn acct-btn-on-grad"
            onClick={() => goTo("portal", openBillingPortal)}
            disabled={busy === "portal"}
          >
            {busy === "portal" ? t("auth.working") : t("account.manage")}
          </button>
          <span className="acct-plan-fine">{t("account.manageLead")}</span>
        </div>
      )}
      {error && <p className="acct-error">{error}</p>}
    </div>
  );
}

/**
 * Every plan running now, with what is left in its pocket, and the choice
 * of which to keep (operator's rule, 2026-10-17).
 *
 * The explanation sits ABOVE the cards on purpose: "which plan is my credit
 * coming out of" is the question these cards answer, and the rule has to be
 * read before the numbers make sense.
 */
function MyPlans({ me }: { me: Me }) {
  const { t } = useI18n();
  const formatDay = useDayFormat();
  const list = me.plans ?? [];
  const [asking, setAsking] = useState<number | null>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  if (list.length === 0) return null;

  const spendingFrom = me.pockets?.spending_from ?? null;
  const other = me.pockets?.other ?? 0;
  const several = list.length > 1;

  const choose = (id: number) => {
    setBusy(true);
    setError(null);
    setDefaultPlan(id)
      .then(() => loadMe(true))
      .then(() => setAsking(null))
      .catch((err) =>
        setError(err instanceof ApiError ? t(`error.${err.kind}`, err.values) : t("auth.failed"))
      )
      .finally(() => setBusy(false));
  };

  return (
    <>
      <h2 className="acct-section-title">{t("account.myPlansHeading")}</h2>
      <p className="acct-fine">{t("account.myPlansLead")}</p>
      <div className="acct-plans acct-mine">
        {list.map((p) => {
          const others = list.filter((o) => o.id !== p.id && !o.cancel_at_period_end && o.source === "stripe");
          const total = Math.max(0, p.credits_per_period);
          const left = Math.max(0, Math.min(p.credits_left, total || p.credits_left));
          const share = total > 0 ? left / total : 0;
          const spending = spendingFrom === p.id;
          return (
            <div
              key={p.id}
              className={`acct-card acct-mine-card${spending ? " is-spending" : ""}${
                p.cancel_at_period_end ? " is-ending" : ""
              }`}
            >
              <div className="acct-mine-head">
                <b className="acct-mine-name">{p.name ?? planName([], p.plan_id)}</b>
                <div className="acct-pill-row">
                  {p.is_default && <span className="acct-pill acct-pill-star">★ {t("account.defaultBadge")}</span>}
                  {spending && (
                    <span className="acct-pill ok acct-pill-live">
                      <i aria-hidden /> {t("account.spendingFrom")}
                    </span>
                  )}
                </div>
              </div>
              <span className="acct-muted acct-mine-sub">
                {p.source === "admin" ? t("account.given") : t("account.bought")}
                {p.current_period_end
                  ? ` · ${
                      p.cancel_at_period_end
                        ? t("account.endsOn", { date: formatDay(p.current_period_end) })
                        : t("account.renews", { date: formatDay(p.current_period_end) })
                    }`
                  : ""}
              </span>

              <div className="acct-mine-count">
                <b>{left}</b>
                <span>{t("account.ofTotalLeft", { total })}</span>
              </div>
              <div
                className="acct-mine-bar"
                role="progressbar"
                aria-valuemin={0}
                aria-valuemax={total}
                aria-valuenow={left}
                aria-label={t("account.creditsLeftOf", { left, total })}
              >
                <i style={{ width: `${share * 100}%` }} />
              </div>
              <div className="acct-mine-foot">
                <span>{t("account.usedCount", { count: Math.max(0, total - left) })}</span>
                {p.credits_burn_at && left > 0 && (
                  <span>{t("account.burnsOn", { date: formatDay(p.credits_burn_at) })}</span>
                )}
              </div>

              {p.is_default && p.source === "stripe" && !p.cancel_at_period_end && (
                <p className="acct-mine-renew">{t("account.autoRenewHint", { manage: t("account.manage") })}</p>
              )}
              {p.status === "past_due" && <p className="acct-plan-warn">{t("account.pastDue")}</p>}
              {several && !p.is_default && asking !== p.id && (
                <button className="btn acct-mine-btn" disabled={busy} onClick={() => setAsking(p.id)}>
                  {t("account.makeDefault")}
                </button>
              )}
              {asking === p.id && (
                <div className="acct-confirm">
                  <p>
                    {others.length
                      ? t("account.confirmDefault", {
                          plan: p.name ?? "",
                          others: others.map((o) => o.name ?? o.plan_id ?? "").join(", "),
                        })
                      : t("account.confirmDefaultAlone", { plan: p.name ?? "" })}
                  </p>
                  {/* The plan kept RENEWS - including one that was set to
                      stop - so that is said before the button, with where
                      to stop it again. */}
                  {p.source === "stripe" && (
                    <p>{t("account.defaultRenewsNote", { plan: p.name ?? "", manage: t("account.manage") })}</p>
                  )}
                  <button className="btn btn-primary" disabled={busy} onClick={() => choose(p.id)}>
                    {busy ? t("auth.working") : t("account.confirmDefaultYes")}
                  </button>
                  <button className="auth-link" type="button" disabled={busy} onClick={() => setAsking(null)}>
                    {t("account.cancelStep")}
                  </button>
                </div>
              )}
            </div>
          );
        })}
      </div>
      {other > 0 && (
        <div className="acct-mine-other">
          <b>{other}</b>
          <span>{t("account.otherCredits", { count: other })}</span>
        </div>
      )}
      {error && <p className="acct-error">{error}</p>}
    </>
  );
}

/* ================================================================= profile */

export function AccountProfile() {
  const { t } = useI18n();
  return (
    <AccountShell active="profile" title={t("account.navProfile")} lead={t("account.profileLead")}>
      {(me) => <ProfileDetails me={me} />}
    </AccountShell>
  );
}

function ProfileDetails({ me }: { me: Me }) {
  const { t, locale } = useI18n();
  const formatDay = useDayFormat();
  const [resent, setResent] = useState(false);
  const [busy, setBusy] = useState(false);
  const [failed, setFailed] = useState(false);

  const resend = () => {
    setBusy(true);
    resendVerification(me.email, locale)
      .then(() => setResent(true))
      .catch(() => setFailed(true))
      .finally(() => setBusy(false));
  };

  /* Every door that is open, not one label: "Google" printed over an account
     that also has a password would be the page lying about the account. */
  const doors = [
    me.has_password !== false ? t("account.doorPassword") : null,
    me.has_google ? t("account.doorGoogle") : null,
  ].filter(Boolean) as string[];

  return (
    <div className="acct-card acct-profile">
      <div className="acct-profile-hero">
        <Avatar me={me} size={72} />
        <div>
          <b className="acct-profile-name">{me.name || me.email.split("@")[0]}</b>
          <span className="acct-muted">{me.email}</span>
        </div>
      </div>
      <dl className="acct-rows">
        <div>
          <dt>{t("account.email")}</dt>
          <dd>
            <span className="acct-ellipsis">{me.email}</span>
            {me.email_verified === false ? (
              <>
                <span className="acct-pill warn">{t("account.unverified")}</span>
                {resent ? (
                  <span className="acct-muted">{t("account.verifySent")}</span>
                ) : (
                  <button className="acct-link-btn" onClick={resend} disabled={busy}>
                    {busy ? t("auth.working") : t("account.verifyAction")}
                  </button>
                )}
                {failed && <span className="acct-error">{t("auth.failed")}</span>}
              </>
            ) : (
              <span className="acct-pill ok">{t("account.verified")}</span>
            )}
          </dd>
        </div>
        <div>
          <dt>{t("account.name")}</dt>
          <dd>{me.name || <span className="acct-muted">{t("account.unnamed")}</span>}</dd>
        </div>
        {me.created_at && (
          <div>
            <dt>{t("account.joined")}</dt>
            <dd>{formatDay(me.created_at)}</dd>
          </div>
        )}
        <div>
          <dt>{t("account.doors")}</dt>
          <dd className="acct-doors">
            {doors.length ? doors.map((d) => <span key={d} className="acct-pill">{d}</span>) : "—"}
          </dd>
        </div>
      </dl>
    </div>
  );
}

/* ============================================================ subscription */

export function AccountSubscription() {
  const { t, locale } = useI18n();
  const { plans } = useMe();
  const { busy, error, goTo } = useBilling();
  const [confirming, setConfirming] = useState<string | null>(null);

  return (
    <AccountShell
      active="subscription"
      title={t("account.navSubscription")}
      lead={t("account.subscriptionLead")}
    >
      {(me) => {
        const sub = me.subscription ?? null;
        const enabled = plans.filter((p) => p.enabled);
        const running = me.plans ?? [];
        // A plan already running and renewing cannot be bought again: that
        // is two charges for one thing (the API answers `alreadyOnPlan`).
        const renewing = (id: string) =>
          running.some((p) => p.plan_id === id && p.source === "stripe" && !p.cancel_at_period_end) ||
          (running.length === 0 && !!sub?.active && sub.plan_id === id);
        // Buying beside a paid plan is a SECOND charge, and has to say so
        // before the card is asked for.
        const hasPaid = running.some((p) => p.source === "stripe");
        return (
          <>
            <div className="acct-grid acct-grid-2">
              <PlanCard me={me} />
              <CreditsCard me={me} />
            </div>

            <MyPlans me={me} />

            {enabled.length > 0 && (
              <>
                <h2 className="acct-section-title">{t("account.plansHeading")}</h2>
                <div className="acct-plans">
                  {enabled.map((plan) => {
                    const isCurrent = renewing(plan.id);
                    return (
                      <div key={plan.id} className={`acct-card acct-plan-option${isCurrent ? " is-current" : ""}`}>
                        <b className="acct-plan-option-name">{plan.name}</b>
                        <span className="acct-plan-price">
                          {plan.price}
                          <em>{plan.per}</em>
                        </span>
                        {typeof plan.credits === "number" && plan.credits > 0 && (
                          <p className="acct-muted">{t("account.planCredits", { count: plan.credits })}</p>
                        )}
                        {isCurrent ? (
                          <span className="acct-pill ok">{t("account.current")}</span>
                        ) : hasPaid && confirming === plan.id ? (
                          <div className="acct-confirm">
                            <p>{t("account.additionalWarn")}</p>
                            <button
                              className="btn btn-primary"
                              onClick={() => goTo(plan.id, () => startCheckout(plan.id, "monthly"))}
                              disabled={busy !== null}
                            >
                              {busy === plan.id ? t("auth.working") : t("account.additionalYes")}
                            </button>
                            <button className="auth-link" type="button" onClick={() => setConfirming(null)}>
                              {t("account.cancelStep")}
                            </button>
                          </div>
                        ) : (
                          <button
                            className="btn btn-primary"
                            onClick={() =>
                              hasPaid
                                ? setConfirming(plan.id)
                                : goTo(plan.id, () => startCheckout(plan.id, "monthly"))
                            }
                            disabled={busy !== null}
                          >
                            {busy === plan.id
                              ? t("auth.working")
                              : hasPaid
                                ? t("account.chooseAdditional", { plan: plan.name })
                                : t("account.choose", { plan: plan.name })}
                          </button>
                        )}
                      </div>
                    );
                  })}
                </div>
                {error && <p className="acct-error">{error}</p>}
                <p className="acct-fine">
                  {t("account.balanceLead")}{" "}
                  <Link href={marketingPath("pricing", locale)}>{t("account.seeAllPlans")}</Link>
                </p>
              </>
            )}
          </>
        );
      }}
    </AccountShell>
  );
}

/* ================================================================ settings */

export function AccountSettings() {
  const { t } = useI18n();
  return (
    <AccountShell active="settings" title={t("account.navSettings")} lead={t("account.settingsLead")}>
      {(me) => (
        <>
          <div className="acct-card acct-settings">
            <div className="acct-setting">
              <span>
                <b>{t("account.theme")}</b>
                <em>{t("account.themeLead")}</em>
              </span>
              <ThemeToggle />
            </div>
            <div className="acct-setting">
              <span>
                <b>{t("account.language")}</b>
                <em>{t("account.languageLead")}</em>
              </span>
              <LocalePicker />
            </div>
          </div>
          {/* Last, under its own heading, and a long way from anything
              routine - a delete control must never sit one misclick from
              something somebody does every day. */}
          <div className="acct-card acct-danger">
            <h2>{t("account.dangerHeading")}</h2>
            <DeleteAccount me={me} />
          </div>
        </>
      )}
    </AccountShell>
  );
}
