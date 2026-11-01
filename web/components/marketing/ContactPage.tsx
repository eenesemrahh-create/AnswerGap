import Link from "next/link";
import { MarketingFooter, MarketingNav } from "../MarketingChrome";
import { ContactForm } from "./ContactForm";
import { SolutionIcon } from "./SolutionIcon";
import type { ChromeContent } from "@/content/marketing/chrome";
import type { ContactContent } from "@/content/marketing/contact";
import { marketingPath } from "@/lib/marketing";
import { LOCALE_TAGS, type Locale } from "@/i18n/types";

/** One per reason, in the order of `reasons`. */
const REASON_ICONS = ["building-2", "messages-square", "lightbulb"];

/**
 * The contact page, from the Replit design of 2026-11-01: the pitch on the
 * left, the form on the right.
 *
 * Only the form is a client island, and it is handed the translated labels as
 * props — see `ContactForm` for why it must not call `t()` here.
 */
export function ContactPage({
  content,
  chrome,
  locale,
}: {
  content: ContactContent;
  chrome: ChromeContent;
  locale: Locale;
}) {
  const { hero, reasons, before, form } = content;

  return (
    <div className="mkt-page" lang={LOCALE_TAGS[locale]}>
      <MarketingNav chrome={chrome} locale={locale} current="contact" />

      <section className="mkt-section mkt-contact">
        <div className="mkt-contact-pitch">
          <div>
            {hero.eyebrow && <span className="mkt-pill ctc-pill">{hero.eyebrow}</span>}
            <h1 className="mkt-hero-title mkt-contact-title ctc-title">
              {hero.head && <>{hero.head} </>}
              <span className="mkt-tinted">{hero.headTinted}</span>
              {/* No space before a tail that opens with punctuation: English
                  continues "? Ask us." straight after the name. */}
              {/^[?.,!]/.test(hero.headTail) ? hero.headTail : <> {hero.headTail.trimStart()}</>}
            </h1>
            <p className="mkt-section-sub">{hero.lead}</p>
          </div>

          <ul className="ctc-reasons">
            {reasons.map((reason, i) => (
              <li key={reason.title}>
                <span className="ctc-reason-icon">
                  <SolutionIcon name={REASON_ICONS[i]} size={24} />
                </span>
                <div>
                  <h2>{reason.title}</h2>
                  <p>{reason.desc}</p>
                </div>
              </li>
            ))}
          </ul>

          <div className="ctc-before">
            <div className="ctc-before-head">
              <SolutionIcon name="clipboard-list" size={20} />
              <h2>{before.heading}</h2>
            </div>
            <p>{before.intro}</p>
            <ul>
              {before.items.map((item) => (
                <li key={item}>{item}</li>
              ))}
            </ul>
            <p className="ctc-before-links">
              {before.pricingLead}
              <Link href={marketingPath("pricing", locale)}>{before.pricingLink}</Link>
              {before.pricingTail}
              {before.solutionsLead}
              <Link href={marketingPath("solutions", locale)}>{before.solutionsLink}</Link>
              {before.solutionsTail}
            </p>
          </div>
        </div>

        <div className="mkt-contact-form">
          <ContactForm form={form} />
        </div>
      </section>

      <MarketingFooter chrome={chrome} locale={locale} />
    </div>
  );
}
