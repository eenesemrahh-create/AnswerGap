import Link from "next/link";
import { NavMenu } from "./NavMenu";
import { SessionTools } from "./SessionTools";
import { CreditStrip } from "./CreditStrip";
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
  /** Marked `aria-current`, so the reader can see where they are. Absent on
   *  pages that are not in the menu (the legal documents). */
  current?: MarketingPage;
}) {
  return (
    <>
    <nav className="mkt-nav">
      <div className="mkt-nav-inner">
        <Link href="/" className="mkt-brand">
          <span className="mkt-brand-tile" aria-hidden>
            G
          </span>
          GetTopQuestions
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
          <Link href="/?auth=signin" className="mkt-nav-link nav-signin">
            {chrome.nav.signIn}
          </Link>
          <Link href="/?auth=signup" className="nav-signup mkt-nav-cta">
            {chrome.nav.signUp}
          </Link>
          </SessionTools>
        </div>
      </div>
    </nav>
    {/* Credits and plan period, as under the landing's nav: the same strip
        on every page a signed-in reader can reach. Draws nothing for anybody
        else, so the server HTML a crawler reads is unchanged. */}
    <CreditStrip />
    </>
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
              G
            </span>
            GetTopQuestions
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
              <span>{chrome.footer.links.api}</span>
            </li>
            <li>
              <span>{chrome.footer.links.changelog}</span>
            </li>
          </ul>
        </div>

        <div className="mkt-footer-col">
          <h4>{chrome.footer.resources}</h4>
          <ul>
            <li>
              <span>{chrome.footer.links.blog}</span>
            </li>
            <li>
              <span>{chrome.footer.links.seoGuides}</span>
            </li>
            <li>
              <span>{chrome.footer.links.helpCenter}</span>
            </li>
            <li>
              <span>{chrome.footer.links.community}</span>
            </li>
          </ul>
        </div>

        <div className="mkt-footer-col">
          <h4>{chrome.footer.company}</h4>
          <ul>
            <li>
              <span>{chrome.footer.links.about}</span>
            </li>
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
        <span>
          © {year} GetTopQuestions. {chrome.footer.rights}
        </span>
        {/* Marks only until the accounts exist: see the nav's rule on an item
            with nowhere to go. */}
        <span className="mkt-footer-social">
          <span role="img" aria-label="Twitter">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor" aria-hidden>
              <path d="M18.9 2H22l-6.8 7.8L23.2 22h-6.3l-4.9-6.4L6.3 22H3.2l7.3-8.3L2.8 2h6.4l4.4 5.9zm-1.1 18h1.7L8.3 3.9H6.4z" />
            </svg>
          </span>
          <span role="img" aria-label="GitHub">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor" aria-hidden>
              <path d="M12 2a10 10 0 0 0-3.2 19.5c.5.1.7-.2.7-.5v-1.7c-2.8.6-3.4-1.3-3.4-1.3-.5-1.2-1.1-1.5-1.1-1.5-.9-.6.1-.6.1-.6 1 .1 1.5 1 1.5 1 .9 1.5 2.3 1.1 2.9.8.1-.6.3-1.1.6-1.4-2.2-.2-4.6-1.1-4.6-5a3.9 3.9 0 0 1 1-2.7c-.1-.3-.4-1.3.1-2.7 0 0 .8-.3 2.8 1a9.600 9.600 0 0 1 5 0c1.900-1.300 2.800-1 2.800-1 .5 1.400.2 2.400.1 2.700a3.900 3.900 0 0 1 1 2.700c0 3.900-2.300 4.800-4.600 5 .4.300.7.900.7 1.900V21c0 .3.200.6.700.5A10 10 0 0 0 12 2z" />
            </svg>
          </span>
        </span>
      </div>
    </footer>
  );
}

/** The `lang` for the page body. See `LegalDocument` for why it is not on `<html>`. */
export function localeTag(locale: Locale): string {
  return LOCALE_TO_TAG[locale];
}
