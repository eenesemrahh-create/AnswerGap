import { get, money } from "@/lib/api";
import { translator } from "@/lib/locale";
import type { Overview } from "@/lib/types";

export const dynamic = "force-dynamic";

/** One screen, one call, one SQL statement — see api/admin.py. */
export default async function OverviewPage() {
  const data = await get<Overview>("/api/admin/overview");
  const t = await translator();

  return (
    <>
      <h1>{t("overview.title")}</h1>
      <p className="sub">
        {t("overview.lead", {
          anon: data.settings.anonymous_daily_searches,
          signup: data.settings.signup_credits,
        })}
      </p>

      <h2>{t("overview.users")}</h2>
      <div className="cards">
        <div className="card"><span>{t("overview.total")}</span><b>{data.users.total}</b></div>
        <div className="card"><span>{t("common.active")}</span><b>{data.users.active}</b></div>
        <div className="card"><span>{t("common.suspended")}</span><b>{data.users.suspended}</b></div>
        <div className="card"><span>{t("overview.newThisWeek")}</span><b>{data.users.new_7d}</b></div>
      </div>

      <h2>{t("overview.creditsHeading")}</h2>
      <div className="cards">
        <div className="card"><span>{t("overview.granted")}</span><b>{data.credits.granted}</b></div>
        <div className="card"><span>{t("overview.spent")}</span><b>{data.credits.spent}</b></div>
        <div className="card">
          <span>{t("overview.outstanding")}</span><b>{data.credits.outstanding}</b>
          <em>{t("overview.outstandingNote")}</em>
        </div>
      </div>

      <h2>{t("overview.today")}</h2>
      <div className="cards">
        <div className="card"><span>{t("overview.allowed")}</span><b>{data.usage.allowed_today}</b></div>
        <div className="card">
          <span>{t("overview.anonymous")}</span><b>{data.usage.anonymous_today}</b>
          <em>{t("overview.anonymousNote")}</em>
        </div>
        <div className="card">
          <span>{t("overview.refused")}</span><b>{data.usage.refused_today}</b>
          <em>{t("overview.refusedNote")}</em>
        </div>
      </div>

      <h2>{t("overview.spendHeading")}</h2>
      <div className="cards">
        <div className="card">
          <span>{t("overview.liveQueue")}</span><b>{money(data.spend.live_usd)}</b>
          <em>{t("overview.liveQueueNote")}</em>
        </div>
        <div className="card">
          <span>{t("overview.standardQueue")}</span><b>{money(data.spend.standard_usd)}</b>
          <em>{t("overview.standardQueueNote")}</em>
        </div>
        <div className="card">
          <span>{t("overview.attributed")}</span><b>{money(data.spend.attributed_usd)}</b>
          <em>{t("overview.attributedNote")}</em>
        </div>
      </div>
      <p className="sub" style={{ marginTop: 16 }}>{t("overview.footer")}</p>
    </>
  );
}
