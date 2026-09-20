import { get } from "@/lib/api";
import { getLocale, translator } from "@/lib/locale";
import type { CiOverview } from "@/lib/types";
import { CiBoard } from "./board";

export const dynamic = "force-dynamic";

export default async function CiPage() {
  const initial = await get<CiOverview>("/api/admin/ci");
  const t = await translator();
  const locale = await getLocale();

  return (
    <>
      <h1>{t("ci.title")}</h1>
      <p className="sub">
        {t("ci.lead", {
          branch: initial.branch,
          trigger: initial.can_trigger ? t("ci.canTrigger") : "",
        })}
      </p>
      <CiBoard initial={initial} locale={locale} />
    </>
  );
}
