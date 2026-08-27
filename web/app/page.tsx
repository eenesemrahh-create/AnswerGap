"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  ApiError,
  fetchCountries,
  fetchLanguages,
  fetchMeta,
  fetchTrees,
  search as runSearch,
} from "@/lib/api";
import {
  STATUSES,
  STATUS_COLOR,
  isDryRun,
  type Country,
  type Meta,
  type SearchLanguage,
  type Status,
  type TreeSummary,
} from "@/lib/types";
import { useDateFormat, useI18n } from "@/i18n";
import { Notice, Rich } from "@/components/Badge";
import { LocalePicker } from "@/components/LocalePicker";

const MARKET_KEY = "answergap.market";

export default function Landing() {
  const { t } = useI18n();
  const formatDate = useDateFormat();
  const router = useRouter();

  const [trees, setTrees] = useState<TreeSummary[] | null>(null);
  const [meta, setMeta] = useState<Meta | null>(null);
  const [countries, setCountries] = useState<Country[]>([]);
  const [languages, setLanguages] = useState<SearchLanguage[]>([]);
  const [error, setError] = useState<ApiError | null>(null);
  const [seed, setSeed] = useState("");

  // Search state is kept apart from `error` above: a failed crawl must not
  // blank out the saved analyses that are already on screen.
  const [busy, setBusy] = useState(false);
  const [searchError, setSearchError] = useState<ApiError | null>(null);

  // Which market to search. Defaults to the US and is remembered per browser.
  const [locationCode, setLocationCode] = useState<number>(2840);
  const [languageCode, setLanguageCode] = useState<string>("en");

  useEffect(() => {
    /* A related-search chip on a tree page links here with the phrase attached.
     * Read straight off `location` rather than through useSearchParams, which
     * would force a Suspense boundary around the whole landing page for what is
     * an optional prefill. This component is client-side either way. */
    const prefill = new URLSearchParams(window.location.search).get("seed");
    if (prefill) setSeed(prefill);

    Promise.all([fetchTrees(), fetchMeta()])
      .then(([treeList, metaData]) => {
        setTrees(treeList);
        setMeta(metaData);
        setLocationCode(metaData.default_location_code);
        setLanguageCode(metaData.default_language_code);
        try {
          const stored = localStorage.getItem(MARKET_KEY);
          if (stored) {
            const parsed = JSON.parse(stored) as {
              location?: number;
              language?: string;
            };
            if (parsed.location) setLocationCode(parsed.location);
            if (parsed.language) setLanguageCode(parsed.language);
          }
        } catch {
          // No stored preference, or storage blocked. Defaults stand.
        }
      })
      .catch((e) =>
        setError(e instanceof ApiError ? e : new ApiError("http", {}))
      );

    // The country list is optional — it needs scripts/fetch_countries.py to
    // have run. Its absence must not blank the whole page.
    fetchCountries().then(setCountries).catch(() => setCountries([]));
    fetchLanguages().then(setLanguages).catch(() => setLanguages([]));
  }, []);

  const submit = async (event: React.FormEvent) => {
    event.preventDefault();
    const term = seed.trim();
    if (!term || busy) return;

    setBusy(true);
    setSearchError(null);
    try {
      const result = await runSearch({
        seed: term,
        location_code: locationCode,
        language_code: languageCode,
      });
      // dry_run is not requested from the UI, so this is defensive only — but
      // narrowing it here is what lets the tree branch stay type-safe.
      if (isDryRun(result)) return;
      router.push(`/tree/${encodeURIComponent(result.slug)}`);
    } catch (e) {
      setSearchError(e instanceof ApiError ? e : new ApiError("http", {}));
      setBusy(false);
    }
  };

  const rememberMarket = (location: number, language: string) => {
    try {
      localStorage.setItem(
        MARKET_KEY,
        JSON.stringify({ location, language })
      );
    } catch {
      // Preference just does not persist.
    }
  };

  return (
    <div className="landing">
      <div className="landing-head">
        <span className="brand">
          Answer<span>Gap</span> <small>{t("brand.prototype")}</small>
        </span>
        <LocalePicker />
      </div>

      <h1>{t("landing.headline")}</h1>
      <p className="tagline">{t("landing.intro")}</p>

      {/* The button is disabled only when a crawl genuinely cannot run — no
          credentials on disk. That is a setup problem, and saying so beats
          letting the user click into a 503. */}
      <form className="form-row" onSubmit={submit}>
        <input
          value={seed}
          onChange={(e) => setSeed(e.target.value)}
          placeholder={t("landing.searchPlaceholder")}
          aria-label={t("landing.searchPlaceholder")}
          disabled={busy}
        />
        <button
          type="submit"
          disabled={busy || !seed.trim() || meta?.live_crawl_available === false}
          title={
            meta?.live_crawl_available === false
              ? t("landing.searchDisabledHint")
              : undefined
          }
        >
          {busy ? t("landing.searching") : t("landing.searchButton")}
        </button>
      </form>

      {busy && <p className="field-hint">{t("landing.searchingHint")}</p>}

      {searchError && (
        <div className="error" style={{ marginTop: 16 }}>
          <strong>{t(`error.${searchError.kind}`, searchError.values)}</strong>
          {searchError.detail && (
            <div style={{ marginTop: 8 }}>
              <code>{searchError.detail}</code>
            </div>
          )}
        </div>
      )}

      <div className="market-row">
        <label>
          <span className="field-label">{t("landing.country")}</span>
          <select
            value={locationCode}
            onChange={(e) => {
              const next = Number(e.target.value);
              setLocationCode(next);
              rememberMarket(next, languageCode);
            }}
          >
            {countries.length === 0 && <option value={2840}>United States</option>}
            {countries.map((country) => (
              <option key={country.code} value={country.code}>
                {country.name}
              </option>
            ))}
          </select>
        </label>
        <label>
          <span className="field-label">{t("landing.language")}</span>
          <select
            value={languageCode}
            onChange={(e) => {
              setLanguageCode(e.target.value);
              rememberMarket(locationCode, e.target.value);
            }}
          >
            {languages.length === 0 && <option value="en">English</option>}
            {languages.map((language) => (
              <option key={language.code} value={language.code}>
                {language.name}
              </option>
            ))}
          </select>
        </label>
      </div>
      <p className="field-hint">{t("landing.languageHint")}</p>

      <Notice>
        <Rich html={t("landing.liveNotice")} />
      </Notice>

      {error && (
        <div className="error" style={{ marginTop: 24 }}>
          <strong>{t(`error.${error.kind}`, error.values)}</strong>
          <div style={{ marginTop: 8 }}>
            {t("error.startBackend")}
            <br />
            <code>python -m uvicorn api.main:app --reload --port 8000</code>
          </div>
        </div>
      )}

      {!error && !trees && <div className="status-text">{t("error.loading")}</div>}

      {trees && (
        <>
          <h3 className="section-label">{t("landing.savedAnalyses")}</h3>
          <div className="card-list">
            {trees.map((tree) => (
              <Link key={tree.slug} href={`/tree/${tree.slug}`} className="card">
                <div className="card-head">
                  <span className="card-title">{tree.seed}</span>
                  <span className="card-count">
                    {t("landing.questionCount", { count: tree.node_count })}
                  </span>
                </div>
                <StatusBar counts={tree.status_counts} total={tree.node_count} />
                <div className="distribution">
                  {STATUSES.map((status) => (
                    <span key={status} className="chip">
                      <i className="dot" style={{ background: STATUS_COLOR[status] }} />
                      {t(`status.${status}`)}
                      <b className="count">{tree.status_counts[status] ?? 0}</b>
                    </span>
                  ))}
                </div>
                <div className="header-sub" style={{ marginTop: 10 }}>
                  <span>{tree.language_name}</span>
                  <span>
                    {t("detail.updated", { date: formatDate(tree.updated_at) })}
                  </span>
                </div>
              </Link>
            ))}
          </div>

          {meta && (
            <p className="note" style={{ marginTop: 22 }}>
              {t("notice.dataNote")}
              <br />
              {t("notice.thresholdNote")}
              <br />
              {t("notice.volumeNote")}
            </p>
          )}
        </>
      )}
    </div>
  );
}

function StatusBar({
  counts,
  total,
}: {
  counts: Record<Status, number>;
  total: number;
}) {
  const { t } = useI18n();
  if (!total) return null;
  return (
    <div
      className="bar"
      role="img"
      aria-label={STATUSES.map(
        (status) => `${t(`status.${status}`)}: ${counts[status] ?? 0}`
      ).join(", ")}
    >
      {STATUSES.map((status) => {
        const value = counts[status] ?? 0;
        if (!value) return null;
        return (
          <i
            key={status}
            className={status}
            style={{ width: `${(value / total) * 100}%` }}
          />
        );
      })}
    </div>
  );
}
