"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  ApiError,
  fetchCountries,
  fetchLanguages,
  fetchMeta,
  fetchPricing,
  fetchTrees,
  search as runSearch,
} from "@/lib/api";
import {
  STATUSES,
  STATUS_COLOR,
  isDryRun,
  type Country,
  type Meta,
  type Plan,
  type SearchLanguage,
  type Status,
  type TreeSummary,
} from "@/lib/types";
import { useDateFormat, useI18n } from "@/i18n";
import { AccountMenu } from "@/components/AccountMenu";
import { LocalePicker } from "@/components/LocalePicker";
import { ThemeToggle } from "@/components/ThemeToggle";

const MARKET_KEY = "answergap.market";

/**
 * Marketing landing page.
 *
 * Two things share this screen: MARKETING copy (nav, hero pitch, how it works,
 * built for AI search, pricing, CTA, footer) and REAL PRODUCT FEATURES (the
 * search box, the saved-analyses list, the account menu, theme toggle, locale
 * picker). The rule is CLAUDE.md's: never present static data as if it were
 * measured. Everything the reader can act on is wired to the API; everything
 * that is purely landing content is static copy from `market.*`.
 *
 * Layout uses `.mkt-*` classes from globals.css so the old product-shell
 * classes stay untouched - a redesign of `/tree/[slug]` picks its own moment.
 */
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
  // `null` while loading, `[]` when no admin has set plans (falls back to
  // i18n defaults below), non-empty array when the admin has saved something.
  const [plans, setPlans] = useState<Plan[] | null>(null);

  // Search state is kept apart from `error`: a failed crawl must not blank
  // out the saved analyses that are already on screen.
  const [busy, setBusy] = useState(false);
  const [searchError, setSearchError] = useState<ApiError | null>(null);

  // Which market to search. Defaults to the US and is remembered per browser.
  const [locationCode, setLocationCode] = useState<number>(2840);
  const [languageCode, setLanguageCode] = useState<string>("en");

  useEffect(() => {
    /* A related-search chip on a tree page links here with the phrase attached.
     * Read straight off `location` rather than through useSearchParams, which
     * would force a Suspense boundary around the whole landing page for what is
     * an optional prefill. */
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

    fetchCountries().then(setCountries).catch(() => setCountries([]));
    fetchLanguages().then(setLanguages).catch(() => setLanguages([]));
    // Pricing is best-effort marketing content. A failed fetch keeps `plans`
    // at `null`, which the section renders as the i18n fallback below - never
    // as an empty section or a broken card. See `fetchPricing`'s docstring
    // for the same guarantee at the API layer.
    fetchPricing()
      .then(({ plans: fetched }) => setPlans(fetched))
      .catch(() => setPlans([]));
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

  const tryChip = (phrase: string) => {
    setSeed(phrase);
    // Focus the input so the reader can immediately edit or submit.
    const input = document.querySelector<HTMLInputElement>(".mkt-search input");
    input?.focus();
  };

  const scrollToTop = (event: React.MouseEvent) => {
    event.preventDefault();
    window.scrollTo({ top: 0, behavior: "smooth" });
    const input = document.querySelector<HTMLInputElement>(".mkt-search input");
    input?.focus();
  };

  return (
    <div className="mkt-page">
      {/* --- Nav ----------------------------------------------------- */}
      <nav className="mkt-nav">
        <div className="mkt-nav-inner">
          <Link href="/" className="mkt-brand">
            <span className="mkt-brand-tile" aria-hidden>A</span>
            AnswerGap
          </Link>
          <div className="mkt-nav-links">
            <a href="#pricing" className="mkt-nav-link">
              {t("market.nav.pricing")}
            </a>
            <a href="#how-it-works" className="mkt-nav-link">
              {t("market.nav.solutions")}
            </a>
            <a href="#built-for" className="mkt-nav-link">
              {t("market.nav.aiSeo")}
            </a>
            <a href="#" className="mkt-nav-link" aria-disabled>
              {t("market.nav.blog")}
            </a>
            <a href="#" className="mkt-nav-link" aria-disabled>
              {t("market.nav.contact")}
            </a>
          </div>
          <div className="mkt-nav-tools">
            {meta && <AccountMenu meta={meta} />}
            <ThemeToggle />
            <LocalePicker />
          </div>
        </div>
      </nav>

      {/* --- Hero ---------------------------------------------------- */}
      <section className="mkt-hero">
        <span className="mkt-pill">{t("market.hero.eyebrow")}</span>
        <h1 className="mkt-hero-title">
          {t("market.hero.headlinePre")}
          <br />
          <span>{t("market.hero.headlineHighlight")}</span>
        </h1>
        <p className="mkt-hero-sub">{t("market.hero.sub")}</p>

        <form className="mkt-search" onSubmit={submit}>
          <svg
            className="mkt-search-icon"
            aria-hidden
            width="20"
            height="20"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <circle cx="11" cy="11" r="7" />
            <path d="m20 20-3.5-3.5" />
          </svg>
          <input
            value={seed}
            onChange={(e) => setSeed(e.target.value)}
            placeholder={t("market.hero.searchPlaceholder")}
            aria-label={t("market.hero.searchPlaceholder")}
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
            {busy ? t("market.hero.searching") : t("market.hero.searchCta")}
          </button>
        </form>

        <div className="mkt-try">
          <span>{t("market.hero.tryLabel")}</span>
          <button
            type="button"
            className="mkt-try-chip"
            onClick={() => tryChip(t("market.hero.try1"))}
          >
            &ldquo;{t("market.hero.try1")}&rdquo;
          </button>
          <button
            type="button"
            className="mkt-try-chip"
            onClick={() => tryChip(t("market.hero.try2"))}
          >
            &ldquo;{t("market.hero.try2")}&rdquo;
          </button>
        </div>

        {/* Market selectors live below the try-chips - real users need them
            to change country / language, but they should not compete with the
            search bar for above-the-fold attention. */}
        <div className="mkt-hero-market">
          <label>
            <span>{t("landing.country")}:</span>
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
            <span>{t("landing.language")}:</span>
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

        {searchError && (
          <div
            className="error"
            style={{ marginTop: 24, maxWidth: 720, marginLeft: "auto", marginRight: "auto" }}
          >
            <strong>{t(`error.${searchError.kind}`, searchError.values)}</strong>
            {searchError.detail && (
              <div style={{ marginTop: 8 }}>
                <code>{searchError.detail}</code>
              </div>
            )}
          </div>
        )}
      </section>

      {/* --- Saved analyses (returning users only) ------------------ */}
      {trees && trees.length > 0 && (
        <section className="mkt-saved">
          <div className="mkt-saved-head">
            <h3>{t("market.saved.heading")}</h3>
            <span>{t("market.saved.count", { count: trees.length })}</span>
          </div>
          <div className="mkt-saved-grid">
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
        </section>
      )}

      {/* An empty state is only meaningful when we know the API answered but
          returned no rows - `trees` is `null` while loading. */}
      {trees && trees.length === 0 && (
        <section className="mkt-saved">
          <div className="empty-state" style={{ maxWidth: 640, margin: "0 auto" }}>
            <b>{t("landing.emptyTitle")}</b>
            {t("landing.emptyBody")}
          </div>
        </section>
      )}

      {error && (
        <section className="mkt-saved">
          <div className="error" style={{ maxWidth: 720, margin: "0 auto" }}>
            <strong>{t(`error.${error.kind}`, error.values)}</strong>
            <div style={{ marginTop: 8 }}>
              {t("error.startBackend")}
              <br />
              <code>python -m uvicorn api.main:app --reload --port 8000</code>
            </div>
          </div>
        </section>
      )}

      {/* --- How it works ------------------------------------------- */}
      <section id="how-it-works" className="mkt-section">
        <div className="mkt-section-head">
          <span className="mkt-pill accent">{t("market.howItWorks.eyebrow")}</span>
          <h2 className="mkt-section-title">{t("market.howItWorks.title")}</h2>
          <p className="mkt-section-sub">{t("market.howItWorks.sub")}</p>
        </div>
        <div className="mkt-cards">
          <FeatureCard
            label={t("market.howItWorks.card1.label")}
            title={t("market.howItWorks.card1.title")}
            body={t("market.howItWorks.card1.body")}
            icon={<GraphIcon />}
          />
          <FeatureCard
            label={t("market.howItWorks.card2.label")}
            title={t("market.howItWorks.card2.title")}
            body={t("market.howItWorks.card2.body")}
            icon={<ShieldIcon />}
          />
          <FeatureCard
            label={t("market.howItWorks.card3.label")}
            title={t("market.howItWorks.card3.title")}
            body={t("market.howItWorks.card3.body")}
            icon={<TargetIcon />}
          />
        </div>
      </section>

      {/* --- Built for AI Search ------------------------------------ */}
      <section id="built-for" className="mkt-section">
        <div className="mkt-split">
          <div>
            <span className="mkt-pill accent">{t("market.builtFor.eyebrow")}</span>
            <h2>{t("market.builtFor.title")}</h2>
            <p>{t("market.builtFor.body")}</p>
            <ul className="mkt-checks">
              <li>{t("market.builtFor.point1")}</li>
              <li>{t("market.builtFor.point2")}</li>
              <li>{t("market.builtFor.point3")}</li>
            </ul>
          </div>
          <div className="mkt-demo" aria-label="Demo">
            <div className="mkt-demo-head">
              <span className="mkt-demo-dots" aria-hidden>
                <i /><i /><i />
              </span>
              {t("market.builtFor.demoUrl")}
            </div>
            <div className="mkt-demo-row covered">
              <span className="mkt-demo-status" aria-hidden />
              <div className="mkt-demo-q">
                <b>{t("market.builtFor.demo1Q")}</b>
                <span>{t("market.builtFor.demo1Meta")}</span>
              </div>
            </div>
            <div className="mkt-demo-row gap">
              <span className="mkt-demo-status" aria-hidden />
              <div className="mkt-demo-q">
                <b>{t("market.builtFor.demo2Q")}</b>
                <span>{t("market.builtFor.demo2Meta")}</span>
              </div>
            </div>
            <div className="mkt-demo-row weak">
              <span className="mkt-demo-status" aria-hidden />
              <div className="mkt-demo-q">
                <b>{t("market.builtFor.demo3Q")}</b>
                <span>{t("market.builtFor.demo3Meta")}</span>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* --- Pricing ------------------------------------------------- *
       * Dynamic when `plans` is a non-empty array (admin has saved), otherwise
       * renders the two hardcoded i18n defaults so a fresh install with no
       * admin write still has a pricing section in every locale. */}
      <PricingSection plans={plans} onCta={scrollToTop} />


      {/* --- CTA card ------------------------------------------------ */}
      <div className="mkt-cta">
        <h2 className="mkt-cta-title">{t("market.cta.title")}</h2>
        <p className="mkt-cta-sub">{t("market.cta.sub")}</p>
        <div className="mkt-cta-actions">
          <a href="#top" className="mkt-cta-primary" onClick={scrollToTop}>
            {t("market.cta.primary")}
          </a>
          <a href="#pricing" className="mkt-cta-secondary">
            {t("market.cta.secondary")}
          </a>
        </div>
      </div>

      {/* --- Footer -------------------------------------------------- */}
      <footer className="mkt-footer">
        <div className="mkt-footer-inner">
          <div className="mkt-footer-brand">
            <span className="mkt-brand">
              <span className="mkt-brand-tile" aria-hidden>A</span>
              AnswerGap
            </span>
            <p>{t("market.footer.tagline")}</p>
          </div>
          <div className="mkt-footer-col">
            <h4>{t("market.footer.product.heading")}</h4>
            <ul>
              <li><a href="#how-it-works">{t("market.footer.product.features")}</a></li>
              <li><a href="#pricing">{t("market.footer.product.pricing")}</a></li>
              <li><a href="#">{t("market.footer.product.api")}</a></li>
              <li><a href="#">{t("market.footer.product.changelog")}</a></li>
            </ul>
          </div>
          <div className="mkt-footer-col">
            <h4>{t("market.footer.resources.heading")}</h4>
            <ul>
              <li><a href="#">{t("market.footer.resources.blog")}</a></li>
              <li><a href="#">{t("market.footer.resources.seoGuides")}</a></li>
              <li><a href="#">{t("market.footer.resources.helpCenter")}</a></li>
              <li><a href="#">{t("market.footer.resources.community")}</a></li>
            </ul>
          </div>
          <div className="mkt-footer-col">
            <h4>{t("market.footer.company.heading")}</h4>
            <ul>
              <li><a href="#">{t("market.footer.company.about")}</a></li>
              <li><a href="#">{t("market.footer.company.contact")}</a></li>
              <li><a href="#">{t("market.footer.company.privacy")}</a></li>
              <li><a href="#">{t("market.footer.company.terms")}</a></li>
            </ul>
          </div>
        </div>
        <div className="mkt-footer-bottom">
          <span>
            {t("market.footer.copyright", { year: new Date().getFullYear() })}
          </span>
          <span>{t("landing.languageHint")}</span>
        </div>
      </footer>
    </div>
  );
}

/* --------------------------------------------------------- Sub-components */

/**
 * The pricing section, dynamic when the admin has saved plans and falling
 * back to the two i18n-provided defaults otherwise.
 *
 * A NULL `plans` prop means "still loading" - the fallback renders while the
 * fetch is in flight, so a slow API call is visually indistinguishable from
 * an empty setting. An EMPTY `plans` array means "admin has no plans saved
 * yet" - same fallback. A NON-EMPTY array is what the admin last saved and
 * takes precedence over every i18n key.
 *
 * Only ONE of the four items in `market.pricing.*` is used from i18n when
 * the fallback runs - the section title and subtitle. Card contents come
 * from either the fallback definition here (English) or the DB (whatever
 * the admin typed). This is the point where the multi-language landing
 * becomes single-language: once the admin saves plans, all locales render
 * those plans as-typed. Documented in CLAUDE.md.
 */
function PricingSection({
  plans,
  onCta,
}: {
  plans: Plan[] | null;
  onCta: (event: React.MouseEvent) => void;
}) {
  const { t } = useI18n();

  const fallback: Plan[] = [
    {
      id: "starter",
      enabled: true,
      name: t("market.pricing.starter.name"),
      desc: t("market.pricing.starter.desc"),
      price: t("market.pricing.starter.price"),
      per: t("market.pricing.starter.per"),
      features: [
        t("market.pricing.starter.feat1"),
        t("market.pricing.starter.feat2"),
        t("market.pricing.starter.feat3"),
        t("market.pricing.starter.feat4"),
      ],
      cta: t("market.pricing.starter.cta"),
      featured: false,
      badge: null,
    },
    {
      id: "pro",
      enabled: true,
      name: t("market.pricing.pro.name"),
      desc: t("market.pricing.pro.desc"),
      price: t("market.pricing.pro.price"),
      per: t("market.pricing.pro.per"),
      features: [
        t("market.pricing.pro.feat1"),
        t("market.pricing.pro.feat2"),
        t("market.pricing.pro.feat3"),
        t("market.pricing.pro.feat4"),
        t("market.pricing.pro.feat5"),
      ],
      cta: t("market.pricing.pro.cta"),
      featured: true,
      badge: t("market.pricing.pro.badge"),
    },
  ];

  // The publish switch: only cards the admin explicitly enabled travel to the
  // landing. Nothing enabled -> use the localised fallback. This is what lets
  // the admin edit four drafts at once without any of them going live until
  // they are ready.
  const published = plans?.filter((p) => p.enabled) ?? [];
  const list = published.length > 0 ? published : fallback;
  // The grid class carries the count so CSS can pick the right layout without
  // an inline style. `plans-1` centers, `plans-2` matches the current design,
  // `plans-3` fits three across, `plans-4` wraps 2x2 on narrow screens.
  const gridClass = `mkt-plans plans-${list.length}`;

  return (
    <section id="pricing" className="mkt-section">
      <div className="mkt-section-head">
        <h2 className="mkt-section-title">{t("market.pricing.title")}</h2>
        <p className="mkt-section-sub">{t("market.pricing.sub")}</p>
      </div>
      <div className={gridClass}>
        {list.map((plan) => (
          <PlanCard key={plan.id} plan={plan} onCta={onCta} />
        ))}
      </div>
      {(!plans || plans.length === 0) && (
        <p
          style={{
            textAlign: "center",
            marginTop: 32,
            fontSize: 13,
            color: "var(--text-faint)",
          }}
        >
          {t("market.pricing.note")}
        </p>
      )}
    </section>
  );
}

function PlanCard({
  plan,
  onCta,
}: {
  plan: Plan;
  onCta: (event: React.MouseEvent) => void;
}) {
  return (
    <div className={plan.featured ? "mkt-plan featured" : "mkt-plan"}>
      {plan.badge && <span className="mkt-plan-badge">{plan.badge}</span>}
      <h3 className="mkt-plan-name">{plan.name}</h3>
      <p className="mkt-plan-desc">{plan.desc}</p>
      <div className="mkt-plan-price">
        <b>{plan.price}</b>
        <span>{plan.per}</span>
      </div>
      <ul className="mkt-plan-features">
        {plan.features.map((feat, i) => (
          <li key={i}>{feat}</li>
        ))}
      </ul>
      <button type="button" className="mkt-plan-cta" onClick={onCta}>
        {plan.cta}
      </button>
    </div>
  );
}

function FeatureCard({
  label,
  title,
  body,
  icon,
}: {
  label: string;
  title: string;
  body: string;
  icon: React.ReactNode;
}) {
  return (
    <article className="mkt-card">
      <div className="mkt-card-icon">{icon}</div>
      <span className="mkt-card-label">{label}</span>
      <h3 className="mkt-card-title">{title}</h3>
      <p className="mkt-card-body">{body}</p>
    </article>
  );
}

function GraphIcon() {
  return (
    <svg width="22" height="22" viewBox="0 0 24 24" fill="none"
         stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="6" cy="6" r="3" />
      <circle cx="18" cy="18" r="3" />
      <path d="M9 6h5a3 3 0 0 1 3 3v6" />
    </svg>
  );
}

function ShieldIcon() {
  return (
    <svg width="22" height="22" viewBox="0 0 24 24" fill="none"
         stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M12 3 4 6v6c0 5 3.5 8 8 9 4.5-1 8-4 8-9V6l-8-3Z" />
      <path d="m9 12 2 2 4-4" />
    </svg>
  );
}

function TargetIcon() {
  return (
    <svg width="22" height="22" viewBox="0 0 24 24" fill="none"
         stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="12" cy="12" r="9" />
      <circle cx="12" cy="12" r="5" />
      <circle cx="12" cy="12" r="1.5" fill="currentColor" />
    </svg>
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
