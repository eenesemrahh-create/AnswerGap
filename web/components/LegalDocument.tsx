import Link from "next/link";
import { ThemeToggle } from "./ThemeToggle";
import { fill, type Block, type LegalDocumentShape } from "@/content/legal/blocks";
import { LEGAL_DOCS, legalPath, type LegalDoc } from "@/lib/legal";
import { LOCALES, LOCALE_NAMES, LOCALE_TAGS, type Locale } from "@/i18n/types";

/**
 * One legal document, rendered on the server.
 *
 * SERVER-RENDERED IS THE REQUIREMENT, NOT A PREFERENCE. These pages exist so
 * that Stripe's onboarding review and Google's OAuth verification can fetch a
 * URL and read the text. A reviewer's fetcher does not run JavaScript, so a
 * body assembled on the client would render empty to the only two readers who
 * currently matter.
 *
 * It works despite `app/layout.tsx` wrapping everything in the client
 * `I18nProvider`, because a server component passed as `children` crosses that
 * boundary as an already-rendered payload rather than becoming client code.
 *
 * CHROME IS DELIBERATELY THIN. The marketing nav and footer are inlined in
 * `app/page.tsx`, call `t()`, and would therefore be client components reading
 * the reader's stored locale - which would put a German menu around a Turkish
 * contract. Ten of the footer's twelve links are also still `href="#"`, and a
 * row of dead links under a contract a reviewer is reading is worse than no
 * row at all. So this builds its own header and footer with live links only.
 */
export function LegalDocument({
  doc,
  locale,
  content,
}: {
  doc: LegalDoc;
  locale: Locale;
  content: LegalDocumentShape;
}) {
  const other = LEGAL_DOCS.find((d) => d !== doc)!;

  return (
    <div className="mkt-page">
      <nav className="mkt-nav">
        <div className="mkt-nav-inner">
          <Link href="/" className="mkt-brand">
            <span className="mkt-brand-tile" aria-hidden>
              A
            </span>
            AnswerGap
          </Link>
          <div className="mkt-nav-tools">
            <ThemeToggle />
          </div>
        </div>
      </nav>

      {/* `lang` sits HERE rather than on <html>, which the root layout
          hard-codes to "en". `lang` is a global attribute and the nearest
          ancestor wins for its subtree, so screen-reader pronunciation, the
          browser's translate offer and hyphenation are all correct for the
          document even though the shell says English. Language TARGETING for
          search engines is carried by the hreflang tags in the page metadata,
          which is what Google actually reads. */}
      <article className="legal" lang={locale}>
        <header className="legal-head">
          <h1>{content.title}</h1>
          <p className="legal-effective">
            <LastUpdated iso={content.effective} locale={locale} />
          </p>
          <p className="legal-lead">{fill(content.lead)}</p>
          <LocaleLinks doc={doc} current={locale} />
        </header>

        {Object.entries(content.sections).map(([key, section]) => (
          <section key={key}>
            <h2 id={key}>{fill(section.heading)}</h2>
            {section.body.map((block, i) => (
              <BlockView key={i} block={block} />
            ))}
          </section>
        ))}
      </article>

      <footer className="mkt-footer">
        <div className="mkt-footer-bottom">
          <span>© {new Date().getUTCFullYear()} AnswerGap</span>
          <span className="legal-footer-links">
            <Link href={legalPath(other, locale)}>
              {other === "terms" ? "Terms of Service" : "Privacy Policy"}
            </Link>
            <Link href="/">AnswerGap</Link>
          </span>
        </div>
      </footer>
    </div>
  );
}

/** A paragraph, a list, or a line holding one link. Nothing else exists. */
function BlockView({ block }: { block: Block }) {
  if ("p" in block) return <p>{fill(block.p)}</p>;
  if ("ul" in block)
    return (
      <ul>
        {block.ul.map((item, i) => (
          <li key={i}>{fill(item)}</li>
        ))}
      </ul>
    );

  const href = fill(block.link.href);
  // An external or mailto target is a plain anchor; an in-app path gets Link.
  const external = !href.startsWith("/");
  return (
    <p>
      {external ? (
        <a href={href}>{fill(block.link.text)}</a>
      ) : (
        <Link href={href}>{fill(block.link.text)}</Link>
      )}
    </p>
  );
}

/**
 * Formatted on the server with a fixed UTC timezone.
 *
 * `toLocaleDateString` would otherwise read the machine's zone, and a date
 * rendered at build time in one zone and hydrated in another is a hydration
 * mismatch on the one page that must never look broken.
 */
function LastUpdated({ iso, locale }: { iso: string; locale: Locale }) {
  const formatted = new Intl.DateTimeFormat(LOCALE_TAGS[locale], {
    dateStyle: "long",
    timeZone: "UTC",
  }).format(new Date(`${iso}T00:00:00Z`));
  return (
    <>
      <time dateTime={iso}>{formatted}</time>
    </>
  );
}

/**
 * Language switching as LINKS to sibling URLs, never the app's `LocalePicker`.
 *
 * The picker writes `localStorage` and flips a React context - on this page
 * that would change the furniture and leave the contract itself in the old
 * language, because here the language comes from the URL. Links are also the
 * only form a crawler can follow, which is the point of publishing five
 * versions at all.
 */
function LocaleLinks({ doc, current }: { doc: LegalDoc; current: Locale }) {
  return (
    <nav className="legal-langs" aria-label="Language">
      {LOCALES.map((l) => (
        <Link
          key={l}
          href={legalPath(doc, l)}
          hrefLang={l}
          aria-current={l === current ? "page" : undefined}
        >
          {LOCALE_NAMES[l]}
        </Link>
      ))}
    </nav>
  );
}
