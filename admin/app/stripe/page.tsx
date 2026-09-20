import { get } from "@/lib/api";
import { getLocale, translator } from "@/lib/locale";
import type { StripeStatus } from "@/lib/types";
import { StripePanel } from "./panel";

export const dynamic = "force-dynamic";

export default async function StripePage() {
  const initial = await get<StripeStatus>("/api/admin/stripe");
  const t = await translator();
  const locale = await getLocale();

  return (
    <>
      <h1>{t("stripe.title")}</h1>
      <p className="sub">{t("stripe.lead")}</p>
      <StripePanel initial={initial} locale={locale} />
    </>
  );
}
