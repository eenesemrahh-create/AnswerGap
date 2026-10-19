import { get } from "@/lib/api";
import { ENV_CATALOG, type EnvVar } from "@/lib/env-catalog";
import { getLocale, translator } from "@/lib/locale";

export const dynamic = "force-dynamic";

/**
 * Every environment variable, what it is for, and whether it is set.
 *
 * NEVER A VALUE. The api answers only "set or not" for its own variables
 * (`GET /api/admin/env`); this panel's own are checked here on its server.
 * The web app's are built into its bundle and cannot be asked from here, so
 * they say so rather than guess.
 */
export default async function EnvPage() {
  const t = await translator();
  const locale = (await getLocale()) === "tr" ? "tr" : "en";

  const apiNames = ENV_CATALOG.filter((v) => v.service === "api").map((v) => v.name);
  const apiSet = await get<{ set: Record<string, boolean> }>(
    `/api/admin/env?names=${encodeURIComponent(apiNames.join(","))}`
  )
    .then((r) => r.set)
    .catch(() => null);

  const status = (v: EnvVar): boolean | null => {
    if (v.service === "api") return apiSet ? Boolean(apiSet[v.name]) : null;
    if (v.service === "admin") return Boolean((process.env[v.name] ?? "").trim());
    return null; // web: baked into another service's build
  };

  const groups = Array.from(new Set(ENV_CATALOG.map((v) => v.group)));

  return (
    <>
      <h1>{t("env.title")}</h1>
      <p className="sub">{t("env.lead")}</p>
      {!apiSet && <p className="notice">{t("env.apiUnavailable")}</p>}

      {groups.map((group) => (
        <section key={group}>
          <h2>{t(`env.group.${group}`)}</h2>
          <div className="tablewrap">
            <table className="env-table">
              <thead>
                <tr>
                  <th>{t("env.name")}</th>
                  <th>{t("env.status")}</th>
                  <th>{t("env.what")}</th>
                  <th>{t("env.missing")}</th>
                </tr>
              </thead>
              <tbody>
                {ENV_CATALOG.filter((v) => v.group === group).map((v) => {
                  const set = status(v);
                  return (
                    <tr key={v.name}>
                      <td>
                        <b className="mono">{v.name}</b>
                        <br />
                        <span className="pill">{t(`env.service.${v.service}`)}</span>{" "}
                        <span className={`pill${v.need === "required" ? " active" : ""}`}>
                          {t(`env.need.${v.need}`)}
                        </span>
                        {v.secret && (
                          <>
                            {" "}
                            <span className="pill warn">{t("env.secret")}</span>
                          </>
                        )}
                      </td>
                      <td>
                        {set === null ? (
                          <span className="env-soft">{t("env.unknown")}</span>
                        ) : set ? (
                          <span className="pill active">{t("env.set")}</span>
                        ) : (
                          <span className={`pill${v.need === "required" ? " warn" : ""}`}>
                            {t("env.notSet")}
                          </span>
                        )}
                      </td>
                      <td>
                        {v.what[locale]}
                        {v.example && (
                          <>
                            <br />
                            <small className="env-soft">
                              {t("env.example")}: <code>{v.example}</code>
                            </small>
                          </>
                        )}
                      </td>
                      <td>{v.missing[locale]}</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </section>
      ))}

      <h2>{t("env.addingHeading")}</h2>
      <p className="sub">{t("env.adding")}</p>
    </>
  );
}
