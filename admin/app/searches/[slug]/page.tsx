import Link from "next/link";
import { get, money, usd, when } from "@/lib/api";
import { translator } from "@/lib/locale";
import type { SearchDetail, SearchNode } from "@/lib/types";

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
  const firstAt = d.crawls[d.crawls.length - 1]?.created_at;

  return (
    <>
      <p><Link href="/searches">{t("searches.back")}</Link></p>
      <h1>{d.seed}</h1>
      <p className="sub">
        {d.language_code} / {d.location_code} · <code>{d.slug}</code>
        {firstAt && <> · {t("searches.firstSearched", { when: when(firstAt) })}</>}
      </p>

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
          <ResultTree t={t} nodes={d.tree.nodes} />
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

/** The stored tree, as nested lists. Each question opens to show the pages
 *  Google returned for it - which is what "check the result" means. */
function ResultTree({ t, nodes }: { t: T; nodes: SearchNode[] }) {
  const children = new Map<string | null, SearchNode[]>();
  const ids = new Set(nodes.map((n) => n.id));
  for (const n of nodes) {
    // An orphan (parent not in the list) hangs from the root rather than vanishing.
    const parent = n.parent_id && ids.has(n.parent_id) ? n.parent_id : null;
    if (n.depth === 0 && parent === null) continue;
    const key = parent ?? "__root";
    children.set(key, [...(children.get(key) ?? []), n]);
  }
  const root = nodes.find((n) => n.depth === 0);
  const top = [
    ...(root ? children.get(root.id) ?? [] : []),
    ...(children.get("__root") ?? []),
  ];

  const seen = new Set<string>();
  const render = (list: SearchNode[]) => (
    <ul className="qtree">
      {list.map((n) => {
        if (seen.has(n.id)) return null; // a cycle must not hang the page
        seen.add(n.id);
        const kids = children.get(n.id) ?? [];
        return (
          <li key={n.id}>
            <details>
              <summary>
                <span className={`status-pill ${n.status}`}>{t(`gapStatus.${n.status}`)}</span>{" "}
                {n.question}
                {n.discovered_by === "harvest" && (
                  <span className="faint"> · {t("searches.harvested")}</span>
                )}
              </summary>
              <div className="qdetail">
                <p className="faint">
                  {n.results_checked
                    ? t("searches.pagesChecked", {
                        matching: n.matching_pages ?? 0,
                        checked: n.results_checked,
                      })
                    : t("searches.notChecked")}
                  {n.ai_sources.length > 0 &&
                    ` · ${t("searches.aiCites", { domains: n.ai_sources.join(", ") })}`}
                </p>
                {n.results.length > 0 && (
                  <ol>
                    {n.results.map((r, i) => (
                      <li key={i}>
                        {/* rel=noreferrer: an admin URL must not leak to a
                            third-party site through the Referer header. */}
                        {/* Only http(s) becomes a link. The URL is third-party
                            data, and a `javascript:` one would run in the
                            admin's own session. */}
                        {/^https?:\/\//i.test(r.url ?? "") ? (
                          <a href={r.url} target="_blank" rel="noreferrer noopener">
                            {r.title || r.url}
                          </a>
                        ) : (
                          <span>{r.title || r.url}</span>
                        )}{" "}
                        <span className="faint">{r.domain}</span>
                      </li>
                    ))}
                  </ol>
                )}
              </div>
            </details>
            {kids.length > 0 && render(kids)}
          </li>
        );
      })}
    </ul>
  );
  return render(top);
}
