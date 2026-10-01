import Link from "next/link";
import { get, usd, when } from "@/lib/api";
import { translator } from "@/lib/locale";
import type { SearchList } from "@/lib/types";

export const dynamic = "force-dynamic";

const PAGE = 50;

/** The filters this page understands, and nothing else travels to the API. */
const FILTERS = ["q", "email", "language", "location", "date_from", "date_to", "paid", "sort"] as const;
type Filters = Partial<Record<(typeof FILTERS)[number] | "offset", string>>;

/**
 * Every search anybody has run, one row per topic.
 *
 * THE ONLY SCREEN WHERE ONE PERSON'S SEARCHES ARE VISIBLE TO ANOTHER. The
 * customer app shows each account its own list and nothing else; this is the
 * operator's view of all of them. The gate is the API's `require_admin`, as on
 * every page here - this service only carries the admin's cookie to it.
 *
 * A plain GET form, so a filtered view is a URL: it survives a reload and can
 * be sent to whoever is asking "what did this account search for".
 */
export default async function SearchesPage({
  searchParams,
}: {
  searchParams: Promise<Filters>;
}) {
  const filters = await searchParams;
  const params = new URLSearchParams();
  for (const key of FILTERS) {
    const value = filters[key];
    if (value) params.set(key, value);
  }
  const offset = Math.max(0, Number(filters.offset) || 0);
  const query = new URLSearchParams(params);
  query.set("limit", String(PAGE));
  query.set("offset", String(offset));

  const data = await get<SearchList>(`/api/admin/searches?${query.toString()}`);
  const t = await translator();

  const pageLink = (nextOffset: number) => {
    const p = new URLSearchParams(params);
    if (nextOffset > 0) p.set("offset", String(nextOffset));
    const qs = p.toString();
    return `/searches${qs ? `?${qs}` : ""}`;
  };
  const filtered = params.toString() !== "";

  return (
    <>
      <h1>{t("searches.title")}</h1>
      <p className="sub">{t("searches.lead")}</p>

      <form className="row filters" method="get">
        <input name="q" defaultValue={filters.q ?? ""} placeholder={t("searches.q")} />
        <input name="email" defaultValue={filters.email ?? ""} placeholder={t("searches.email")} />
        <input name="language" defaultValue={filters.language ?? ""}
               placeholder={t("searches.language")} size={12} />
        <input name="location" defaultValue={filters.location ?? ""}
               placeholder={t("searches.location")} inputMode="numeric" size={12} />
        <label className="inline">
          {t("searches.from")}
          <input type="date" name="date_from" defaultValue={filters.date_from ?? ""} />
        </label>
        <label className="inline">
          {t("searches.to")}
          <input type="date" name="date_to" defaultValue={filters.date_to ?? ""} />
        </label>
        <label className="inline">
          <input type="checkbox" name="paid" value="1" defaultChecked={filters.paid === "1"} />
          {t("searches.paidOnly")}
        </label>
        <select name="sort" defaultValue={filters.sort ?? "recent"} aria-label={t("searches.sort")}>
          <option value="recent">{t("searches.sortRecent")}</option>
          <option value="oldest">{t("searches.sortOldest")}</option>
          <option value="cost">{t("searches.sortCost")}</option>
          <option value="crawls">{t("searches.sortCrawls")}</option>
          <option value="credits">{t("searches.sortCredits")}</option>
        </select>
        <button className="act" type="submit">{t("common.filter")}</button>
        {filtered && <Link href="/searches">{t("searches.clear")}</Link>}
      </form>

      {/* Over EVERY matching search, not this page - a sum that changed with
          the page size would be a number nobody could quote. */}
      <div className="cards">
        <div className="card">
          <span>{t("searches.matched", { count: data.total.toLocaleString() })}</span>
          <b>{usd(data.total_provider_usd)}</b>
          <em>{t("searches.providerTotal")} · {t("searches.providerTotalNote")}</em>
        </div>
        <div className="card">
          <span>{t("searches.attributedTotal")}</span>
          <b>{usd(data.total_attributed_usd)}</b>
          <em>{t("searches.attributedTotalNote")}</em>
        </div>
        <div className="card">
          <span>{t("searches.creditsTotal")}</span>
          <b>{data.total_credits.toLocaleString()}</b>
          <em>{t("searches.creditsTotalNote")}</em>
        </div>
      </div>

      <div className="tablewrap" style={{ marginTop: 16 }}>
        <table>
          <thead>
            <tr>
              <th>{t("searches.topic")}</th>
              <th>{t("searches.market")}</th>
              <th>{t("searches.who")}</th>
              <th className="num">{t("searches.timesSearched")}</th>
              <th>{t("searches.lastSearched")}</th>
              <th className="num">{t("searches.cost")}</th>
              <th className="num">{t("searches.credits")}</th>
            </tr>
          </thead>
          <tbody>
            {data.searches.map((s) => (
              <tr key={s.slug}>
                <td>
                  <Link href={`/searches/${encodeURIComponent(s.slug)}`}>{s.seed}</Link>
                </td>
                <td>{s.language_code} / {s.location_code}</td>
                <td>
                  {s.users.slice(0, 2).map((u, i) => (
                    <span key={u.id}>
                      {i > 0 && ", "}
                      <Link href={`/users/${u.id}`}>{u.email}</Link>
                      {u.is_admin && <> <span className="pill admin">admin</span></>}
                    </span>
                  ))}
                  {s.users.length > 2 && (
                    <span className="faint"> {t("searches.moreAccounts", { count: s.users.length - 2 })}</span>
                  )}
                  {s.anonymous_crawls > 0 && (
                    <span className="faint">
                      {s.users.length > 0 ? " · " : ""}
                      {t("searches.anonymous")} ×{s.anonymous_crawls}
                    </span>
                  )}
                </td>
                <td className="num">{s.crawls}</td>
                <td>{when(s.last_at)}</td>
                <td className="num">{usd(s.provider_usd)}</td>
                <td className="num">{s.credits}</td>
              </tr>
            ))}
          </tbody>
        </table>
        {data.searches.length === 0 && <p className="empty">{t("searches.none")}</p>}
      </div>

      {data.total > PAGE && (
        <p className="pager">
          {offset > 0 ? (
            <Link href={pageLink(Math.max(0, offset - PAGE))}>{t("searches.prev")}</Link>
          ) : <span />}
          <span className="faint">
            {t("searches.page", {
              from: offset + 1,
              to: Math.min(offset + PAGE, data.total),
              total: data.total,
            })}
          </span>
          {offset + PAGE < data.total ? (
            <Link href={pageLink(offset + PAGE)}>{t("searches.next")}</Link>
          ) : <span />}
        </p>
      )}
    </>
  );
}
