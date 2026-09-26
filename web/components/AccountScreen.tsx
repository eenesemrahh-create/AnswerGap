"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import {
  ApiError,
  fetchCredits,
  fetchMe,
  fetchMeta,
  fetchPricing,
  openBillingPortal,
  resendVerification,
  startCheckout,
} from "@/lib/api";
import { token } from "@/lib/auth";
import { marketingPath } from "@/lib/marketing";
import type { CreditEntry, Me, Meta, Plan } from "@/lib/types";
import { useDateFormat, useDayFormat, useI18n } from "@/i18n";
import { AccountMenu } from "./AccountMenu";
import { DeleteAccount } from "./DeleteAccount";
import { LocalePicker } from "./LocalePicker";
import { ThemeToggle } from "./ThemeToggle";

/**
 * The account page. Replaces a dialog.
 *
 * THE DIALOG WAS THE RIGHT SHAPE FOR WHAT IT HELD - an address, a balance and
 * a delete button - and the wrong shape for what this account now is. A plan
 * has a status, a renewal date, a history and alternatives to move to, and
 * none of that fits in a modal that has to be dismissed before the reader can
 * look at anything else.
 *
 * FOUR SECTIONS, IN THE ORDER SOMEBODY ARRIVES LOOKING FOR THEM: who am I,
 * what am I on, what have I got left and where did it go, and what else could
 * I be on. Deleting the account is last, under its own heading, well below
 * anything routine - the dialog's whole reason for existing was that a delete
 * control must not sit one misclick from "Sign out", and that argument does
 * not stop applying because the surface got bigger.
 *
 * EVERYTHING IS FETCHED, NOTHING IS ASSUMED. The balance, the plan and the
 * ledger are three reads, and a failure in one does not blank the others: the
 * ledger is the account's own money and the least important thing on the page
 * to get instantly, so a slow or failing `/api/me/credits` renders as an empty
 * history rather than as an error page over the plan card.
 */
export function AccountScreen() {
  const { t, locale } = useI18n();
  const formatDate = useDateFormat();
  /* Dates that are dates. A renewal and a joining date have no
     meaningful hour, and Stripe's period end is midnight UTC -
     rendered with a time it read as "03:00 AM" to a reader in
     Istanbul. The ledger keeps the full timestamp: there, the hour
     is how you tell two searches apart. */
  const formatDay = useDayFormat();

  const [meta, setMeta] = useState<Meta | null>(null);
  const [me, setMe] = useState<Me | null>(null);
  const [entries, setEntries] = useState<CreditEntry[]>([]);
  const [plans, setPlans] = useState<Plan[]>([]);
  // `null` until the first `/api/me` settles either way. Three states, not
  // two: "still loading" must not render as "signed out", or every reader
  // with a valid token sees a sign-in prompt flash before their own page.
  const [ready, setReady] = useState(false);

  const [busy, setBusy] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);
  const [resent, setResent] = useState(false);

  const load = useCallback(() => {
    if (!token()) {
      setMe(null);
      setReady(true);
      return;
    }
    fetchMe()
      .then(setMe)
      .catch(() => setMe(null))
      .finally(() => setReady(true));
    // Allowed to fail on its own. See the note above.
    fetchCredits()
      .then((r) => setEntries(r.entries))
      .catch(() => setEntries([]));
  }, []);

  useEffect(() => {
    fetchMeta().then(setMeta).catch(() => {});
    fetchPricing()
      .then((r) => setPlans(r.plans.filter((p) => p.enabled)))
      .catch(() => setPlans([]));
    load();
  }, [load]);

  /* Where Stripe sends people back to. `done` does NOT mean the plan is
     live: the subscription arrives on a webhook, which can land after the
     browser does, so the message says it is being set up rather than
     claiming a plan this page may not be able to show yet. */
  useEffect(() => {
    if (typeof window === "undefined") return;
    const params = new URLSearchParams(window.location.search);
    const billing = params.get("billing");
    if (!billing) return;
    if (billing === "done") setNotice(t("account.billingDone"));
    if (billing === "cancelled") setNotice(t("account.billingCancelled"));
    params.delete("billing");
    const query = params.toString();
    window.history.replaceState(
      null,
      "",
      window.location.pathname + (query ? `?${query}` : "")
    );
    // `t` is stable per locale; re-running would re-read a parameter this
    // effect has already scrubbed.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  /** Send the browser to Stripe, keeping the button busy until it leaves.
   *  Minting a checkout link takes a second, and a button that looks idle in
   *  that second gets pressed twice. */
  const goTo = (key: string, call: () => Promise<{ url: string }>) => {
    setBusy(key);
    setError(null);
    call()
      .then(({ url }) => {
        window.location.href = url;
      })
      .catch((err) => {
        setError(
          err instanceof ApiError ? t(`error.${err.kind}`, err.values) : t("auth.failed")
        );
        setBusy(null);
      });
  };

  const resend = () => {
    if (!me?.email) return;
    setBusy("verify");
    resendVerification(me.email, locale)
      .then(() => setResent(true))
      .catch(() => setError(t("auth.failed")))
      .finally(() => setBusy(null));
  };

  const chrome = (
    <nav className="mkt-nav">
      <div className="mkt-nav-inner">
        <Link href="/" className="mkt-brand">
          <span className="mkt-brand-tile" aria-hidden>
            A
          </span>
          AnswerGap
        </Link>
        <div className="mkt-nav-links">
          <Link href={marketingPath("pricing", locale)} className="mkt-nav-link">
            {t("market.nav.pricing")}
          </Link>
        </div>
        <div className="mkt-nav-tools">
          {meta && <AccountMenu meta={meta} onSessionChange={load} />}
          <ThemeToggle />
          <LocalePicker />
        </div>
      </div>
    </nav>
  );

  if (!ready) {
    return (
      <div className="mkt-page">
        {chrome}
        <main className="account-page">
          <p className="account-muted">{t("account.loading")}</p>
        </main>
      </div>
    );
  }

  if (!me) {
    return (
      <div className="mkt-page">
        {chrome}
        <main className="account-page">
          <h1>{t("account.signedOutTitle")}</h1>
          <p className="account-muted">{t("account.signedOutLead")}</p>
          {/* A LINK, not a button that opens a dialog. The dialog is mounted
              in the nav strip above and there is no session to open it from
              here; `?auth=signin` is the same route the marketing pages use,
              and the landing knows how to answer it. */}
          <Link className="btn btn-primary" href="/?auth=signin">
            {t("account.signedOutAction")}
          </Link>
        </main>
      </div>
    );
  }

  const sub = me.subscription ?? null;
  const planOf = (id: string | null | undefined) =>
    plans.find((p) => p.id === id) ?? null;
  const currentPlan = planOf(sub?.plan_id);

  return (
    <div className="mkt-page">
      {chrome}
      <main className="account-page">
        <h1>{t("account.title")}</h1>

        {notice && (
          <p className="account-notice" role="status">
            {notice}
          </p>
        )}
        {error && (
          <p className="account-error" role="alert">
            {error}
          </p>
        )}

        {/* --- who ---------------------------------------------------- */}
        <section className="account-block">
          <h2>{t("account.profileHeading")}</h2>
          <dl className="account-facts">
            <dt>{t("account.email")}</dt>
            <dd>
              {me.email}{" "}
              {me.email_verified === false ? (
                <>
                  <span className="account-tag warn">{t("account.unverified")}</span>{" "}
                  {resent ? (
                    <span className="account-muted">{t("account.verifySent")}</span>
                  ) : (
                    <button
                      className="account-inline-action"
                      onClick={resend}
                      disabled={busy === "verify"}
                    >
                      {busy === "verify" ? t("auth.working") : t("account.verifyAction")}
                    </button>
                  )}
                </>
              ) : (
                <span className="account-tag">{t("account.verified")}</span>
              )}
            </dd>

            <dt>{t("account.name")}</dt>
            <dd>{me.name || <span className="account-muted">{t("account.unnamed")}</span>}</dd>

            {me.created_at && (
              <>
                <dt>{t("account.joined")}</dt>
                <dd>{formatDay(me.created_at)}</dd>
              </>
            )}

            <dt>{t("account.doors")}</dt>
            <dd>
              {/* Both can be true once an address is linked to Google as well
                  as a password. Listing what IS there rather than a single
                  label, because "Google" printed over an account that also
                  has a password is a settings page lying about the account
                  it describes. */}
              {[
                me.has_password !== false ? t("account.doorPassword") : null,
                me.has_google ? t("account.doorGoogle") : null,
              ]
                .filter(Boolean)
                .join(" · ") || "—"}
            </dd>
          </dl>
        </section>

        {/* --- plan --------------------------------------------------- */}
        <section className="account-block">
          <h2>{t("account.planHeading")}</h2>
          {!sub || !sub.active ? (
            <div className="account-plan-card">
              {/* A PLAN THAT ENDED IS STILL NAMED. "No plan" over the sentence
                  "This plan has ended" reads as a contradiction, and the name
                  is the useful half - somebody writing in about a lapsed plan
                  is writing about a particular one. The card is untinted and
                  every option below offers "Choose", so nothing here suggests
                  the plan is still theirs. */}
              <b>
                {sub && !sub.active
                  ? (currentPlan?.name ?? sub.plan_id ?? t("account.noPlan"))
                  : t("account.noPlan")}
              </b>
              <p className="account-muted">
                {sub && !sub.active ? t("account.lapsed") : t("account.noPlanLead")}
              </p>
            </div>
          ) : (
            <div className="account-plan-card is-live">
              <b>{currentPlan?.name ?? sub.plan_id ?? t("account.noPlan")}</b>
              <p>
                {t("account.planCredits", { count: sub.credits_per_period })}
              </p>
              <p className="account-muted">
                {/* WHERE IT CAME FROM comes first. A plan somebody was given
                    is not one they bought, and implying otherwise is how a
                    support conversation opens with an argument about a charge
                    that never happened. */}
                {sub.source === "admin" ? t("account.given") : t("account.bought")}
                {sub.current_period_end
                  ? ` · ${
                      sub.cancel_at_period_end
                        ? t("account.endsOn", { date: formatDay(sub.current_period_end) })
                        : t("account.renews", { date: formatDay(sub.current_period_end) })
                    }`
                  : ""}
              </p>
              {sub.status === "past_due" && (
                <p className="account-warn">{t("account.pastDue")}</p>
              )}
              {/* ONLY FOR A PLAN WITH A CARD BEHIND IT. The portal answers
                  `noCustomer` for an account that never bought anything, so
                  drawing this button for an assigned plan would be a dead end
                  wearing the costume of a feature. */}
              {sub.source === "stripe" && (
                <>
                  <button
                    className="btn"
                    onClick={() => goTo("portal", openBillingPortal)}
                    disabled={busy === "portal"}
                  >
                    {busy === "portal" ? t("auth.working") : t("account.manage")}
                  </button>
                  <p className="account-fine">{t("account.manageLead")}</p>
                </>
              )}
            </div>
          )}
        </section>

        {/* --- credits ------------------------------------------------ */}
        <section className="account-block">
          <h2>{t("account.creditsHeading")}</h2>
          {/* Zero reads as "no credits left" rather than as "0 credits", and
              a negative balance is shown as it stands - a debit is
              unconditional because the money was already spent upstream, and
              hiding an overspend would make this number disagree with the
              ledger printed directly beneath it. */}
          <p className={`account-balance${me.credits <= 0 ? " empty" : ""}`}>
            {me.credits <= 0
              ? t("credits.empty")
              : t("credits.balance", { count: me.credits })}
          </p>
          <p className="account-muted">{t("account.balanceLead")}</p>

          <h3>{t("account.historyHeading")}</h3>
          {entries.length === 0 ? (
            <p className="account-muted">{t("account.noHistory")}</p>
          ) : (
            <div className="account-tablewrap">
              <table className="account-table">
                <thead>
                  <tr>
                    <th>{t("account.historyWhen")}</th>
                    <th className="num">{t("account.historyChange")}</th>
                    <th>{t("account.historyWhy")}</th>
                  </tr>
                </thead>
                <tbody>
                  {entries.map((entry, i) => (
                    <tr key={i}>
                      <td>{formatDate(entry.created_at)}</td>
                      <td className={`num${entry.delta < 0 ? " neg" : ""}`}>
                        {entry.delta > 0 ? `+${entry.delta}` : entry.delta}
                      </td>
                      <td>
                        {reasonLabel(entry.reason, t)}
                        {/* The admin's own note. Somebody looking at their
                            balance deserves the same explanation the operator
                            wrote, rather than a bare "Added by us". */}
                        {entry.note ? (
                          <span className="account-muted"> · {entry.note}</span>
                        ) : null}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </section>

        {/* --- plans -------------------------------------------------- */}
        {plans.length > 0 && (
          <section className="account-block">
            <h2>{t("account.plansHeading")}</h2>
            <p className="account-muted">{t("account.plansLead")}</p>
            <div className="account-plans">
              {plans.map((plan) => {
                const isCurrent = sub?.active && sub.plan_id === plan.id;
                return (
                  <div
                    key={plan.id}
                    className={`account-plan-option${isCurrent ? " is-current" : ""}`}
                  >
                    <b>{plan.name}</b>
                    <span className="account-plan-price">
                      {plan.price}
                      <em>{plan.per}</em>
                    </span>
                    {typeof plan.credits === "number" && plan.credits > 0 && (
                      <p className="account-muted">
                        {t("account.planCredits", { count: plan.credits })}
                      </p>
                    )}
                    {isCurrent ? (
                      <span className="account-tag">{t("account.current")}</span>
                    ) : (
                      <button
                        className="btn btn-primary"
                        onClick={() => goTo(plan.id, () => startCheckout(plan.id, "monthly"))}
                        disabled={busy !== null}
                      >
                        {busy === plan.id
                          ? t("auth.working")
                          : t("account.choose", { plan: plan.name })}
                      </button>
                    )}
                  </div>
                );
              })}
            </div>
            <p className="account-fine">
              <Link href={marketingPath("pricing", locale)}>
                {t("account.seeAllPlans")}
              </Link>
            </p>
          </section>
        )}

        {/* --- the way out -------------------------------------------- */}
        {/* LAST, UNDER ITS OWN HEADING, and a long way from anything routine.
            The dialog this page replaced existed precisely because a delete
            control must not sit beside "Sign out"; a bigger surface does not
            retire that argument, it just gives it more room. */}
        <section className="account-block account-danger-block">
          <h2>{t("account.dangerHeading")}</h2>
          <DeleteAccount me={me} />
        </section>
      </main>
    </div>
  );
}

/**
 * One ledger reason as a sentence.
 *
 * An unrecognised reason renders AS ITSELF rather than as a blank. A visible
 * `something_else` in a screenshot is a bug report; an empty cell in a table
 * about somebody's money is a reason not to trust the rest of the column.
 */
function reasonLabel(reason: string, t: (key: string) => string): string {
  switch (reason) {
    case "signup":
      return t("account.reasonSignup");
    case "search":
      return t("account.reasonSearch");
    case "subscription":
      return t("account.reasonSubscription");
    case "admin_grant":
      return t("account.reasonAdminGrant");
    case "admin_revoke":
      return t("account.reasonAdminRevoke");
    default:
      return reason;
  }
}
