import Link from "next/link";
import { get } from "@/lib/api";
import { translator } from "@/lib/locale";
import type { Settings } from "@/lib/types";
import { saveSettings } from "./actions";

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
          {t("settings.anonLabel")}
          <br />
          <input
            name="anonymous_daily_searches"
            type="number"
            min={0}
            max={100}
            defaultValue={s.anonymous_daily_searches}
          />
        </label>
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

      <h2>{t("settings.explainHeading")}</h2>
      <p className="sub">
        <b>{t("settings.anonLabel")}</b> {t("settings.explainAnon")}
      </p>
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
    </>
  );
}
