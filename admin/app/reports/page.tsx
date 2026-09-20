import { cents, get, monthName, usd, when } from "@/lib/api";
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

  const cached = usage.attempts - usage.billable;
  const cacheShare = usage.attempts > 0 ? (cached / usage.attempts) * 100 : 0;
  const peakMonth = Math.max(1e-9, ...r.months.map((m) => Number(m.cost_usd)));
  const peakUser = Math.max(1e-9, ...r.users.map((u) => Number(u.cost_usd)));

  return (
    <>
      <h1>Reports</h1>
      <p className="sub">
        Spend and usage since{" "}
        {usage.first_event ? when(usage.first_event) : "the beginning"}. Costs
        are what we paid the search provider, read from its own response rather
        than estimated. Revenue counts live payments only — a test payment in a
        revenue figure is how the figure becomes a lie.
      </p>

      <div className="cards">
        <div className="card">
          <span>Total cost</span>
          <b>{usd(usage.cost_usd)}</b>
          <em>{usage.billable.toLocaleString()} billable requests</em>
        </div>
        <div className="card">
          <span>Revenue</span>
          <b>{cents(money.revenue_cents)}</b>
          <em>
            {money.payments} live
            {money.test_payments > 0 && `, ${money.test_payments} test (excluded)`}
          </em>
        </div>
        <div className="card">
          <span>Margin</span>
          <b className={money.revenue_cents / 100 - usage.cost_usd < 0 ? "neg" : ""}>
            {usd(money.revenue_cents / 100 - usage.cost_usd)}
          </b>
          <em>revenue less what the searches cost</em>
        </div>
        <div className="card">
          <span>Served from cache</span>
          <b>{cacheShare.toFixed(0)}%</b>
          <em>{cached.toLocaleString()} requests that cost nothing</em>
        </div>
        <div className="card">
          <span>Credits outstanding</span>
          <b>{(credits.granted - credits.spent).toLocaleString()}</b>
          <em>
            {credits.granted.toLocaleString()} granted · {credits.spent.toLocaleString()} spent
          </em>
        </div>
        <div className="card">
          <span>Of that, admin spend</span>
          <b>{usd(usage.cost_admin)}</b>
          <em>real money, billed to nobody</em>
        </div>
      </div>

      {/* THE RECONCILIATION, and it is on the screen rather than in a footnote
          because a budget total that quietly excludes part of the bill is the
          one mistake this page exists to avoid. `usage_event` is written
          best-effort and only since accounts shipped; the provider's own
          receipts predate it and cannot be skipped by a failed insert. */}
      {r.totals.reconcile.unattributed_usd > 0.000001 && (
        <p className="notice">
          The provider&apos;s own receipts total{" "}
          <b>{usd(r.totals.reconcile.provider_usd)}</b>, which is{" "}
          <b>{usd(r.totals.reconcile.unattributed_usd)}</b> more than the{" "}
          {usd(r.totals.reconcile.attributed_usd)} traced to a person above.
          That gap is work done before accounts existed, plus any receipt whose
          write failed — attribution is best-effort on purpose, because losing
          a receipt is bad but losing the customer&apos;s result on top of it is
          worse. Treat the larger figure as the bill and the tables below as
          where the traceable part of it went.
        </p>
      )}

      <h2>By month</h2>
      <p className="sub">
        The four cost columns are the same dollars split by who spent them, so
        they add up to Cost.
      </p>
      <div className="tablewrap">
        <table>
          <thead>
            <tr>
              <th>Month</th>
              <th className="num">Billable</th>
              <th className="num">Attempts</th>
              <th className="num">Refused</th>
              <th className="num">Cost</th>
              <th className="num">Customers</th>
              <th className="num">Admin</th>
              <th className="num">Anonymous</th>
              <th className="num">Erased</th>
              <th className="num">Revenue</th>
              <th className="num">Accounts</th>
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
                <td>All {r.months.length} months</td>
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
        {r.months.length === 0 && <p className="empty">No usage recorded yet.</p>}
      </div>

      <h2>By account</h2>
      <p className="sub">
        Every account, ordered by what it cost us. Counts are over that
        account&apos;s whole history — nothing here is truncated to a recent
        window, only the list length is.
      </p>
      <div className="tablewrap">
        <table>
          <thead>
            <tr>
              <th>Account</th>
              <th className="num">Billable</th>
              <th className="num">Attempts</th>
              <th className="num">Refused</th>
              <th className="num">Cost</th>
              <th className="num">Credits left</th>
              <th className="num">Paid</th>
              <th>Last activity</th>
            </tr>
          </thead>
          <tbody>
            {r.users.map((u) => (
              <tr key={u.id}>
                <td>
                  <a href={`/users/${u.id}`}>{u.email}</a>{" "}
                  {u.is_admin && <span className="pill admin">admin</span>}
                  {u.status !== "active" && (
                    <span className={`pill ${u.status}`}>{u.status}</span>
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
        {r.users.length === 0 && <p className="empty">No accounts yet.</p>}
      </div>

      <p className="sub" style={{ marginTop: 20 }}>
        Two things this screen cannot tell you, so that nobody reads more into
        it than is there. Payments are matched to an account by email address
        only — <code>payment_event</code> has no account id — so a checkout
        completed under a different address shows as unpaid. And an admin is an
        entry in <code>ADMIN_EMAILS</code> rather than a row, so the admin split
        is computed from that list at query time, not stored on the event.
      </p>
    </>
  );
}
