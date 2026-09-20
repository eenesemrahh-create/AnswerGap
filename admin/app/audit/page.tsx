import { get, when } from "@/lib/api";
import { translator } from "@/lib/locale";
import type { AdminAction } from "@/lib/types";

export const dynamic = "force-dynamic";

export default async function AuditPage() {
  const { actions } = await get<{ actions: AdminAction[] }>("/api/admin/actions");
  const t = await translator();

  return (
    <>
      <h1>{t("audit.title")}</h1>
      <p className="sub">{t("audit.lead")}</p>

      <div className="tablewrap">
        <table>
          <thead>
            <tr>
              <th>{t("common.when")}</th><th>{t("common.who")}</th>
              <th>{t("common.did")}</th><th>{t("common.to")}</th>
              <th>{t("common.detail")}</th>
            </tr>
          </thead>
          <tbody>
            {actions.map((a) => (
              <tr key={a.id}>
                <td>{when(a.created_at)}</td>
                <td>{a.actor}</td>
                <td>{a.action}</td>
                <td>{a.target_email ?? "—"}</td>
                <td>{a.detail ? JSON.stringify(a.detail) : "—"}</td>
              </tr>
            ))}
          </tbody>
        </table>
        {actions.length === 0 && <p className="empty">{t("common.nothingYet")}</p>}
      </div>
    </>
  );
}
