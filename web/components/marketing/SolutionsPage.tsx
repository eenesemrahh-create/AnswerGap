import Link from "next/link";
import { MarketingFooter, MarketingNav } from "../MarketingChrome";
import type { ChromeContent } from "@/content/marketing/chrome";
import type { SolutionsContent } from "@/content/marketing/solutions";
import { marketingPath } from "@/lib/marketing";
import { LOCALE_TAGS, type Locale } from "@/i18n/types";

/**
 * The solutions page. No client code at all — there is nothing here to click
 * except links, so there is nothing to hydrate.
 *
 * The nine team cards are `<article>` inside a plain grid rather than links.
 * The design draws an arrow in each corner, which promises a page per team;
 * those pages do not exist, and nine links to nowhere is the failure mode
 * `LegalDocument` already refused for the landing footer. The arrow is left
 * out with them, so the card does not look broken.
 */
export function SolutionsPage({
  content,
  chrome,
  locale,
}: {
  content: SolutionsContent;
  chrome: ChromeContent;
  locale: Locale;
}) {
  const { hero, heroPrimary, heroSecondary, teams, advantage } = content;

  return (
    <div className="mkt-page" lang={LOCALE_TAGS[locale]}>
      <MarketingNav chrome={chrome} locale={locale} current="solutions" />

      <header className="mkt-hero mkt-hero-page">
        {hero.eyebrow && <span className="mkt-pill">{hero.eyebrow}</span>}
        <h1 className="mkt-hero-title">
          {hero.head && <>{hero.head} </>}
          <span className="mkt-tinted">{hero.headTinted}</span>
          {hero.headTail && <> {hero.headTail}</>}
        </h1>
        <p className="mkt-hero-sub">{hero.lead}</p>
        {/* `on-light`: this hero sits on the page background, not on the dark
            CTA band those button classes were written for. */}
        <div className="mkt-cta-actions on-light">
          <Link href="/?auth=signup" className="mkt-cta-primary">
            {heroPrimary} <span aria-hidden>→</span>
          </Link>
          <Link
            href={marketingPath("pricing", locale)}
            className="mkt-cta-secondary"
          >
            {heroSecondary}
          </Link>
        </div>
      </header>

      <section className="mkt-section">
        <div className="mkt-section-head">
          <p className="mkt-card-label">{teams.eyebrow}</p>
          <h2 className="mkt-section-title">{teams.heading}</h2>
          <p className="mkt-section-sub">{teams.lead}</p>
        </div>
        <div className="mkt-grid-9">
          {teams.cards.map((card) => (
            <article key={card.title} className="mkt-cell">
              <h3>{card.title}</h3>
              <p>{card.desc}</p>
            </article>
          ))}
        </div>
      </section>

      <section className="mkt-section mkt-section-tinted">
        <div className="mkt-section-head">
          <p className="mkt-card-label">{advantage.eyebrow}</p>
          <h2 className="mkt-section-title">{advantage.heading}</h2>
        </div>
        <div className="mkt-cards">
          {advantage.cards.map((card) => (
            <article key={card.title} className="mkt-card">
              <h3 className="mkt-card-title">{card.title}</h3>
              <p className="mkt-card-body">{card.desc}</p>
            </article>
          ))}
        </div>
      </section>

      <MarketingFooter chrome={chrome} locale={locale} />
    </div>
  );
}
