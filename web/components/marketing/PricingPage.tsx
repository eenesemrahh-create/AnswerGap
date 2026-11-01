import Link from "next/link";
import { MarketingFooter, MarketingNav } from "../MarketingChrome";
import { PricingCycle } from "./PricingCycle";
import type { ChromeContent } from "@/content/marketing/chrome";
import type { PricingContent } from "@/content/marketing/pricing";
import type { PlanView } from "@/lib/pricing-plans";
import { SessionSwap } from "../SessionTools";
import { marketingPath } from "@/lib/marketing";
import { LOCALE_TAGS, type Locale } from "@/i18n/types";

/**
 * The pricing page, rendered on the server.
 *
 * THE PRICES HERE ARE HARDCODED, and the landing page's `#pricing` section is
 * NOT: it reads plans an admin saved through `/settings/pricing`. Two pricing
 * surfaces fed from two places can disagree, and the first person to notice
 * will be a customer. That was raised and this shape was chosen deliberately;
 * it is written down in CLAUDE.md as the debt it is, and the fix is to teach
 * the admin shape the fields this page needs — an annual price, the credit
 * count, and the comparison rows — rather than to copy numbers by hand.
 *
 * `<details>` carries the FAQ rather than a click handler. It opens without
 * JavaScript, it is announced correctly by screen readers with no ARIA to get
 * wrong, and the answers are in the HTML whether or not anyone expands them —
 * which is what a crawler reads. Sharing a `name` makes the browser keep one
 * of them open at a time, still with no script.
 */
export function PricingPage({
  content,
  chrome,
  locale,
  plans,
  showCompare = true,
}: {
  content: PricingContent;
  chrome: ChromeContent;
  locale: Locale;
  /** The cards to draw. From the admin panel on `/pricing`, from `content`
   *  on the four translations. See `lib/pricing-plans.ts`. */
  plans: PlanView[];
  /** False when the cards no longer line up with the comparison table's
   *  three-tuples - an operator reordered or added one. A table that labels
   *  the wrong column is worse than no table. */
  showCompare?: boolean;
}) {
  const { hero, billing, compare, guide, faq, cta } = content;

  return (
    <div className="mkt-page" lang={LOCALE_TAGS[locale]}>
      <MarketingNav chrome={chrome} locale={locale} current="pricing" />

      <header className="mkt-hero mkt-hero-page">
        {hero.eyebrow && <span className="mkt-pill">{hero.eyebrow}</span>}
        <h1 className="mkt-hero-title">
          {hero.head && <>{hero.head} </>}
          <span className="mkt-tinted">{hero.headTinted}</span>
          {hero.headTail && <> {hero.headTail}</>}
        </h1>
        <p className="mkt-hero-sub">{hero.lead}</p>
      </header>

      <PricingCycle
        monthly={billing.monthly}
        annually={billing.annually}
        save={billing.save}
      >
        {/* `plans-3` is what actually sets the three columns - the landing
            picks `plans-1|2|3` from however many cards an admin published,
            and this page always has three. */}
        <section className="mkt-plans mkt-plans-home plans-3 mkt-plans-page">
          {/* `theme-*` are the same classes the landing's admin-driven cards
              use, so both pricing surfaces look the same. The value comes from
              the admin panel when the cards do, and is derived from the badge
              when they come from a content file - see `contentPlanViews`. */}
          {plans.map((plan) => (
            <article key={plan.name} className={`mkt-plan theme-${plan.theme}`}>
              {plan.badge && <span className="mkt-plan-badge">{plan.badge}</span>}
              <h2 className="mkt-plan-name">{plan.name}</h2>
              <p className="mkt-plan-desc">{plan.desc}</p>

              {/* Both prices ship; CSS shows the one the switch selected. */}
              <p className="mkt-plan-price">
                <b className="mkt-price-monthly">{plan.priceMonthly}</b>
                <b className="mkt-price-annual">{plan.priceAnnual}</b>
                <span>{plan.per}</span>
              </p>
              <p className="mkt-plan-cycle">
                <span className="mkt-price-monthly">{billing.billedMonthly}</span>
                <span className="mkt-price-annual">{billing.billedAnnually}</span>
              </p>

              <SessionSwap
            signedIn={
              <Link href="/account/subscription" className="mkt-plan-cta">{plan.cta}</Link>
            }
          >
            <Link href="/?auth=signup" className="mkt-plan-cta">
                {plan.cta}
              </Link>
          </SessionSwap>

              {/* Optional: an admin card saved before this field existed has
                  none, and a blank caption would leave a gap above the list. */}
              {plan.featuresHeading && (
                <p className="mkt-plan-featlabel">{plan.featuresHeading}</p>
              )}
              <ul className="mkt-plan-features">
                {plan.features.map((feature) => (
                  <li key={feature}>{feature}</li>
                ))}
              </ul>

              <div className="mkt-plan-foot">
                <span>{billing.signUpNow}</span>
                <SessionSwap
                  signedIn={
                    <Link href="/account/subscription" className="mkt-plan-pay">
                      <PlanPrice plan={plan} />
                    </Link>
                  }
                >
                  <Link href="/?auth=signup" className="mkt-plan-pay">
                    <PlanPrice plan={plan} />
                  </Link>
                </SessionSwap>
                <small>{billing.plusTax}</small>
              </div>
            </article>
          ))}
        </section>

        <section className="mkt-section">
          <span className="mkt-eyebrow">{guide.eyebrow}</span>
          <h2 className="mkt-lead-title">{guide.title}</h2>
          <p className="mkt-guide-lead">{guide.lead}</p>
          <div className="mkt-guide-grid">
            {guide.cards.map((card) => (
              <article key={card.name} className="mkt-guide-card">
                <h3>{card.name}</h3>
                <p className="mkt-guide-choose">{card.choose}</p>
                <ul>
                  {card.points.map((point) => (
                    <li key={point}>{point}</li>
                  ))}
                </ul>
                <p className="mkt-guide-next">{card.next}</p>
              </article>
            ))}
          </div>
          <p className="mkt-guide-estimate">
            <b>{guide.estimateLabel}</b> {guide.estimate}
          </p>
        </section>

        {showCompare && (
        <section className="mkt-section">
          <h2 className="mkt-section-title">{compare.heading}</h2>
          <div className="mkt-compare-wrap">
            <table className="mkt-compare">
              <thead>
                <tr>
                  <th scope="col">{compare.featureColumn}</th>
                  {plans.map((plan) => (
                    <th key={plan.name} scope="col">
                      {plan.name}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                <tr className="mkt-compare-group">
                  <th scope="rowgroup" colSpan={4}>
                    {compare.groupHeading}
                  </th>
                </tr>
                {compare.rows.map((row) => (
                  <tr key={row.label}>
                    <th scope="row">{row.label}</th>
                    {row.values.map((value, i) => (
                      <td key={plans[i].name}>
                        {typeof value === "string" ? (
                          value
                        ) : value ? (
                          /* A tick with a label, not a bare glyph: the cell has
                             to mean something when it is read out rather than
                             looked at. The dash for `false` is the same idea -
                             and it is a dash rather than a cross because the
                             table lists what a plan includes, and a cross reads
                             as a warning about something taken away. */
                          <span className="mkt-tick" role="img" aria-label="yes">
                            ✓
                          </span>
                        ) : (
                          <span className="mkt-dash" role="img" aria-label="no">
                            –
                          </span>
                        )}
                      </td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>
        )}
      </PricingCycle>

      <section className="mkt-section">
        <div className="mkt-faq">
          <h2 className="mkt-faq-title mkt-faq-centered">{faq.heading}</h2>
          {faq.items.map((item) => (
            <details key={item.title} name="pricing-faq" className="mkt-faq-item">
              <summary>{item.title}</summary>
              <p>{item.desc}</p>
            </details>
          ))}
        </div>
      </section>

      <section className="mkt-cta mkt-cta-soft">
        <h2 className="mkt-cta-title">{cta.heading}</h2>
        <p className="mkt-cta-sub">{cta.lead}</p>
        <div className="mkt-cta-actions">
          <SessionSwap
            signedIn={
              <Link href="/account/subscription" className="mkt-cta-primary">{cta.primary}</Link>
            }
          >
            <Link href="/?auth=signup" className="mkt-cta-primary">
            {cta.primary}
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

/** Both ship and CSS shows the selected cycle's, as on the card's big price. */
function PlanPrice({ plan }: { plan: PlanView }) {
  return (
    <>
      <span className="mkt-price-monthly">{plan.priceMonthly}</span>
      <span className="mkt-price-annual">{plan.priceAnnual}</span>
      {plan.per}
    </>
  );
}
