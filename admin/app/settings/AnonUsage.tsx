import { headers } from "next/headers";
import { get, money, when } from "@/lib/api";
import { translator } from "@/lib/locale";
import type { AnonUsage, IpCheck } from "@/lib/types";

/**
 * Signed-out searching, for the operator (2026-10-19): is the address being
 * read correctly, how many free searches were spent each day, and by whom -
 * as a SHORT CODE, never an address (the raw IP is not stored).
 *
 * The IP check forwards THIS request's X-Forwarded-For to the api: the panel
 * calls the api from its own server, so the api's own view of the request
 * would name that server rather than the operator.
 */
export async function AnonUsagePanel() {
  const t = await translator();
  const chain = (await headers()).get("x-forwarded-for") ?? "";
  const [ip, usage] = await Promise.all([
    get<IpCheck>(`/api/admin/ip-check?chain=${encodeURIComponent(chain)}`).catch(() => null),
    get<AnonUsage>("/api/admin/anon-usage?days=30").catch(() => null),
  ]);

  const days = usage?.daily ?? [];
  const peak = Math.max(1, ...days.map((d) => d.allowed + d.refused_limit + d.refused_full + d.refused_captcha));
  const today = days[days.length - 1];

  return (
    <>
      <h3>{t("anonUsage.ipHeading")}</h3>
      {ip ? (
        <div className="cards">
          <div className="card">
            <span>{t("anonUsage.ipRead")}</span>
            <b>{ip.client_ip ?? "—"}</b>
            <em>{t("anonUsage.ipCompare")}</em>
          </div>
          <div className="card">
            <span>{t("anonUsage.ipChain")}</span>
            <b className="mono">{ip.forwarded_for || "—"}</b>
            <em>{t("anonUsage.ipHops", { hops: ip.trusted_hops })}</em>
          </div>
        </div>
      ) : (
        <p className="notice">{t("anonUsage.unavailable")}</p>
      )}

      <h3>{t("anonUsage.heading")}</h3>
      {!usage ? (
        <p className="notice">{t("anonUsage.unavailable")}</p>
      ) : (
        <>
          {today && (
            <p className="sub">
              {t("anonUsage.today", {
                allowed: today.allowed,
                refused: today.refused_limit + today.refused_full + today.refused_captcha,
                addresses: today.addresses,
                spend: money(today.spend_usd),
              })}
            </p>
          )}
          {/* One column per UTC day: free searches made (filled), refusals
              stacked on top (pale). Server-rendered bars - no chart library. */}
          <div className="anon-chart" role="img" aria-label={t("anonUsage.chartLabel")}>
            {days.map((d) => {
              const refused = d.refused_limit + d.refused_full + d.refused_captcha;
              return (
                <div
                  key={d.day}
                  className="anon-bar"
                  title={`${d.day}: ${t("anonUsage.barTitle", {
                    allowed: d.allowed,
                    refused,
                    spend: money(d.spend_usd),
                  })}`}
                >
                  <i className="anon-bar-refused" style={{ height: `${(refused / peak) * 100}%` }} />
                  <i className="anon-bar-allowed" style={{ height: `${(d.allowed / peak) * 100}%` }} />
                  <span>{d.day.slice(8)}</span>
                </div>
              );
            })}
          </div>
          <p className="small">
            <span className="anon-key anon-bar-allowed" /> {t("anonUsage.legendAllowed")}{"  "}
            <span className="anon-key anon-bar-refused" /> {t("anonUsage.legendRefused")}
          </p>

          <h3>{t("anonUsage.recentHeading")}</h3>
          <p className="sub">{t("anonUsage.recentNote")}</p>
          <div className="tablewrap">
            <table>
              <thead>
                <tr>
                  <th>{t("common.when")}</th>
                  <th>{t("anonUsage.seed")}</th>
                  <th>{t("anonUsage.result")}</th>
                  <th>{t("anonUsage.address")}</th>
                  <th>{t("anonUsage.browser")}</th>
                  <th className="num">{t("anonUsage.cost")}</th>
                </tr>
              </thead>
              <tbody>
                {usage.recent.map((r, i) => (
                  <tr key={`${r.created_at}-${i}`}>
                    <td>{when(r.created_at)}</td>
                    <td>{r.seed ?? r.tree_slug ?? "—"}</td>
                    <td>
                      <span className={`pill${r.outcome === "allowed" ? " active" : ""}`}>
                        {t(`anonUsage.outcome.${r.outcome}`)}
                      </span>
                    </td>
                    <td className="mono">{r.ip_code ? `ip·${r.ip_code}` : "—"}</td>
                    <td className="mono">{r.browser_code ? `br·${r.browser_code}` : "—"}</td>
                    <td className="num">{money(r.spend_usd)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
            {usage.recent.length === 0 && <p className="empty">{t("anonUsage.none")}</p>}
          </div>
        </>
      )}
    </>
  );
}
