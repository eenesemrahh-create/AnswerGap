import type { Metadata } from "next";
import { LOCALES, LOCALE_TAGS, type Locale } from "@/i18n/types";
import { SITE_URL } from "@/lib/legal";

/**
 * Shared plumbing for the marketing routes: what each page's URL is, and the
 * metadata every one of them emits.
 *
 * Deliberately the same shape as `lib/legal.ts`, down to reusing its
 * `SITE_URL` rather than reading the environment again — one origin, read in
 * one place, with the one comment explaining why the real domain is the
 * fallback rather than a placeholder.
 *
 * The difference is `openGraph.type`: a contract is an `article`, a pricing
 * page is a `website`.
 */

export const MARKETING_PAGES = ["pricing", "solutions", "contact"] as const;
export type MarketingPage = (typeof MARKETING_PAGES)[number];

export function isMarketingPage(value: string): value is MarketingPage {
  return (MARKETING_PAGES as readonly string[]).includes(value);
}

/**
 * English lives at `/pricing`, the rest at `/pricing/tr`.
 *
 * Same rule as the legal pages, for a different reason: those needed a short
 * permanent address to paste into a dashboard, these need one because it is
 * the URL that gets linked to and shared. `/pricing/en` redirects to `/pricing`
 * so there is only ever one canonical English address; see `next.config.ts`.
 */
export function marketingPath(page: MarketingPage, locale: Locale): string {
  return locale === "en" ? `/${page}` : `/${page}/${locale}`;
}

/**
 * Title, description, canonical and hreflang for one page in one language.
 *
 * `alternates.languages` is what tells Google these five pages are
 * translations of each other. It matters more here than on the legal pages:
 * those are read by two reviewers, these are the pages the product wants
 * ranked.
 */
export function buildMarketingMetadata(
  page: MarketingPage,
  locale: Locale,
  content: { title: string; description: string }
): Metadata {
  const languages: Record<string, string> = {
    "x-default": marketingPath(page, "en"),
  };
  for (const l of LOCALES) languages[l] = marketingPath(page, l);

  return {
    title: content.title,
    description: content.description,
    alternates: { canonical: marketingPath(page, locale), languages },
    openGraph: {
      type: "website",
      siteName: "AnswerGap",
      title: content.title,
      description: content.description,
      url: `${SITE_URL}${marketingPath(page, locale)}`,
      locale: LOCALE_TAGS[locale].replace("-", "_"),
    },
  };
}
