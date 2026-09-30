import { money, usd, when } from "@/lib/api";
import { makeT, type Locale } from "@/lib/i18n";
import type { UserActivity } from "@/lib/types";

/**
 * What one account actually does, and what it costs.
 *
 * The user page could already show a ledger and the last fifty events. Neither
 * answers the two questions an operator actually has when they open somebody's
 * record: **what do they use this product for**, and **is what they pay
 * covering what they cost us**. A list of fifty rows in reverse order answers
 * the first only by being read end to end, and the second not at all.
 *
 * THREE BREAKDOWNS, because they are three different questions:
 *
 * - **By action** — searches against deep searches against exports. This is
 *   the pricing summary: each row carries its own credits AND its own dollars,
 *   so the margin on each kind of work is on the screen rather than inferred
 *   from one total. It is also the only place an export shows up at all.
 * - **By month** — whether they are speeding up or going quiet. A renewal
 *   decision is about the trend, not the total.
 * - **By outcome** — how often they are turned away and why. An account
 *   hitting `refused_no_credits` every week is a conversation, not a bug.
 *
 * `attempts` and `billable` stay apart throughout, for the reason /reports
 * already states: collapsing them into "searches" hides both what the cache
 * saved and how often somebody was refused.
 *
 * A server component. Everything here is text and two `width:` percentages,
 * so shipping a client bundle for it would buy nothing.
 */
export function Activity({
  data,
  locale,
}: {
  data: UserActivity;
  locale: Locale;
}) {
  const t = makeT(locale);

  /* `makeT` returns the FULL key path when it does not recognise one, which
     would render a new action as "action.export_pdf". An action this build
     has never heard of must still show as itself - a report about activity
     that silently drops the activity it cannot name is worse than one with an
     ugly label in it. */
  const label = (prefix: string, value: string) => {
    const found = t(`${prefix}.${value}`);
    return found === `${prefix}.${value}` ? value : found;
  };

  // The scale for the month bars. Guarded against zero: an account with no
  // spend would otherwise divide by it and render `width: NaN%`, which is a
  // bar of indeterminate length rather than no bar.
  const peak = Math.max(1, ...data.by_month.map((m) => Number(m.spend_usd) || 0));
  const period = data.period;

  return (
    <>
      <h2>{t("activity.heading")}</h2>

      {/* THE QUOTA, first, because it is the only forward-looking number on
          the page. Everything below is what already happened; this is what
          they have left, and it is what somebody writing in is asking about.
          Drawn only with a live plan - `period` is null otherwise, and an
          empty bar would say the allowance is untouched rather than absent. */}
      {period && (
        <div className="quota">
          <div className="quota-line">
            <b>
              {t("activity.quotaUsed", {
                used: period.used,
                granted: period.granted,
              })}
            </b>
            <span className="sub">
              {Math.round(period.fraction * 100)}%
              {period.end_at
                ? ` · ${t("activity.quotaEnds", { date: when(period.end_at) })}`
                : ""}
            </span>
          </div>
          <div
            className="quota-track"
            role="progressbar"
            aria-valuenow={period.used}
            aria-valuemin={0}
            aria-valuemax={period.granted}
            aria-label={t("activity.quotaUsed", {
              used: period.used,
              granted: period.granted,
            })}
          >
            <i
              className={`quota-fill${period.fraction >= 1 ? " full" : ""}`}
              style={{ width: `${period.fraction * 100}%` }}
            />
          </div>
          <p className="sub">
            {t("activity.quotaSince", { date: when(period.start_at) })}
          </p>
        </div>
      )}

      {/* --- what they do, and what it costs ------------------------------ */}
      <h3>{t("activity.byAction")}</h3>
      <p className="sub">{t("activity.byActionLead")}</p>
      {data.by_action.length === 0 ? (
        <p className="sub">{t("activity.none")}</p>
      ) : (
        <div className="tablewrap">
          <table>
            <thead>
              <tr>
                <th>{t("activity.action")}</th>
                <th className="num">{t("activity.attempts")}</th>
                <th className="num">{t("activity.billable")}</th>
                <th className="num">{t("activity.refused")}</th>
                <th className="num">{t("activity.credits")}</th>
                <th className="num">{t("activity.spend")}</th>
                <th>{t("activity.lastAt")}</th>
              </tr>
            </thead>
            <tbody>
              {data.by_action.map((row) => (
                <tr key={row.action}>
                  <td>{label("action", row.action)}</td>
                  <td className="num">{row.attempts}</td>
                  <td className="num">{row.billable}</td>
                  <td className={`num${row.refused ? " neg" : ""}`}>
                    {row.refused || "—"}
                  </td>
                  <td className="num">{row.credits}</td>
                  <td className="num">{money(row.spend_usd)}</td>
                  <td>{when(row.last_at)}</td>
                </tr>
              ))}
            </tbody>
            <tfoot>
              <tr>
                <td>{t("activity.total")}</td>
                <td className="num">{data.attempts}</td>
                <td className="num">{data.billable}</td>
                <td className="num">{data.refused || "—"}</td>
                <td className="num">{data.credits}</td>
                <td className="num">{money(data.spend_usd)}</td>
                <td />
              </tr>
            </tfoot>
          </table>
        </div>
      )}

      {/* --- the trend ---------------------------------------------------- */}
      {data.by_month.length > 0 && (
        <>
          <h3>{t("activity.byMonth")}</h3>
          <div className="tablewrap">
            <table>
              <thead>
                <tr>
                  <th>{t("activity.month")}</th>
                  <th className="num">{t("activity.attempts")}</th>
                  <th className="num">{t("activity.refused")}</th>
                  <th className="num">{t("activity.credits")}</th>
                  <th className="num">{t("activity.spend")}</th>
                </tr>
              </thead>
              <tbody>
                {data.by_month.map((m) => (
                  <tr key={m.month}>
                    <td>
                      {when(m.month)}
                      <span
                        className="bar"
                        style={{
                          width: `${((Number(m.spend_usd) || 0) / peak) * 100}%`,
                        }}
                      />
                    </td>
                    <td className="num">{m.attempts}</td>
                    <td className={`num${m.refused ? " neg" : ""}`}>
                      {m.refused || "—"}
                    </td>
                    <td className="num">{m.credits}</td>
                    <td className="num">{money(m.spend_usd)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </>
      )}

      {/* --- who got turned away, and why --------------------------------- */}
      {data.by_outcome.length > 0 && (
        <>
          <h3>{t("activity.byOutcome")}</h3>
          <p className="chips">
            {data.by_outcome.map((o) => (
              <span
                key={o.outcome}
                className={`pill ${o.outcome === "allowed" ? "active" : "suspended"}`}
              >
                {label("outcome", o.outcome)} · {o.attempts}
              </span>
            ))}
          </p>
        </>
      )}

      <p className="sub">
        {t("activity.window", { months: data.window_months })}
        {data.first_at ? ` · ${t("activity.firstAt", { date: when(data.first_at) })}` : ""}
        {" · "}
        {t("activity.crawls", {
          count: data.crawls,
          spend: usd(data.crawl_spend),
        })}
      </p>
    </>
  );
}
