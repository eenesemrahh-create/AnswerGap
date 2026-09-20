import { get, money, when } from "@/lib/api";
import type { UserDetail } from "@/lib/types";
import { grantCredits, revokeTokens, setStatus } from "../actions";
import { EraseAccount } from "./EraseAccount";

export const dynamic = "force-dynamic";

export default async function UserPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const userId = Number(id);
  const u = await get<UserDetail>(`/api/admin/user/${userId}`);

  const grant = grantCredits.bind(null, userId);
  const status = setStatus.bind(null, userId);
  const revoke = revokeTokens.bind(null, userId);

  return (
    <>
      <h1>{u.email}</h1>
      <p className="sub">
        <span className={`pill ${u.status}`}>{u.status}</span>{" "}
        {u.is_admin && <span className="pill admin">admin</span>} · joined{" "}
        {when(u.created_at)} · last seen {when(u.last_seen_at)}
      </p>

      <div className="cards">
        <div className="card">
          <span>Credits</span>
          <b className={u.balance < 0 ? "neg" : ""}>{u.balance}</b>
          <em>the sum of the ledger, never a stored total</em>
        </div>
        <div className="card">
          <span>Searches</span><b>{u.usage.length}</b>
          <em>most recent 50</em>
        </div>
        <div className="card">
          <span>Spend</span>
          {/* The SUM OF THE 50 ROWS BELOW, and it has to say so. This card
              used to read "reported by DataForSEO", which is true of each
              number in it and false of the total: `admin_user_detail` caps
              the usage list at 50, so for a busy account this figure was a
              fraction of the real spend wearing the label of the whole.
              The unlimited lifetime figure is one page over, on Reports. */}
          <b>{money(u.usage.reduce((sum, r) => sum + Number(r.spend_usd || 0), 0))}</b>
          <em>
            over those 50 · <a href="/reports">lifetime total</a>
          </em>
        </div>
      </div>

      {u.is_admin && (
        <p className="notice">
          This address is in ADMIN_EMAILS. Credits and suspension do not apply to
          admins — they spend without being billed, and their spend is still
          recorded. To remove the role, edit the variable in Railway and redeploy.
        </p>
      )}

      <h2>Credits</h2>
      <form className="row" action={grant}>
        <input name="delta" type="number" placeholder="+25 or -10" required />
        <input name="note" placeholder="Reason (optional)" />
        <button className="act" type="submit">Apply</button>
      </form>
      <div className="tablewrap">
        <table>
          <thead>
            <tr><th>When</th><th className="num">Delta</th><th>Reason</th><th>Ref</th><th>Note</th></tr>
          </thead>
          <tbody>
            {u.ledger.map((r, i) => (
              <tr key={i}>
                <td>{when(r.created_at)}</td>
                <td className={`num${r.delta < 0 ? " neg" : ""}`}>
                  {r.delta > 0 ? `+${r.delta}` : r.delta}
                </td>
                <td>{r.reason}</td>
                <td>{r.ref ?? "—"}</td>
                <td>{r.note ?? "—"}</td>
              </tr>
            ))}
          </tbody>
        </table>
        {u.ledger.length === 0 && <p className="empty">No credit history.</p>}
      </div>

      <h2>Account</h2>
      <form className="row" action={status}>
        <input
          type="hidden"
          name="status"
          value={u.status === "active" ? "suspended" : "active"}
        />
        <button className={`act${u.status === "active" ? " warn" : ""}`} type="submit">
          {u.status === "active" ? "Suspend" : "Reactivate"}
        </button>
        <span className="sub" style={{ margin: 0 }}>
          Takes effect on the next request — status is re-read every time, so no
          sign-out is needed. A suspended user stays signed in and simply cannot
          spend.
        </span>
      </form>
      <form className="row" action={revoke}>
        <button className="act" type="submit">Sign out everywhere</button>
        <span className="sub" style={{ margin: 0 }}>
          Bumps the token epoch (now {u.token_epoch}), which invalidates every
          token already issued. The only revocation there is — there is no
          session table.
        </span>
      </form>

      {/* Its own heading, below the reversible controls. Suspending is
          something you undo; this is not, and putting them under one heading
          is how somebody eventually reaches for the wrong one. */}
      <h2>Erase</h2>
      <EraseAccount
        userId={userId}
        email={u.email}
        erased={u.erased_at !== null}
      />

      <h2>Activity</h2>
      <div className="tablewrap">
        <table>
          <thead>
            <tr>
              <th>When</th><th>Action</th><th>Outcome</th>
              <th className="num">Credits</th><th className="num">Cost</th><th>Tree</th>
            </tr>
          </thead>
          <tbody>
            {u.usage.map((r, i) => (
              <tr key={i}>
                <td>{when(r.created_at)}</td>
                <td>{r.action}</td>
                <td>{r.outcome === "allowed" ? "allowed" : <span className="neg">{r.outcome}</span>}</td>
                <td className="num">{r.credits}</td>
                <td className="num">{money(Number(r.spend_usd || 0))}</td>
                <td>{r.tree_slug ?? "—"}</td>
              </tr>
            ))}
          </tbody>
        </table>
        {u.usage.length === 0 && <p className="empty">No activity.</p>}
      </div>

      <h2>Searches</h2>
      <div className="tablewrap">
        <table>
          <thead>
            <tr><th>When</th><th>Seed</th><th>Market</th><th className="num">Spend</th></tr>
          </thead>
          <tbody>
            {u.crawls.map((c) => (
              <tr key={c.id}>
                <td>{when(c.created_at)}</td>
                <td>{c.seed}</td>
                <td>{c.language_code} / {c.location_code}</td>
                <td className="num">{money(Number(c.spend || 0))}</td>
              </tr>
            ))}
          </tbody>
        </table>
        {u.crawls.length === 0 && <p className="empty">No searches owned by this account.</p>}
      </div>
    </>
  );
}
