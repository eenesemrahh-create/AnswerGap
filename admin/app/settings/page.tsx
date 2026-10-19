import Link from "next/link";
import { get } from "@/lib/api";
import { translator } from "@/lib/locale";
import type { Settings } from "@/lib/types";
import { saveSettings } from "./actions";
import { AnonUsagePanel } from "./AnonUsage";

export const dynamic = "force-dynamic";

export default async function SettingsPage() {
  const s = await get<Settings>("/api/admin/settings");
  const t = await translator();

  return (
    <>
      <h1>{t("settings.title")}</h1>
      <p className="sub">{t("settings.lead")}</p>

      <form className="row" action={saveSettings}>
        <label>
          {t("settings.signupLabel")}
          <br />
          <input
            name="signup_credits"
            type="number"
            min={0}
            max={100000}
            defaultValue={s.signup_credits}
          />
        </label>
        <button className="act" type="submit">{t("common.save")}</button>
      </form>

      <h2>{t("settings.anonHeading")}</h2>
      {!s.turnstile_configured && <p className="notice">{t("settings.anonNoTurnstile")}</p>}
      <form className="row" action={saveSettings}>
        <label>
          {t("settings.anonPerVisitor")}
          <br />
          <input
            name="anon_per_visitor"
            type="number"
            min={0}
            max={20}
            defaultValue={s.anonymous_searches_per_visitor ?? 0}
          />
        </label>
        <label>
          {t("settings.anonDailyTotal")}
          <br />
          <input
            name="anon_daily_total"
            type="number"
            min={0}
            max={5000}
            defaultValue={s.anonymous_daily_total ?? 50}
          />
        </label>
        <button className="act" type="submit">{t("common.save")}</button>
      </form>
      <p className="sub">
        {t("settings.anonCost", { usd: ((s.anonymous_daily_total ?? 50) * 0.0026).toFixed(2) })}
      </p>
      <AnonUsagePanel />

      <h2>{t("settings.explainHeading")}</h2>
      <p className="sub">{t("settings.explainSignedOut")}</p>
      <p className="sub">
        <b>{t("settings.signupLabel")}</b> {t("settings.explainSignup")}
      </p>
      <p className="sub">{t("settings.noCheckout")}</p>

      <h2>{t("settings.landingHeading")}</h2>
      <p className="sub">{t("settings.landingLead")}</p>
      <p>
        <Link href="/settings/pricing" className="linkish">
          {t("settings.editPricing")}
        </Link>
      </p>
      <p className="sub">{t("settings.planFeaturesLead")}</p>
      <p>
        <Link href="/settings/plans" className="linkish">
          {t("settings.editPlanFeatures")}
        </Link>
      </p>
    </>
  );
}
