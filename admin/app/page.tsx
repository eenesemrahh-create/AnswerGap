import { get, money } from "@/lib/api";
import type { Overview } from "@/lib/types";

export const dynamic = "force-dynamic";

/** One screen, one call, one SQL statement — see api/admin.py. */
export default async function OverviewPage() {
  const data = await get<Overview>("/api/admin/overview");

  return (
    <>
      <h1>Overview</h1>
      <p className="sub">
        Free searches for signed-out visitors: {data.settings.anonymous_daily_searches} per
        day · new accounts start with {data.settings.signup_credits} credits.
      </p>

      <h2>Users</h2>
      <div className="cards">
        <div className="card"><span>Total</span><b>{data.users.total}</b></div>
        <div className="card"><span>Active</span><b>{data.users.active}</b></div>
        <div className="card"><span>Suspended</span><b>{data.users.suspended}</b></div>
        <div className="card"><span>New this week</span><b>{data.users.new_7d}</b></div>
      </div>

      <h2>Credits</h2>
      <div className="cards">
        <div className="card"><span>Granted</span><b>{data.credits.granted}</b></div>
        <div className="card"><span>Spent</span><b>{data.credits.spent}</b></div>
        <div className="card">
          <span>Outstanding</span><b>{data.credits.outstanding}</b>
          <em>what people still hold</em>
        </div>
      </div>

      <h2>Today</h2>
      <div className="cards">
        <div className="card"><span>Allowed</span><b>{data.usage.allowed_today}</b></div>
        <div className="card">
          <span>Anonymous</span><b>{data.usage.anonymous_today}</b>
          <em>signed-out visitors</em>
        </div>
        <div className="card">
          <span>Refused</span><b>{data.usage.refused_today}</b>
          <em>limit, credits or suspension</em>
        </div>
      </div>

      <h2>Spend</h2>
      <div className="cards">
        <div className="card">
          <span>Live queue</span><b>{money(data.spend.live_usd)}</b>
          <em>a person was waiting</em>
        </div>
        <div className="card">
          <span>Standard queue</span><b>{money(data.spend.standard_usd)}</b>
          <em>batch scoring, ~3.3x cheaper</em>
        </div>
        <div className="card">
          <span>Attributed</span><b>{money(data.spend.attributed_usd)}</b>
          <em>traced to a person; excludes anything before accounts existed</em>
        </div>
      </div>
      <p className="sub" style={{ marginTop: 16 }}>
        Every figure is reported by DataForSEO, never estimated. A panel filled
        with plausible guesses would be worse than no panel — it looks like
        evidence.
      </p>
    </>
  );
}
