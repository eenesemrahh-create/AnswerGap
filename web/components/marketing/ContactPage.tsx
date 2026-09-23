import { MarketingFooter, MarketingNav } from "../MarketingChrome";
import { ContactForm } from "./ContactForm";
import type { ChromeContent } from "@/content/marketing/chrome";
import type { ContactContent } from "@/content/marketing/contact";
import { LOCALE_TAGS, type Locale } from "@/i18n/types";

/**
 * The contact page: the pitch on the left, the form on the right.
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
  const { hero, reasons, form } = content;

  return (
    <div className="mkt-page" lang={LOCALE_TAGS[locale]}>
      <MarketingNav chrome={chrome} locale={locale} current="contact" />

      <section className="mkt-section mkt-contact">
        <div className="mkt-contact-pitch">
          {hero.eyebrow && <span className="mkt-pill">{hero.eyebrow}</span>}
          <h1 className="mkt-hero-title mkt-contact-title">
            {hero.head && <>{hero.head} </>}
            <span className="mkt-tinted">{hero.headTinted}</span>
            {hero.headTail && <> {hero.headTail}</>}
          </h1>
          <p className="mkt-section-sub">{hero.lead}</p>

          <ul className="mkt-reasons">
            {reasons.map((reason) => (
              <li key={reason.title}>
                <h2>{reason.title}</h2>
                <p>{reason.desc}</p>
              </li>
            ))}
          </ul>
        </div>

        <div className="mkt-contact-form">
          <ContactForm form={form} />
        </div>
      </section>

      <MarketingFooter chrome={chrome} locale={locale} />
    </div>
  );
}
