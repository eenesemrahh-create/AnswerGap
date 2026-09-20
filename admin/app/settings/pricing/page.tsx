import Link from "next/link";
import { get } from "@/lib/api";
import { getLocale, translator } from "@/lib/locale";
import type { Pricing } from "@/lib/types";
import { PricingEditor } from "./editor";

// The editor manages local state and posts back on save, so the initial render
// wants fresh data at every visit rather than a cached response. Same choice
// as /settings a level up.
export const dynamic = "force-dynamic";

export default async function PricingPage() {
  const current = await get<Pricing>("/api/admin/pricing");
  const t = await translator();
  const locale = await getLocale();

  return (
    <>
      <p className="sub" style={{ marginTop: 0 }}>
        <Link href="/settings" className="linkish">{t("pricing.back")}</Link>
      </p>
      <h1>{t("pricing.title")}</h1>
      <p className="sub">{t("pricing.lead")}</p>
      <p className="sub">{t("pricing.appendNote")}</p>

      <PricingEditor initial={current.plans} locale={locale} />
    </>
  );
}
