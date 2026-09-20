import { cents, get, monthName, usd, when } from "@/lib/api";
import { translator } from "@/lib/locale";
import type { Reports } from "@/lib/types";

export const dynamic = "force-dynamic";

/**
 * What it cost, who spent it, and what came back.
 *
 * Separate from Overview, which answers "what is happening today". This
 * answers "what has this cost us" - a different question on a different time
 * axis, and the numbers a month end or a year end is actually made of.
 *
 * TWO COUNTS PER ROW, NEVER ONE. `billable` is the requests that cost money;
 * `attempts` is every request including the ones a cache answered for free and
 * the ones the gate refused. Collapsing them into "searches" would hide the
 * two things worth knowing: how much the corpus is saving, and how often
 * somebody is being turned away.
 *
 * THE COST SPLIT SUMS TO THE TOTAL, and it has four parts rather than two
 * because two is how a budget stops adding up. Admin spend is real money that
 * no credit ever paid for; anonymous spend belongs to the free daily search;
 * and `unattributed` is what an erased account leaves behind, since
 * `user_erase` blanks every identifier on purpose.
 */
export default async function ReportsPage() {
  const r = await get<Reports>("/api/admin/reports");
  const { usage, money, credits } = r.totals;
  const t = await translator();

  const cached = usage.attempts - usage.billable;
  const cacheShare = usage.attempts > 0 ? (cached / usage.attempts) * 100 : 0;
  const peakMonth = Math.max(1e-9, ...r.months.map((m) => Number(m.cost_usd)));
  const peakUser = Math.max(1e-9, ...r.users.map((u) => Number(u.cost_usd)));

  return (
    <>
      <h1>{t("reports.title")}</h1>
      <p className="sub">
        {t("reports.lead", {
          since: usage.first_event ? when(usage.first_event) : "—",
        })}
      </p>

      <div className="cards">
        <div className="card">
          <span>{t("reports.totalCost")}</span>
          <b>{usd(usage.cost_usd)}</b>
          <em>{t("reports.totalCostNote", { count: usage.billable.toLocaleString() })}</em>
        </div>
        <div className="card">
          <span>{t("reports.revenue")}</span>
          <b>{cents(money.revenue_cents)}</b>
          <em>
            {t("reports.revenueNote", { live: money.payments })}
            {money.test_payments > 0 &&
              t("reports.revenueTest", { count: money.test_payments })}
          </em>
        </div>
        <div className="card">
          <span>{t("reports.margin")}</span>
          <b className={money.revenue_cents / 100 - usage.cost_usd < 0 ? "neg" : ""}>
            {usd(money.revenue_cents / 100 - usage.cost_usd)}
          </b>
          <em>{t("reports.marginNote")}</em>
        </div>
        <div className="card">
          <span>{t("reports.cached")}</span>
          <b>{cacheShare.toFixed(0)}%</b>
          <em>{t("reports.cachedNote", { count: cached.toLocaleString() })}</em>
        </div>
        <div className="card">
          <span>{t("reports.outstanding")}</span>
          <b>{(credits.granted - credits.spent).toLocaleString()}</b>
          <em>
            {t("reports.outstandingNote", {
              granted: credits.granted.toLocaleString(),
              spent: credits.spent.toLocaleString(),
            })}
          </em>
        </div>
        <div className="card">
          <span>{t("reports.adminSpend")}</span>
          <b>{usd(usage.cost_admin)}</b>
          <em>{t("reports.adminSpendNote")}</em>
        </div>
      </div>

      {/* THE RECONCILIATION, and it is on the screen rather than in a footnote
          because a budget total that quietly excludes part of the bill is the
          one mistake this page exists to avoid. `usage_event` is written
          best-effort and only since accounts shipped; the provider's own
          receipts predate it and cannot be skipped by a failed insert. */}
      {r.totals.reconcile.unattributed_usd > 0.000001 && (
        <p className="notice">
          {t("reports.reconcile", {
            provider: usd(r.totals.reconcile.provider_usd),
            gap: usd(r.totals.reconcile.unattributed_usd),
            attributed: usd(r.totals.reconcile.attributed_usd),
          })}
        </p>
      )}

      <h2>{t("reports.byMonth")}</h2>
      <p className="sub">{t("reports.byMonthLead")}</p>
      <div className="tablewrap">
        <table>
          <thead>
            <tr>
              <th>{t("reports.month")}</th>
              <th className="num">{t("reports.billable")}</th>
              <th className="num">{t("reports.attempts")}</th>
              <th className="num">{t("reports.refused")}</th>
              <th className="num">{t("reports.cost")}</th>
              <th className="num">{t("reports.customers")}</th>
              <th className="num">{t("reports.admin")}</th>
              <th className="num">{t("reports.anonymous")}</th>
              <th className="num">{t("reports.erased")}</th>
              <th className="num">{t("reports.revenueCol")}</th>
              <th className="num">{t("reports.accounts")}</th>
            </tr>
          </thead>
          <tbody>
            {r.months.map((m) => (
              <tr key={m.month}>
                <td>
                  {monthName(m.month)}
                  {/* A share bar, not a chart: one div, no library, and it
                      answers the only question a month column raises at a
                      glance - which month was the expensive one. */}
                  <span
                    className="bar"
                    style={{ width: `${(Number(m.cost_usd) / peakMonth) * 100}%` }}
                    aria-hidden
                  />
                </td>
                <td className="num">{m.billable.toLocaleString()}</td>
                <td className="num">{m.attempts.toLocaleString()}</td>
                <td className={`num${m.refused > 0 ? " neg" : ""}`}>
                  {m.refused.toLocaleString()}
                </td>
                <td className="num"><b>{usd(m.cost_usd)}</b></td>
                <td className="num">{usd(m.cost_customer)}</td>
                <td className="num">{usd(m.cost_admin)}</td>
                <td className="num">{usd(m.cost_anonymous)}</td>
                <td className="num">{usd(m.cost_unattributed)}</td>
                <td className="num">{cents(m.revenue_cents)}</td>
                <td className="num">{m.active_accounts}</td>
              </tr>
            ))}
          </tbody>
          {r.months.length > 0 && (
            <tfoot>
              <tr>
                <td>{t("reports.allMonths", { count: r.months.length })}</td>
                <td className="num">
                  {r.months.reduce((s, m) => s + m.billable, 0).toLocaleString()}
                </td>
                <td className="num">
                  {r.months.reduce((s, m) => s + m.attempts, 0).toLocaleString()}
                </td>
                <td className="num">
                  {r.months.reduce((s, m) => s + m.refused, 0).toLocaleString()}
                </td>
                <td className="num">
                  <b>{usd(r.months.reduce((s, m) => s + Number(m.cost_usd), 0))}</b>
                </td>
                <td className="num">
                  {usd(r.months.reduce((s, m) => s + Number(m.cost_customer), 0))}
                </td>
                <td className="num">
                  {usd(r.months.reduce((s, m) => s + Number(m.cost_admin), 0))}
                </td>
                <td className="num">
                  {usd(r.months.reduce((s, m) => s + Number(m.cost_anonymous), 0))}
                </td>
                <td className="num">
                  {usd(r.months.reduce((s, m) => s + Number(m.cost_unattributed), 0))}
                </td>
                <td className="num">
                  {cents(r.months.reduce((s, m) => s + m.revenue_cents, 0))}
                </td>
                <td className="num">—</td>
              </tr>
            </tfoot>
          )}
        </table>
        {r.months.length === 0 && <p className="empty">{t("reports.noUsage")}</p>}
      </div>

      <h2>{t("reports.byAccount")}</h2>
      <p className="sub">{t("reports.byAccountLead")}</p>
      <div className="tablewrap">
        <table>
          <thead>
            <tr>
              <th>{t("reports.account")}</th>
              <th className="num">{t("reports.billable")}</th>
              <th className="num">{t("reports.attempts")}</th>
              <th className="num">{t("reports.refused")}</th>
              <th className="num">{t("reports.cost")}</th>
              <th className="num">{t("reports.creditsLeft")}</th>
              <th className="num">{t("reports.paid")}</th>
              <th>{t("reports.lastActivity")}</th>
            </tr>
          </thead>
          <tbody>
            {r.users.map((u) => (
              <tr key={u.id}>
                <td>
                  <a href={`/users/${u.id}`}>{u.email}</a>{" "}
                  {u.is_admin && <span className="pill admin">admin</span>}
                  {u.status !== "active" && (
                    <span className={`pill ${u.status}`}>{t(`common.${u.status}`)}</span>
                  )}
                  <span
                    className="bar"
                    style={{ width: `${(Number(u.cost_usd) / peakUser) * 100}%` }}
                    aria-hidden
                  />
                </td>
                <td className="num">{u.billable.toLocaleString()}</td>
                <td className="num">{u.attempts.toLocaleString()}</td>
                <td className={`num${u.refused > 0 ? " neg" : ""}`}>
                  {u.refused.toLocaleString()}
                </td>
                <td className="num"><b>{usd(u.cost_usd)}</b></td>
                {/* A negative balance is shown, not hidden: the debit is
                    unconditional because the money is already spent upstream. */}
                <td className={`num${u.credits_left < 0 ? " neg" : ""}`}>
                  {u.credits_left.toLocaleString()}
                </td>
                <td className="num">{cents(u.paid_cents)}</td>
                <td>{when(u.last_activity)}</td>
              </tr>
            ))}
          </tbody>
        </table>
        {r.users.length === 0 && <p className="empty">{t("reports.noAccounts")}</p>}
      </div>

      <p className="sub" style={{ marginTop: 20 }}>{t("reports.caveats")}</p>
    </>
  );
}
