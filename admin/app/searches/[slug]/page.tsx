import Link from "next/link";
import { get, money, usd, when } from "@/lib/api";
import { getLocale, translator } from "@/lib/locale";
import { ResultView } from "@/components/ResultView";
import type { SearchDetail } from "@/lib/types";

export const dynamic = "force-dynamic";

type T = Awaited<ReturnType<typeof translator>>;

/**
 * One search: the result as stored, who ran it, who spent what on it.
 *
 * The result is read through the ADMIN API, not by opening the customer app's
 * tree page. That page is gated by ownership and stays that way - giving
 * admins a bypass there would put a privilege check in the one file whose
 * contract is that nothing in it is privileged.
 */
export default async function SearchDetailPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const d = await get<SearchDetail>(`/api/admin/search/${encodeURIComponent(slug)}`);
  const t = await translator();
  const locale = await getLocale();
  const firstAt = d.crawls[d.crawls.length - 1]?.created_at;

  return (
    <>
      <p><Link href="/searches">{t("searches.back")}</Link></p>
      <h1>{d.seed}</h1>
      <p className="sub">
        {d.language_code} / {d.location_code} · <code>{d.slug}</code>
        {firstAt && <> · {t("searches.firstSearched", { when: when(firstAt) })}</>}
      </p>

      <h2>{t("searches.resultHeading")}</h2>
      {d.tree ? (
        <>
          <p className="sub">
            {t("searches.resultLead")} · {d.tree.question_count} {t("searches.questions")}
            {d.tree.updated_at && <> · {t("searches.updated", { date: when(d.tree.updated_at) })}</>}
          </p>
          <p className="chips">
            {Object.entries(d.tree.status_counts).map(([status, count]) => (
              <span key={status} className={`status-pill ${status}`}>
                {t(`gapStatus.${status}`)} {count}
              </span>
            ))}
          </p>
          <ResultView slug={d.slug} seed={d.seed} nodes={d.tree.nodes} locale={locale} />
          {d.tree.related_searches.length > 0 && (
            <>
              <h2>{t("searches.related")}</h2>
              <p className="chips">
                {d.tree.related_searches.map((r) => (
                  <span key={r} className="pill">{r}</span>
                ))}
              </p>
            </>
          )}
        </>
      ) : (
        <p className="notice">{t("searches.noTree")}</p>
      )}

      <h2>{t("searches.costHeading")}</h2>
      <p className="sub">{t("searches.costLead")}</p>
      <div className="cards">
        <div className="card">
          <span>{t("searches.providerTotal")}</span>
          <b>{usd(d.totals.provider_usd)}</b>
          <em>
            {t("searches.crawlCost")} {usd(d.totals.crawl_usd)} · {t("searches.taskCost")}{" "}
            {usd(d.totals.task_usd)}
          </em>
        </div>
        <div className="card">
          <span>{t("searches.attributedTotal")}</span>
          <b>{usd(d.totals.attributed_usd)}</b>
          <em>{t("searches.attributedTotalNote")}</em>
        </div>
        <div className="card">
          <span>{t("searches.unattributed")}</span>
          <b className={d.totals.unattributed_usd > 0.000001 ? "neg" : ""}>
            {usd(d.totals.unattributed_usd)}
          </b>
        </div>
        <div className="card">
          <span>{t("searches.creditsTotal")}</span>
          <b>{d.totals.credits.toLocaleString()}</b>
          <em>{t("searches.creditsTotalNote")}</em>
        </div>
      </div>

      <h2>{t("searches.spendersHeading")}</h2>
      <p className="sub">{t("searches.spendersLead")}</p>
      <div className="tablewrap">
        <table>
          <thead>
            <tr>
              <th>{t("searches.who")}</th>
              <th>{t("common.did")}</th>
              <th className="num">{t("activity.attempts")}</th>
              <th className="num">{t("activity.billable")}</th>
              <th className="num">{t("activity.refused")}</th>
              <th className="num">{t("searches.credits")}</th>
              <th className="num">{t("searches.cost")}</th>
              <th>{t("activity.lastAt")}</th>
            </tr>
          </thead>
          <tbody>
            {d.spenders.map((s, i) => (
              <tr key={`${s.user_id}-${s.action}-${i}`}>
                <td><Person t={t} id={s.user_id} email={s.email} admin={s.is_admin} /></td>
                <td>{t(`action.${s.action}`)}</td>
                <td className="num">{s.attempts}</td>
                <td className="num">{s.billable}</td>
                <td className={`num${s.refused ? " neg" : ""}`}>{s.refused}</td>
                <td className="num">{s.credits}</td>
                <td className="num">{money(s.spend_usd)}</td>
                <td>{when(s.last_at)}</td>
              </tr>
            ))}
          </tbody>
        </table>
        {d.spenders.length === 0 && <p className="empty">{t("common.nothingYet")}</p>}
      </div>

      <h2>{t("searches.crawlsHeading")}</h2>
      <p className="sub">{t("searches.crawlsLead")}</p>
      <div className="tablewrap">
        <table>
          <thead>
            <tr>
              <th>{t("common.when")}</th>
              <th>{t("searches.who")}</th>
              <th>{t("searches.market")}</th>
              <th>{t("searches.source")}</th>
              <th className="num">{t("searches.calls")}</th>
              <th className="num">{t("searches.cost")}</th>
            </tr>
          </thead>
          <tbody>
            {d.crawls.map((c) => (
              <tr key={c.id}>
                <td>{when(c.created_at)}</td>
                <td><Person t={t} id={c.user_id} email={c.email} admin={c.is_admin} /></td>
                <td>{c.language_code} / {c.location_code}</td>
                <td>{c.source}</td>
                <td className="num">{c.billable_calls}</td>
                <td className="num">{money(c.spend)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {d.tasks.length > 0 && (
        <>
          <h2>{t("searches.tasksHeading")}</h2>
          <div className="tablewrap">
            <table>
              <thead>
                <tr>
                  <th>{t("searches.who")}</th>
                  <th>{t("searches.status")}</th>
                  <th className="num">{t("searches.tasks")}</th>
                  <th className="num">{t("searches.cost")}</th>
                  <th>{t("activity.lastAt")}</th>
                </tr>
              </thead>
              <tbody>
                {d.tasks.map((k, i) => (
                  <tr key={`${k.user_id}-${k.status}-${i}`}>
                    <td><Person t={t} id={k.user_id} email={k.email} admin={false} /></td>
                    <td>{k.status}</td>
                    <td className="num">{k.tasks}</td>
                    <td className="num">{money(k.cost)}</td>
                    <td>{when(k.last_at)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </>
      )}

      <h2>{t("searches.eventsHeading")}</h2>
      {d.events_capped && <p className="sub">{t("searches.eventsCapped")}</p>}
      <div className="tablewrap">
        <table>
          <thead>
            <tr>
              <th>{t("common.when")}</th>
              <th>{t("searches.who")}</th>
              <th>{t("common.did")}</th>
              <th>{t("searches.outcome")}</th>
              <th>{t("searches.question")}</th>
              <th className="num">{t("searches.credits")}</th>
              <th className="num">{t("searches.cost")}</th>
            </tr>
          </thead>
          <tbody>
            {d.events.map((e, i) => (
              <tr key={`${e.created_at}-${i}`}>
                <td>{when(e.created_at)}</td>
                <td><Person t={t} id={e.user_id} email={e.email} admin={false} /></td>
                <td>{t(`action.${e.action}`)}</td>
                <td className={e.outcome === "allowed" ? "" : "neg"}>{t(`outcome.${e.outcome}`)}</td>
                <td>{e.question_slug ?? "—"}</td>
                <td className="num">{e.credits}</td>
                <td className="num">{money(e.spend_usd)}</td>
              </tr>
            ))}
          </tbody>
        </table>
        {d.events.length === 0 && <p className="empty">{t("common.nothingYet")}</p>}
      </div>
    </>
  );
}

/** An account link, or "anonymous" for a row with no account behind it -
 *  a signed-out visitor or an erased account, which are not told apart. */
function Person({ t, id, email, admin }: {
  t: T; id: number | null; email: string | null; admin: boolean;
}) {
  if (id == null) return <span className="faint">{t("searches.anonymous")}</span>;
  return (
    <>
      <Link href={`/users/${id}`}>{email || `#${id}`}</Link>
      {admin && <> <span className="pill admin">admin</span></>}
    </>
  );
}
