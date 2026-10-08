import Link from "next/link";
import { NavMenu } from "./NavMenu";
import { SessionTools } from "./SessionTools";
import type { ChromeContent } from "@/content/marketing/chrome";
import { marketingPath, type MarketingPage } from "@/lib/marketing";
import { legalPath } from "@/lib/legal";
import type { Locale } from "@/i18n/types";

/**
 * The nav and footer every marketing page wears.
 *
 * SERVER COMPONENTS, and the locale arrives as a prop rather than from `t()`.
 * `LegalDocument` built its own thin header for exactly this reason: the
 * marketing nav inlined in `app/page.tsx` calls `t()`, which reads the locale
 * the CLIENT picked, so reusing it would have wrapped a Turkish page in a
 * German menu. This is that fix made general — the chrome speaks whatever
 * language the page it surrounds does, because it is handed the same content.
 *
 * No theme toggle: theme and language are set on `/account` only.
 *
 * Sign in and Sign up are LINKS to `/?auth=signin|signup`, not buttons. The
 * dialog is mounted by `AccountMenu` on the landing page, and a server page
 * cannot open it; the query parameter is the existing, already-handled way in
 * — the same mechanism `?auth=verifyExpired` and `?reset=` already use.
 */

const LOCALE_TO_TAG: Record<Locale, string> = {
  en: "en",
  de: "de",
  es: "es",
  fr: "fr",
  tr: "tr",
};

export function MarketingNav({
  chrome,
  locale,
  current,
}: {
  chrome: ChromeContent;
  locale: Locale;
  /** Marked `aria-current`, so the reader can see where they are. */
  current: MarketingPage;
}) {
  return (
    <nav className="mkt-nav">
      <div className="mkt-nav-inner">
        <Link href="/" className="mkt-brand">
          <span className="mkt-brand-tile" aria-hidden>
            A
          </span>
          AnswerGap
        </Link>
        {/* `NavMenu` draws these inline while they fit and behind a hamburger
            when they do not. They used to be `display: none` below 820px and a
            scrolling row below 720px, which left the whole menu unreachable in
            the band between - a tablet held upright, or a half-width window.

            An item WITHOUT an `href` renders as text rather than as a link to
            nowhere: `LegalDocument` refused the landing's footer over the same
            thing, and a menu entry that does nothing when clicked reads as a
            broken site rather than as a coming-soon. */}
        <NavMenu
          items={[
            { label: chrome.nav.pricing, href: marketingPath("pricing", locale),
              current: current === "pricing" },
            { label: chrome.nav.solutions, href: marketingPath("solutions", locale),
              current: current === "solutions" },
            { label: chrome.nav.aiSeo, href: marketingPath("ai-seo", locale),
              current: current === "ai-seo" },
            { label: chrome.nav.blog },
            { label: chrome.nav.contact, href: marketingPath("contact", locale),
              current: current === "contact" },
          ]}
        />
        <div className="mkt-nav-tools">
          {/* Wrapped, so a signed-in reader is not invited to create the
              account they already have. `SessionTools` renders these when
              there is no session and the account strip when there is - and
              nothing at all until it knows, rather than guessing and
              correcting itself in front of the reader. */}
          <SessionTools>
          <Link href="/?auth=signin" className="mkt-nav-link">
            {chrome.nav.signIn}
          </Link>
          <Link href="/?auth=signup" className="btn btn-primary mkt-nav-cta">
            {chrome.nav.signUp}
          </Link>
          </SessionTools>
        </div>
      </div>
    </nav>
  );
}

export function MarketingFooter({
  chrome,
  locale,
}: {
  chrome: ChromeContent;
  locale: Locale;
}) {
  const year = new Date().getUTCFullYear();

  return (
    <footer className="mkt-footer">
      <div className="mkt-footer-inner">
        <div className="mkt-footer-brand">
          <span className="mkt-brand">
            <span className="mkt-brand-tile" aria-hidden>
              A
            </span>
            AnswerGap
          </span>
          <p>{chrome.footer.tagline}</p>
        </div>

        <div className="mkt-footer-col">
          <h4>{chrome.footer.product}</h4>
          <ul>
            <li>
              <Link href="/#how-it-works">{chrome.footer.links.features}</Link>
            </li>
            <li>
              <Link href={marketingPath("solutions", locale)}>
                {chrome.footer.links.solutions}
              </Link>
            </li>
            <li>
              <Link href={marketingPath("pricing", locale)}>
                {chrome.footer.links.pricing}
              </Link>
            </li>
            <li>
              <Link href={marketingPath("ai-seo", locale)}>{chrome.nav.aiSeo}</Link>
            </li>
          </ul>
        </div>

        <div className="mkt-footer-col">
          <h4>{chrome.footer.company}</h4>
          <ul>
            <li>
              <Link href={marketingPath("contact", locale)}>
                {chrome.footer.links.contact}
              </Link>
            </li>
            <li>
              <Link href={legalPath("privacy", locale)}>
                {chrome.footer.links.privacy}
              </Link>
            </li>
            <li>
              <Link href={legalPath("terms", locale)}>
                {chrome.footer.links.terms}
              </Link>
            </li>
          </ul>
        </div>
      </div>

      <div className="mkt-footer-bottom">
        <span>© {year} AnswerGap</span>
      </div>
    </footer>
  );
}

/** The `lang` for the page body. See `LegalDocument` for why it is not on `<html>`. */
export function localeTag(locale: Locale): string {
  return LOCALE_TO_TAG[locale];
}
