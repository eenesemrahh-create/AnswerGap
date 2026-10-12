import Link from "next/link";
import { get, money, when } from "@/lib/api";
import { translator } from "@/lib/locale";
import type { Pricing, UserRow } from "@/lib/types";

export const dynamic = "force-dynamic";

export default async function UsersPage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string; status?: string; plan?: string }>;
}) {
  const { q = "", status = "", plan = "" } = await searchParams;
  const params = new URLSearchParams();
  if (q) params.set("q", q);
  if (status) params.set("status", status);
  if (plan) params.set("plan", plan);
  const [{ users }, pricing] = await Promise.all([
    get<{ users: UserRow[] }>(`/api/admin/users?${params.toString()}`),
    get<Pricing>("/api/admin/pricing"),
  ]);
  const t = await translator();

  // The card's name when the plan still has a card, its id when it does not -
  // a retired plan must still say what somebody is on.
  const planName = (id: string | null | undefined) =>
    pricing.plans.find((p) => p.id === id)?.name || id || t("common.none");

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
        <select name="plan" defaultValue={plan}>
          <option value="">{t("users.anyPlan")}</option>
          <option value="subscribed">{t("users.subscribed")}</option>
          <option value="none">{t("users.noPlan")}</option>
        </select>
        <button className="act" type="submit">{t("common.filter")}</button>
      </form>

      <div className="tablewrap">
        <table>
          <thead>
            <tr>
              <th>{t("common.name")}</th>
              <th>{t("common.email")}</th>
              <th>{t("common.status")}</th>
              <th>{t("common.plan")}</th>
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
                {/* Both name and address open the account, as a topic opens
                    its search on the Searches page: whichever one the
                    operator recognises is the one they will click. */}
                <td><Link href={`/users/${u.id}`}>{u.name || t("common.none")}</Link></td>
                <td><Link href={`/users/${u.id}`}>{u.email}</Link></td>
                <td><span className={`pill ${u.status}`}>{t(`common.${u.status}`)}</span></td>
                <td>
                  {u.plan_id ? (
                    <>
                      {planName(u.plan_id)}{" "}
                      {/* Test is called out loudly on purpose: a sandbox plan
                          grants real credits in this database, and must never
                          be mistaken for a paying customer. */}
                      {u.plan_source === "admin" ? (
                        <span className="pill admin">{t("common.assigned")}</span>
                      ) : u.plan_livemode === false ? (
                        <span className="pill ci-run">{t("common.test")}</span>
                      ) : u.plan_livemode ? (
                        <span className="pill active">{t("common.live")}</span>
                      ) : null}{" "}
                      {!u.plan_live && <span className="pill ci-idle">{t("common.lapsed")}</span>}
                    </>
                  ) : (
                    t("common.none")
                  )}
                </td>
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
