import Link from "next/link";
import { get, money, when } from "@/lib/api";
import { translator } from "@/lib/locale";
import type { UserRow } from "@/lib/types";

export const dynamic = "force-dynamic";

export default async function UsersPage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string; status?: string }>;
}) {
  const { q = "", status = "" } = await searchParams;
  const params = new URLSearchParams();
  if (q) params.set("q", q);
  if (status) params.set("status", status);
  const { users } = await get<{ users: UserRow[] }>(
    `/api/admin/users?${params.toString()}`
  );
  const t = await translator();

  return (
    <>
      <h1>{t("users.title")}</h1>
      <p className="sub">{t("users.lead")}</p>

      <form className="row" method="get">
        <input name="q" defaultValue={q} placeholder={t("users.searchPlaceholder")} />
        <select name="status" defaultValue={status}>
          <option value="">{t("common.anyStatus")}</option>
          <option value="active">{t("common.active")}</option>
          <option value="suspended">{t("common.suspended")}</option>
        </select>
        <button className="act" type="submit">{t("common.filter")}</button>
      </form>

      <div className="tablewrap">
        <table>
          <thead>
            <tr>
              <th>{t("common.email")}</th>
              <th>{t("common.status")}</th>
              <th>{t("common.signIn")}</th>
              <th className="num">{t("common.credits")}</th>
              <th className="num">{t("common.searches")}</th>
              <th className="num">{t("common.spend")}</th>
              <th>{t("common.joined")}</th>
              <th>{t("common.lastSeen")}</th>
            </tr>
          </thead>
          <tbody>
            {users.map((u) => (
              <tr key={u.id}>
                <td><Link href={`/users/${u.id}`}>{u.email}</Link></td>
                <td><span className={`pill ${u.status}`}>{t(`common.${u.status}`)}</span></td>
                {/* Unverified is called out because it is a SPENDING block,
                    not a profile detail: every paid action refuses with
                    emailUnverified until the link is clicked. */}
                <td>
                  {u.email_verified ? (
                    <span className="doors">
                      {u.has_password ? t("common.password") : ""}
                      {u.has_password && u.has_google ? " + " : ""}
                      {u.has_google ? t("common.google") : ""}
                    </span>
                  ) : (
                    <span className="pill suspended">{t("common.unverified")}</span>
                  )}
                </td>
                <td className={`num${u.balance < 0 ? " neg" : ""}`}>{u.balance}</td>
                <td className="num">{u.searches}</td>
                <td className="num">{money(u.spend_usd)}</td>
                <td>{when(u.created_at)}</td>
                <td>{when(u.last_seen_at)}</td>
              </tr>
            ))}
          </tbody>
        </table>
        {users.length === 0 && <p className="empty">{t("common.noMatch")}</p>}
      </div>
    </>
  );
}
