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
  const { hero, heroPrimary, heroSecondary, teams, advantage, workflow, cta } =
    content;

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
              <ul className="mkt-card-bullets">
                {card.bullets.map((bullet) => (
                  <li key={bullet}>{bullet}</li>
                ))}
              </ul>
            </article>
          ))}
        </div>
      </section>

      {/* The dark band. Numbered rather than bulleted, because these three are
          an ORDER and a bullet list would say they are a set. */}
      <section className="mkt-flow">
        <div className="mkt-flow-inner">
          <div className="mkt-flow-pitch">
            <h2 className="mkt-flow-title">
              {workflow.head && <>{workflow.head} </>}
              <span className="mkt-tinted">{workflow.headTinted}</span>
              {/* A space before the tail unless it opens with punctuation.
                  English ends this headline with a bare "." and a space there
                  would float it; Turkish and German end with a word, which
                  without one would jam against the tinted span. The hero can
                  always space because no locale ends it with punctuation
                  alone - here one does. */}
              {workflow.headTail &&
                (/^[.,;:!?]/.test(workflow.headTail) ? (
                  workflow.headTail
                ) : (
                  <> {workflow.headTail}</>
                ))}
            </h2>
            <p>{workflow.lead}</p>
          </div>
          <ol className="mkt-flow-steps">
            {workflow.steps.map((step, i) => (
              <li key={step.title}>
                {/* The number is decoration over a real <ol>: screen readers
                    announce the list's own numbering, so printing it as text
                    as well would say "one, one". */}
                <span className="mkt-flow-num" aria-hidden>
                  {String(i + 1).padStart(2, "0")}
                </span>
                <div>
                  <h3>{step.title}</h3>
                  <p>{step.desc}</p>
                </div>
              </li>
            ))}
          </ol>
        </div>
      </section>

      <section className="mkt-cta mkt-cta-grad">
        <h2 className="mkt-cta-title">{cta.head}</h2>
        <p className="mkt-cta-sub">{cta.lead}</p>
        <div className="mkt-cta-actions">
          <Link href="/?auth=signup" className="mkt-cta-primary">
            {cta.primary} <span aria-hidden>→</span>
          </Link>
          <Link
            href={marketingPath("contact", locale)}
            className="mkt-cta-secondary"
          >
            {cta.secondary}
          </Link>
        </div>
      </section>

      <MarketingFooter chrome={chrome} locale={locale} />
    </div>
  );
}
