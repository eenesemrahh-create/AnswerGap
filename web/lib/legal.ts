import type { Metadata } from "next";
import { LOCALES, LOCALE_TAGS, type Locale } from "@/i18n/types";
import { LEGAL_VARS_INCOMPLETE } from "@/content/legal/blocks";

/**
 * Shared plumbing for the legal routes: where the site lives, what each
 * document's URL is, and the metadata every one of them emits.
 */

export const LEGAL_DOCS = ["terms", "privacy"] as const;
export type LegalDoc = (typeof LEGAL_DOCS)[number];

/**
 * The absolute origin, for canonicals and hreflang.
 *
 * The real domain is the FALLBACK rather than a placeholder, because
 * `NEXT_PUBLIC_*` is baked at build time (`docs/HISTORY.md:461`): an unset
 * variable in the Railway build would otherwise freeze `localhost` into every
 * canonical tag in production, where no runtime fix can reach it.
 */
export const SITE_URL = (
  process.env.NEXT_PUBLIC_SITE_URL || "https://gettopquestions.com"
).replace(/\/$/, "");

export function isLocale(value: string): value is Locale {
  return (LOCALES as readonly string[]).includes(value);
}

/**
 * English lives at `/terms`, the rest at `/terms/tr`.
 *
 * The English URL carries no locale segment because it is the one pasted into
 * the Stripe dashboard and the Google Cloud console, and those want something
 * short and permanent. `/terms/en` redirects here; see `next.config.ts`.
 */
export function legalPath(doc: LegalDoc, locale: Locale): string {
  return locale === "en" ? `/${doc}` : `/${doc}/${locale}`;
}

/**
 * Title, description, canonical and hreflang for one document in one language.
 *
 * `alternates.languages` is what actually tells Google these five pages are
 * translations of each other — NOT `<html lang>`, which this app hard-codes to
 * `en` in the root layout and which the pages therefore set on the document
 * element instead.
 */
export function buildLegalMetadata(
  doc: LegalDoc,
  locale: Locale,
  content: { title: string; description: string }
): Metadata {
  const languages: Record<string, string> = { "x-default": legalPath(doc, "en") };
  for (const l of LOCALES) languages[l] = legalPath(doc, l);

  return {
    title: content.title,
    description: content.description,
    alternates: { canonical: legalPath(doc, locale), languages },
    openGraph: {
      type: "article",
      siteName: "AnswerGap",
      title: content.title,
      description: content.description,
      url: legalPath(doc, locale),
      locale: LOCALE_TAGS[locale].replace("-", "_"),
    },
  };
}

/**
 * Shout during a production build while the company details are placeholders.
 *
 * These pages exist to be read by Stripe's onboarding review and Google's OAuth
 * verification. Shipping one that says «COMPANY NAME» wastes a review round;
 * shipping one where the blank was quietly guessed at would be worse. A build
 * log line is the cheapest place to catch it that does not block local work.
 */
export function warnIfPlaceholders(): void {
  if (LEGAL_VARS_INCOMPLETE && process.env.NODE_ENV === "production") {
    console.warn(
      "[legal] Company details are still placeholders - fill LEGAL_VARS in " +
        "web/content/legal/blocks.ts before giving these URLs to Stripe or Google."
    );
  }
}
