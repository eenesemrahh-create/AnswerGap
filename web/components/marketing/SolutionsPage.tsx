import Link from "next/link";
import { MarketingFooter, MarketingNav } from "../MarketingChrome";
import type { ChromeContent } from "@/content/marketing/chrome";
import type { SolutionsContent } from "@/content/marketing/solutions";
import { SessionSwap } from "../SessionTools";
import { InertCta } from "./InertCta";
import { SolutionIcon } from "./SolutionIcon";
import { marketingPath } from "@/lib/marketing";
import { LOCALE_TAGS, type Locale } from "@/i18n/types";

/** One per team card, in the order of `teams.cards`. */
const TEAM_ICONS = [
  "rocket", "zap", "megaphone", "target", "file-text",
  "shopping-bag", "users", "building-2", "earth",
];
const ADVANTAGE_ICONS = ["search", "bot", "layers"];

/**
 * The solutions page, from the Replit design of 2026-11-01. Server-rendered,
 * with ONE client island: the sign-up call to action, which has to know whether
 * the reader already has an account. Everything else is links and text and
 * hydrates nothing.
 *
 * The nine team cards are `<article>` inside a plain grid rather than links:
 * there is no page per team, and nine links to nowhere is the failure mode
 * `LegalDocument` already refused for the landing footer.
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
        <div className="mkt-cta-actions on-light sol-actions">
          <SessionSwap
            signedIn={
              <InertCta className="mkt-cta-primary">{heroPrimary}</InertCta>
            }
          >
            <Link href="/?auth=signup" className="mkt-cta-primary">
              {heroPrimary} <span aria-hidden>→</span>
            </Link>
          </SessionSwap>
          <Link
            href={marketingPath("pricing", locale)}
            className="mkt-cta-secondary"
          >
            {heroSecondary}
          </Link>
        </div>
      </header>

      <div className="sol-band">
        <section className="mkt-section">
          <div className="sol-head">
            <span className="mkt-eyebrow">{teams.eyebrow}</span>
            <h2 className="sol-title">{teams.heading}</h2>
            <p>{teams.lead}</p>
          </div>
          <div className="sol-teams">
            {teams.cards.map((card, i) => (
              <article key={card.title} className="sol-team">
                <div className="sol-team-top">
                  <span className="sol-team-icon">
                    <SolutionIcon name={TEAM_ICONS[i]} />
                  </span>
                  <span className="sol-team-term">{card.term}</span>
                </div>
                <h3>{card.title}</h3>
                <p>{card.desc}</p>
                <dl>
                  <div className="is-question">
                    <dt>{teams.questionLabel}</dt>
                    <dd>{card.question}</dd>
                  </div>
                  <div className="is-idea">
                    <dt>{teams.ideaLabel}</dt>
                    <dd>{card.idea}</dd>
                  </div>
                </dl>
              </article>
            ))}
          </div>
        </section>
      </div>

      <section className="mkt-section">
        <div className="sol-head is-center">
          <span className="mkt-eyebrow">{advantage.eyebrow}</span>
          <h2 className="sol-title">{advantage.heading}</h2>
        </div>
        <div className="sol-advantages">
          {advantage.cards.map((card, i) => (
            <article key={card.title} className="sol-advantage">
              <span className="sol-advantage-icon">
                <SolutionIcon name={ADVANTAGE_ICONS[i]} size={26} />
              </span>
              <h3>{card.title}</h3>
              <p>{card.desc}</p>
              <ul>
                {card.bullets.map((bullet) => (
                  <li key={bullet}>
                    <SolutionIcon name="check" size={18} />
                    {bullet}
                  </li>
                ))}
              </ul>
            </article>
          ))}
        </div>
      </section>

      {/* The dark band. Numbered rather than bulleted, because these three are
          an ORDER and a bullet list would say they are a set. */}
      <section className="mkt-flow sol-flow">
        <div className="mkt-flow-inner">
          <div className="mkt-flow-pitch">
            <span className="sol-flow-icon">
              <SolutionIcon name="chart-column" size={26} />
            </span>
            <h2 className="mkt-flow-title">{workflow.heading}</h2>
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

      <section className="mkt-cta mkt-cta-grad sol-cta">
        <h2 className="mkt-cta-title">{cta.head}</h2>
        <p className="mkt-cta-sub">{cta.lead}</p>
        <div className="mkt-cta-actions sol-actions">
          <SessionSwap
            signedIn={
              <InertCta className="mkt-cta-primary">{cta.primary}</InertCta>
            }
          >
            <Link href="/?auth=signup" className="mkt-cta-primary">
              {cta.primary} <span aria-hidden>→</span>
            </Link>
          </SessionSwap>
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
