import Link from "next/link";
import { get } from "@/lib/api";
import { translator } from "@/lib/locale";
import type { PlanFeaturesState } from "@/lib/types";
import { savePlanFeatures } from "./actions";

export const dynamic = "force-dynamic";

/**
 * What each plan GRANTS - the contract billing acts on, kept apart from the
 * pricing cards, which are copy.
 *
 * One row per plan, one column per feature. Credits are the first; a new
 * feature is a field on `PlanFeatures` in api/admin.py plus a column here.
 *
 * Every renewal grants the figure saved here AT THAT MOMENT (the operator's
 * choice, 2026-10-12), so the page says so above the button rather than in a
 * footnote: lowering a number lowers it for people already subscribed.
 */
export default async function PlanFeaturesPage() {
  const data = await get<PlanFeaturesState>("/api/admin/plan-features");
  const t = await translator();

  return (
    <>
      <p><Link href="/settings">{t("planFeatures.back")}</Link></p>
      <h1>{t("planFeatures.title")}</h1>
      <p className="sub">{t("planFeatures.lead")}</p>

      {data.plans.length === 0 ? (
        <p className="empty">
          {t("planFeatures.noPlans")}{" "}
          <Link href="/settings/pricing">{t("settings.editPricing")}</Link>
        </p>
      ) : (
        <form action={savePlanFeatures}>
          <div className="tablewrap">
            <table>
              <thead>
                <tr>
                  <th>{t("common.plan")}</th>
                  <th>{t("planFeatures.published")}</th>
                  <th>{t("planFeatures.credits")}</th>
                </tr>
              </thead>
              <tbody>
                {data.plans.map((p) => {
                  const saved = data.features[p.id]?.credits;
                  const legacy = data.legacy[p.id] ?? 0;
                  return (
                    <tr key={p.id}>
                      <td>
                        <b>{p.name}</b> <code>{p.id}</code>
                      </td>
                      <td>{p.enabled ? t("planFeatures.yes") : t("planFeatures.no")}</td>
                      <td>
                        <input
                          name={`credits:${p.id}`}
                          type="number"
                          min={0}
                          max={1000000}
                          step={1}
                          defaultValue={saved ?? (legacy || "")}
                          aria-label={`${p.name} ${t("planFeatures.credits")}`}
                        />{" "}
                        {/* Until a plan is saved here, billing still reads the
                            figure its card carried. Say so, or the operator
                            cannot tell a saved number from a prefilled one. */}
                        {saved === undefined && (
                          <span className="pill ci-idle">{t("planFeatures.notSaved")}</span>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
          <p className="sub">{t("planFeatures.renewalNote")}</p>
          <button className="act" type="submit">{t("common.save")}</button>
        </form>
      )}
    </>
  );
}
