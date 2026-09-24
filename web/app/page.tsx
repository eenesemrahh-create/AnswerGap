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
import { requestSignIn } from "@/lib/signin-request";
import { marketingPath } from "@/lib/marketing";
import { en as pricingEn } from "@/content/marketing/pricing/en";

/** Ids for the fallback cards, matching what migration 0011 seeds. The
 *  content file carries copy, not ids; `/pricing` uses the same three to
 *  decide whether its comparison table still lines up. */
const FALLBACK_IDS = ["starter", "lite", "pro"] as const;
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
import { ErrorNote } from "@/components/ErrorNote";
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
  const { t, locale } = useI18n();
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
  /* Seconds since the search started, for the waiting panel below.
   *
   * Measured from a TIMESTAMP rather than by incrementing a counter: a
   * background tab has its timers throttled to about once a minute, so a
   * counter would drift and tell somebody who switched away that 4 seconds
   * had passed during a 40-second crawl. */
  const [elapsed, setElapsed] = useState(0);
  useEffect(() => {
    if (!busy) return;
    const started = Date.now();
    setElapsed(0);
    const tick = setInterval(
      () => setElapsed(Math.round((Date.now() - started) / 1000)),
      1000
    );
    return () => clearInterval(tick);
  }, [busy]);
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

  /* Whether the hero shows the product or the pitch.
   *
   * `accounts_enabled === false` is a machine with no database, where the
   * gate allows everything and there is nobody to sign in as - so the box
   * shows, exactly as it did before accounts existed. `meta === null` is the
   * first fetch still in flight, and falls to the pitch; see the comment on
   * the hero for why that is the safe default rather than the search box. */
  const showSearch =
    meta !== null && (!meta.accounts_enabled || meta.role !== "anonymous");

  const submit = async (event: React.FormEvent) => {
    event.preventDefault();
    const term = seed.trim();
    if (!term || busy) return;

    /* Searching needs an account, so ask for one BEFORE spending a request
     * that the gate will refuse anyway.
     *
     * This is courtesy, not enforcement — `gate.decide` refuses a signed-out
     * search on its own and is the only thing standing between a stranger and
     * a DataForSEO bill. What it buys is the difference between a form that
     * fails and a form that explains: the refusal would otherwise land as a
     * sentence under the box with nothing to press.
     *
     * Both conditions matter. `accounts_enabled` false is a machine with no
     * database, where the gate allows everything and a sign-in dialog would
     * be a door to nowhere. A null `meta` is a page whose first fetch has not
     * landed; the request goes, and the server answers for us.
     */
    /* A SECOND LINE OF DEFENCE, not the first one any more: the hero hides
     * the search box entirely while nobody is signed in, so a signed-out
     * reader no longer has a button to press here. It stays because `meta`
     * can go stale - a session that expires while the tab is open leaves the
     * box on screen - and because a form that silently posts a request it
     * knows will be refused is worse than one that says why.
     *
     * SIGN IN rather than sign up, which was a real bug and not a taste.
     * It opened on "Create your AnswerGap account", so somebody who already
     * had one pressed search and got a form demanding an email and a new
     * password - which reads as being sent to reset a password, and is
     * exactly what it was reported as. */
    if (meta?.accounts_enabled && meta.role === "anonymous") {
      requestSignIn({ mode: "signin", reason: t("auth.whySearch") });
      return;
    }

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
          {/* Pricing, Solutions and Contact are PAGES now, not anchors.
              They are server-rendered under `/pricing` and friends, and the
              English URL is the canonical one; the locale segment is added
              here so a Turkish reader lands on the Turkish page rather than
              on English with a picker to find. `aiSeo` still points at a
              section of this page and `blog` still has nowhere to go. */}
          <div className="mkt-nav-links">
            <Link href={marketingPath("pricing", locale)} className="mkt-nav-link">
              {t("market.nav.pricing")}
            </Link>
            <Link href={marketingPath("solutions", locale)} className="mkt-nav-link">
              {t("market.nav.solutions")}
            </Link>
            <a href="#built-for" className="mkt-nav-link">
              {t("market.nav.aiSeo")}
            </a>
            <a href="#" className="mkt-nav-link" aria-disabled>
              {t("market.nav.blog")}
            </a>
            <Link href={marketingPath("contact", locale)} className="mkt-nav-link">
              {t("market.nav.contact")}
            </Link>
          </div>
          <div className="mkt-nav-tools">
            {meta && (
              <AccountMenu
                meta={meta}
                /* Signing in changes what this page IS: the hero swaps the
                   pitch for the search box, and the analyses below stop being
                   the public demos and become the reader's own. Both are keyed
                   on the server's view of the session, so both are refetched
                   rather than guessed at. */
                onSessionChange={() => {
                  fetchMeta().then(setMeta).catch(() => {});
                  fetchTrees().then(setTrees).catch(() => {});
                }}
              />
            )}
            <ThemeToggle />
            <LocalePicker />
          </div>
        </div>
      </nav>

      {/* --- Hero ---------------------------------------------------- */}
      {/* TWO HEROES, and which one shows is the whole shape of this page.
       *
       * Signed out it SELLS: the pill, the headline and two buttons. There is
       * no search box, because searching requires an account and a box that
       * answers every press with a dialog is a promise the page cannot keep.
       *
       * Signed in it WORKS: the box, the market selectors and the saved
       * analyses below. Somebody with credits did not come back for the
       * pitch.
       *
       * While `meta` is still loading, the selling half shows. It is correct
       * for every signed-out visitor and for every crawler, and it is what
       * has to render if the API never answers at all; the cost is that a
       * signed-in reader sees it for the length of one fetch. */}
      <section className="mkt-hero">
        {!showSearch && (
          <>
            <span className="mkt-pill">{t("market.hero.eyebrow")}</span>
            <h1 className="mkt-hero-title">
              {t("market.hero.headlinePre")}
              <br />
              <span>{t("market.hero.headlineHighlight")}</span>
            </h1>
            <p className="mkt-hero-sub">{t("market.hero.sub")}</p>
            <div className="mkt-cta-actions on-light mkt-hero-actions">
              {/* SIGN UP here, unlike the search box's prompt, which opens on
                  sign in. Someone reading the pitch is likelier to be new;
                  someone pressing a search button is likelier to have an
                  account already. */}
              <button
                type="button"
                className="mkt-cta-primary"
                onClick={() =>
                  requestSignIn({ mode: "signup", reason: t("auth.whySearch") })
                }
              >
                {t("market.cta.primary")} <span aria-hidden>→</span>
              </button>
              <Link
                href={marketingPath("pricing", locale)}
                className="mkt-cta-secondary"
              >
                {t("market.cta.secondary")}
              </Link>
            </div>
          </>
        )}

        {showSearch && (
          <>
        <h1 className="mkt-hero-title mkt-hero-title-compact">
          {t("market.hero.signedInTitle")}
        </h1>

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

        {/* A crawl takes 30-60 seconds, and until now the only sign of it was
            a disabled button whose label changed. That is not enough for a
            wait that long: people reload, or press again, or decide it broke.

            NO PERCENTAGE. There is no progress signal to report - one request
            goes to Google and either returns or does not - so a filling bar
            would be an invented number on a screen whose whole argument is
            that it does not invent numbers. The bar is indeterminate and the
            honest measurement sits beside it: how long this has actually been
            running, against how long it usually takes.

            `role="status"` rather than an alert: it is progress, not a
            problem, and a polite live region announces it once without
            interrupting whatever a screen reader was saying. */}
        {busy && (
          <div className="mkt-waiting" role="status" aria-live="polite">
            <span className="mkt-waiting-bar" aria-hidden />
            <p className="mkt-waiting-title">
              {t("market.hero.searching")} &ldquo;{seed.trim()}&rdquo;
            </p>
            <p className="mkt-waiting-hint">{t("landing.searchingHint")}</p>
            {/* Held back for a few seconds: a counter that appears at 0 and
                ticks to 1 draws the eye to the clock before there is anything
                worth knowing. */}
            {elapsed >= 3 && (
              <p className="mkt-waiting-elapsed">
                {t("market.hero.elapsed", { seconds: elapsed })}
              </p>
            )}
          </div>
        )}

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
            {/* A lost connection does NOT mean a lost crawl.
                `live.crawl` saves the tree before it answers, so a reply that
                never arrived - the API restarting mid-request is the way this
                happens - leaves the work done and cached. Retrying then costs
                nothing, because a cache hit has no billable call and
                `gate.credits_for` charges per call. Worth saying, or somebody
                assumes they were charged for a search they never received. */}
            {searchError.kind === "unreachable" && (
              <div style={{ marginTop: 8 }}>{t("error.unreachableRetry")}</div>
            )}
            {searchError.detail && (
              <div style={{ marginTop: 8 }}>
                <code>{searchError.detail}</code>
              </div>
            )}
          </div>
        )}
          </>
        )}
      </section>

      {/* --- Saved analyses (returning users only) ------------------ */}
      {trees && trees.length > 0 && (
        <section className="mkt-saved">
          <div className="mkt-saved-head">
            {/* A signed-out visitor has no analyses of their own. What they
                are shown is the three public demos - by design; see
                `/api/trees` - so calling them "yours" was a small lie that
                only became visible once the hero stopped pretending they
                could search. */}
            <h3>{t(showSearch ? "market.saved.heading" : "market.saved.demoHeading")}</h3>
            <span>{t("market.saved.count", { count: trees.length })}</span>
          </div>
          <div className="mkt-saved-grid">
            {trees.map((tree) => (
              <Link key={tree.slug} href={`/tree/${tree.slug}`} className="card">
                <div className="card-head">
                  <span className="card-title">{tree.seed}</span>
                  {/* Questions, not nodes: the seed is the keyword that was
                      typed, and the status counts beside this bar stopped
                      including it. Passing `node_count` would leave the bar
                      one question short of full for no visible reason. */}
                  <span className="card-count">
                    {t("landing.questionCount", { count: questionsIn(tree) })}
                  </span>
                </div>
                <StatusBar counts={tree.status_counts} total={questionsIn(tree)} />
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
            <ErrorNote error={error} />
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
              {/* The two live links in this column. They are `Link` rather
                  than `<a href="#">` because these are the URLs handed to
                  Stripe onboarding and Google OAuth verification, and a
                  reviewer who lands on the landing page should be able to
                  reach them the same way a customer would. */}
              <li><Link href="/privacy">{t("market.footer.company.privacy")}</Link></li>
              <li><Link href="/terms">{t("market.footer.company.terms")}</Link></li>
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
  const { t, locale } = useI18n();

  /* THE SAME THREE CARDS `/pricing` FALLS BACK TO, from the same file.
   *
   * This section and the pricing page both read `GET /api/pricing`, so in
   * production they already agree: migration 0011 seeded the setting and the
   * admin editor is the one place either of them is changed. What did NOT
   * agree was this fallback - two cards of older copy, from `market.pricing.*`
   * in the message catalogue - so the two surfaces diverged exactly when the
   * API was unreachable and nobody could see why.
   *
   * Imported from the locale FILE rather than the registry: `content/marketing
   * /pricing/index.ts` carries a server-only tripwire, and this is a client
   * component. One English module is ~2 KB in a bundle that already ships five
   * locales of everything else.
   *
   * English, in every locale, and that is the honest trade. It only renders
   * when the API answered with nothing, which in production means it is down -
   * and English cards at the right price beat translated cards at the wrong
   * one. `/pricing/{locale}` still renders fully translated, because it is a
   * server component and can read the whole registry. */
  const fallback: Plan[] = pricingEn.plans.map((plan, i) => ({
    id: FALLBACK_IDS[i],
    enabled: true,
    theme: plan.badge ? "dark" : "light",
    name: plan.name,
    desc: plan.desc,
    price: plan.priceMonthly,
    price_annual: plan.priceAnnual,
    per: plan.per,
    features_heading: plan.featuresHeading,
    features: [...plan.features],
    cta: plan.cta,
    badge: plan.badge,
  }));

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
      {/* The cards are the summary; the page behind this link carries the
          annual rate, the feature-by-feature table and the FAQ. Without it
          the landing is a dead end for anyone actually comparing plans. */}
      <p className="mkt-pricing-more">
        <Link href={marketingPath("pricing", locale)}>
          {t("market.pricing.seeAll")}
        </Link>
      </p>
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
    <div className={`mkt-plan theme-${plan.theme}`}>
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

/** How many QUESTIONS a summary holds. See `tree.count_questions`.
 *
 * A summary carries no node list, so there is nothing to count here when the
 * API predates `question_count` - `node_count` stands in and is one too many.
 * Preferable to rendering nothing: the tally is a headline, not a receipt. */
function questionsIn(tree: TreeSummary): number {
  return tree.question_count ?? tree.node_count;
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
