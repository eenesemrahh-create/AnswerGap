import Link from "next/link";
import { MarketingFooter, MarketingNav } from "../MarketingChrome";
import type { ChromeContent } from "@/content/marketing/chrome";
import type { AiSeoContent } from "@/content/marketing/ai-seo";
import { SessionSwap } from "../SessionTools";
import { InertCta } from "./InertCta";
import { marketingPath } from "@/lib/marketing";
import { LOCALE_TAGS, type Locale } from "@/i18n/types";

/**
 * `/ai-seo`. Server-rendered like every marketing page, with the same single
 * client island as `/solutions`: the sign-up button, which must know whether
 * the reader already has an account.
 *
 * Order is an argument, not a layout: what changed in search (three measured
 * figures), what the product measures about it (with an example the badge
 * marks as one), what to do (the dark band), how to write for it, and then -
 * before any FAQ - what the product does NOT measure. A page about getting
 * cited by AI makes claims about AI; this one states its limits where they
 * will be read rather than in a footnote.
 *
 * The FAQ is also emitted as schema.org FAQPage JSON-LD. A page selling AI
 * search visibility should be readable by the engines it talks about.
 */
export function AiSeoPage({
  content,
  chrome,
  locale,
}: {
  content: AiSeoContent;
  chrome: ChromeContent;
  locale: Locale;
}) {
  const { hero, heroPrimary, heroSecondary, shift, product, playbook, citable, limits, faq, cta } =
    content;

  /* Static content, but still a data-to-script sink: `<` is escaped so no
     string in a translation can close the script element. */
  const faqLd = JSON.stringify({
    "@context": "https://schema.org",
    "@type": "FAQPage",
    inLanguage: LOCALE_TAGS[locale],
    mainEntity: faq.items.map((item) => ({
      "@type": "Question",
      name: item.title,
      acceptedAnswer: { "@type": "Answer", text: item.desc },
    })),
  }).replace(/</g, "\\u003c");

  const startFree = (label: string) => (
    <SessionSwap signedIn={<InertCta className="mkt-cta-primary">{label}</InertCta>}>
      <Link href="/?auth=signup" className="mkt-cta-primary">
        {label} <span aria-hidden>→</span>
      </Link>
    </SessionSwap>
  );

  return (
    <div className="mkt-page" lang={LOCALE_TAGS[locale]}>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: faqLd }} />
      <MarketingNav chrome={chrome} locale={locale} current="ai-seo" />

      <header className="mkt-hero mkt-hero-page">
        {hero.eyebrow && <span className="mkt-pill">{hero.eyebrow}</span>}
        <h1 className="mkt-hero-title">
          {hero.head && <>{hero.head} </>}
          <span className="mkt-tinted">{hero.headTinted}</span>
          {hero.headTail && <> {hero.headTail}</>}
        </h1>
        <p className="mkt-hero-sub">{hero.lead}</p>
        <div className="mkt-cta-actions on-light">
          {startFree(heroPrimary)}
          <a href="#measures" className="mkt-cta-secondary">
            {heroSecondary}
          </a>
        </div>
      </header>

      {/* What changed: the measurement leads, in large type. */}
      <section className="mkt-section">
        <div className="mkt-section-head">
          <p className="mkt-card-label">{shift.eyebrow}</p>
          <h2 className="mkt-section-title">{shift.heading}</h2>
          <p className="mkt-section-sub">{shift.lead}</p>
        </div>
        <div className="aiseo-figures">
          {shift.cards.map((card) => (
            <article key={card.title} className="aiseo-figure">
              <p className="aiseo-figure-num">{card.figure}</p>
              <h3>{card.title}</h3>
              <p>{card.desc}</p>
            </article>
          ))}
        </div>
      </section>

      {/* What the product measures, beside an example of one result. */}
      <section id="measures" className="mkt-section mkt-section-tinted">
        <div className="mkt-split aiseo-split">
          <div>
            <p className="mkt-card-label">{product.eyebrow}</p>
            <h2>{product.heading}</h2>
            <p>{product.lead}</p>
            <ol className="aiseo-points">
              {product.points.map((point) => (
                <li key={point.title}>
                  <h3>{point.title}</h3>
                  <p>{point.desc}</p>
                </li>
              ))}
            </ol>
          </div>

          {/* Status colours here, as on the landing's demo: it IS product
              content. The badge says "Example" because these numbers are not a
              measurement, and the note under it says so in words. */}
          <figure className="mkt-demo aiseo-demo">
            <div className="mkt-demo-head">
              <span className="mkt-demo-dots" aria-hidden>
                <i />
                <i />
                <i />
              </span>
              <span className="aiseo-demo-seed">{product.demo.seed}</span>
              <span className="aiseo-demo-badge">{product.demo.badge}</span>
            </div>
            {product.demo.rows.map((row) => (
              <div key={row.question} className={`mkt-demo-row ${row.status}`}>
                <div className="mkt-demo-q">
                  <b>{row.question}</b>
                  <span className="aiseo-demo-meta">
                    <span className={`aiseo-demo-label ${row.status}`}>{row.label}</span>
                    <span
                      className={`aiseo-dots ${row.status}`}
                      role="img"
                      aria-label={product.demo.pagesLabel
                        .replace("{matching}", String(row.matching))
                        .replace("{checked}", String(row.checked))}
                    >
                      {Array.from({ length: row.checked }, (_, i) => (
                        <i key={i} className={i < row.matching ? "on" : undefined} />
                      ))}
                      <b aria-hidden>
                        {row.matching}/{row.checked}
                      </b>
                    </span>
                    <span className={`aiseo-pill${row.you ? " is-you" : ""}`}>{row.ai}</span>
                  </span>
                </div>
              </div>
            ))}
            <figcaption className="aiseo-demo-note">{product.demo.note}</figcaption>
          </figure>
        </div>
      </section>

      {/* The dark band, four numbered steps. */}
      <section className="mkt-flow">
        <div className="mkt-flow-inner">
          <div className="mkt-flow-pitch">
            <h2 className="mkt-flow-title">
              {playbook.head && <>{playbook.head} </>}
              <span className="mkt-tinted">{playbook.headTinted}</span>
              {playbook.headTail &&
                (/^[.,;:!?]/.test(playbook.headTail) ? (
                  playbook.headTail
                ) : (
                  <> {playbook.headTail}</>
                ))}
            </h2>
            <p>{playbook.lead}</p>
          </div>
          <ol className="mkt-flow-steps">
            {playbook.steps.map((step, i) => (
              <li key={step.title}>
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

      <section className="mkt-section">
        <div className="mkt-section-head">
          <p className="mkt-card-label">{citable.eyebrow}</p>
          <h2 className="mkt-section-title">{citable.heading}</h2>
          <p className="mkt-section-sub">{citable.lead}</p>
        </div>
        <div className="mkt-grid-9 aiseo-grid-6">
          {citable.cards.map((card, i) => (
            <article key={card.title} className="mkt-cell">
              <span className="aiseo-cell-num" aria-hidden>
                {String(i + 1).padStart(2, "0")}
              </span>
              <h3>{card.title}</h3>
              <p>{card.desc}</p>
            </article>
          ))}
        </div>
      </section>

      {/* Limits, before the FAQ and at full width: where they are read. */}
      <section className="mkt-section mkt-section-tinted">
        <div className="mkt-section-head">
          <p className="mkt-card-label">{limits.eyebrow}</p>
          <h2 className="mkt-section-title">{limits.heading}</h2>
          <p className="mkt-section-sub">{limits.lead}</p>
        </div>
        <ul className="aiseo-limits">
          {limits.items.map((item) => (
            <li key={item.title}>
              <h3>{item.title}</h3>
              <p>{item.desc}</p>
            </li>
          ))}
        </ul>
      </section>

      <section className="mkt-section">
        <h2 className="mkt-section-title aiseo-faq-title">{faq.heading}</h2>
        <div className="mkt-faq">
          {faq.items.map((item) => (
            <details key={item.title} className="mkt-faq-item">
              <summary>{item.title}</summary>
              <p>{item.desc}</p>
            </details>
          ))}
        </div>
      </section>

      <section className="mkt-cta mkt-cta-grad">
        <h2 className="mkt-cta-title">{cta.head}</h2>
        <p className="mkt-cta-sub">{cta.lead}</p>
        <div className="mkt-cta-actions">
          {startFree(cta.primary)}
          <Link href={marketingPath("pricing", locale)} className="mkt-cta-secondary">
            {cta.secondary}
          </Link>
        </div>
      </section>

      <MarketingFooter chrome={chrome} locale={locale} />
    </div>
  );
}
