import { get, when } from "@/lib/api";
import type { AdminAction } from "@/lib/types";

export const dynamic = "force-dynamic";

export default async function AuditPage() {
  const { actions } = await get<{ actions: AdminAction[] }>("/api/admin/actions");

  return (
    <>
      <h1>Audit</h1>
      <p className="sub">
        Every privileged action, append-only. An admin&apos;s compromised Google
        account is a compromised panel — there is no second factor here. This log
        is what makes that damage visible rather than impossible, which is the
        only guarantee actually available.
      </p>

      <div className="tablewrap">
        <table>
          <thead>
            <tr>
              <th>When</th><th>Who</th><th>Did</th><th>To</th><th>Detail</th>
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
        {actions.length === 0 && <p className="empty">Nothing yet.</p>}
      </div>
    </>
  );
}
