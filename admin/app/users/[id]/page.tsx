import { get, money, when } from "@/lib/api";
import { getLocale, translator } from "@/lib/locale";
import type { Pricing, UserDetail } from "@/lib/types";
import { grantCredits, revokeTokens, setStatus } from "../actions";
import { EraseAccount } from "./EraseAccount";
import { PlanPanel } from "./PlanPanel";

export const dynamic = "force-dynamic";

export default async function UserPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const userId = Number(id);
  // TWO REQUESTS IN PARALLEL, not one after the other. The plan list is not
  // derived from the user, so awaiting them in sequence would add a round trip
  // to every page load for nothing.
  //
  // NEITHER CALL IS WRAPPED IN A CATCH, and that is deliberate rather than an
  // oversight. `call()` turns every failure into a `redirect()` - to /signin,
  // /no-access or /api-error - and a `redirect()` works by THROWING. A
  // `.catch` around one of these would swallow the sign-in bounce along with
  // the error it was meant to tolerate, and the operator would get a page
  // rendered from a fallback instead of being sent where they need to go.
  //
  // So a corrupt `pricing_plans` setting takes this page to /api-error naming
  // that path. Not ideal - the ledger and the erase control are on this page -
  // but it names the real problem, and the alternative is sniffing redirect
  // digests to tell one throw from another.
  const [u, pricing] = await Promise.all([
    get<UserDetail>(`/api/admin/user/${userId}`),
    get<Pricing>("/api/admin/pricing"),
  ]);

  const grant = grantCredits.bind(null, userId);
  const status = setStatus.bind(null, userId);
  const revoke = revokeTokens.bind(null, userId);
  const t = await translator();
  const locale = await getLocale();

  return (
    <>
      <h1>{u.email}</h1>
      <p className="sub">
        <span className={`pill ${u.status}`}>{t(`common.${u.status}`)}</span>{" "}
        {u.is_admin && <span className="pill admin">admin</span>} · {t("userDetail.joinedAt")}{" "}
        {when(u.created_at)} · {t("userDetail.lastSeenAt")} {when(u.last_seen_at)}
      </p>

      <div className="cards">
        <div className="card">
          <span>{t("userDetail.creditsCard")}</span>
          <b className={u.balance < 0 ? "neg" : ""}>{u.balance}</b>
          <em>{t("userDetail.creditsNote")}</em>
        </div>
        <div className="card">
          <span>{t("common.searches")}</span><b>{u.usage.length}</b>
          <em>{t("userDetail.searchesNote")}</em>
        </div>
        <div className="card">
          <span>{t("common.spend")}</span>
          {/* The SUM OF THE 50 ROWS BELOW, and it has to say so. This card
              used to read "reported by DataForSEO", which is true of each
              number in it and false of the total: `admin_user_detail` caps
              the usage list at 50, so for a busy account this figure was a
              fraction of the real spend wearing the label of the whole.
              The unlimited lifetime figure is one page over, on Reports. */}
          <b>{money(u.usage.reduce((sum, r) => sum + Number(r.spend_usd || 0), 0))}</b>
          <em>
            {t("userDetail.spendNote")} · <a href="/reports">{t("userDetail.lifetimeLink")}</a>
          </em>
        </div>
      </div>

      {u.is_admin && (
        <p className="notice">{t("userDetail.adminNotice")}</p>
      )}

      <h2>{t("userDetail.creditsHeading")}</h2>
      <form className="row" action={grant}>
        <input name="delta" type="number" placeholder={t("userDetail.deltaPlaceholder")} required />
        <input name="note" placeholder={t("userDetail.notePlaceholder")} />
        <button className="act" type="submit">{t("common.apply")}</button>
      </form>
      <div className="tablewrap">
        <table>
          <thead>
            <tr><th>{t("common.when")}</th><th className="num">{t("userDetail.delta")}</th>
              <th>{t("userDetail.reason")}</th><th>{t("userDetail.ref")}</th>
              <th>{t("userDetail.note")}</th></tr>
          </thead>
          <tbody>
            {u.ledger.map((r, i) => (
              <tr key={i}>
                <td>{when(r.created_at)}</td>
                <td className={`num${r.delta < 0 ? " neg" : ""}`}>
                  {r.delta > 0 ? `+${r.delta}` : r.delta}
                </td>
                <td>{r.reason}</td>
                <td>{r.ref ?? "—"}</td>
                <td>{r.note ?? "—"}</td>
              </tr>
            ))}
          </tbody>
        </table>
        {u.ledger.length === 0 && <p className="empty">{t("userDetail.noLedger")}</p>}
      </div>

      {/* Between the ledger and the account controls: a plan is about what
          this person is entitled to, which is the same subject as the balance
          directly above it - and it is reversible, unlike the block below. */}
      <PlanPanel
        userId={userId}
        subscriptions={u.subscriptions ?? []}
        plans={pricing.plans}
        locale={locale}
      />

      <h2>{t("userDetail.account")}</h2>
      <form className="row" action={status}>
        <input
          type="hidden"
          name="status"
          value={u.status === "active" ? "suspended" : "active"}
        />
        <button className={`act${u.status === "active" ? " warn" : ""}`} type="submit">
          {u.status === "active" ? t("userDetail.suspend") : t("userDetail.reactivate")}
        </button>
        <span className="sub" style={{ margin: 0 }}>{t("userDetail.statusNote")}</span>
      </form>
      <form className="row" action={revoke}>
        <button className="act" type="submit">{t("userDetail.revoke")}</button>
        <span className="sub" style={{ margin: 0 }}>
          {t("userDetail.revokeNote", { epoch: u.token_epoch })}
        </span>
      </form>

      {/* Its own heading, below the reversible controls. Suspending is
          something you undo; this is not, and putting them under one heading
          is how somebody eventually reaches for the wrong one. */}
      <h2>{t("erase.heading")}</h2>
      <EraseAccount
        userId={userId}
        email={u.email}
        erased={u.erased_at !== null}
        locale={locale}
      />

      <h2>{t("userDetail.activity")}</h2>
      <div className="tablewrap">
        <table>
          <thead>
            <tr>
              <th>{t("common.when")}</th><th>{t("userDetail.action")}</th><th>{t("userDetail.outcome")}</th>
              <th className="num">{t("common.credits")}</th><th className="num">{t("userDetail.cost")}</th><th>{t("userDetail.tree")}</th>
            </tr>
          </thead>
          <tbody>
            {u.usage.map((r, i) => (
              <tr key={i}>
                <td>{when(r.created_at)}</td>
                <td>{r.action}</td>
                <td>{r.outcome === "allowed" ? "allowed" : <span className="neg">{r.outcome}</span>}</td>
                <td className="num">{r.credits}</td>
                <td className="num">{money(Number(r.spend_usd || 0))}</td>
                <td>{r.tree_slug ?? "—"}</td>
              </tr>
            ))}
          </tbody>
        </table>
        {u.usage.length === 0 && <p className="empty">{t("userDetail.noActivity")}</p>}
      </div>

      <h2>{t("userDetail.searchesHeading")}</h2>
      <div className="tablewrap">
        <table>
          <thead>
            <tr><th>{t("common.when")}</th><th>{t("userDetail.seed")}</th>
              <th>{t("userDetail.market")}</th><th className="num">{t("common.spend")}</th></tr>
          </thead>
          <tbody>
            {u.crawls.map((c) => (
              <tr key={c.id}>
                <td>{when(c.created_at)}</td>
                <td>{c.seed}</td>
                <td>{c.language_code} / {c.location_code}</td>
                <td className="num">{money(Number(c.spend || 0))}</td>
              </tr>
            ))}
          </tbody>
        </table>
        {u.crawls.length === 0 && <p className="empty">{t("userDetail.noSearches")}</p>}
      </div>
    </>
  );
}
