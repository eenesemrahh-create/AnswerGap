import { notFound } from "next/navigation";
import type { Metadata } from "next";
import { LegalDocument } from "@/components/LegalDocument";
import { TERMS } from "@/content/legal/terms";
import { buildLegalMetadata, isLocale } from "@/lib/legal";
import { LOCALES } from "@/i18n/types";

/**
 * `/terms/{tr,de,es,fr}` — the translations.
 *
 * English is excluded because it lives at `/terms`; `/terms/en` 308-redirects
 * there rather than serving the same document at two addresses.
 *
 * `params` is typed by hand rather than with the generated `PageProps` helper:
 * that helper only exists once `next build` or `next typegen` has written
 * `.next/types`, so relying on it makes `tsc --noEmit` fail on a fresh clone.
 */

/** Anything not listed by `generateStaticParams` 404s instead of rendering. */
export const dynamicParams = false;

export function generateStaticParams() {
  return LOCALES.filter((l) => l !== "en").map((locale) => ({ locale }));
}

type Props = { params: Promise<{ locale: string }> };

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { locale } = await params;
  if (!isLocale(locale) || locale === "en") notFound();
  return buildLegalMetadata("terms", locale, TERMS[locale]);
}

export default async function TermsLocalePage({ params }: Props) {
  const { locale } = await params;
  if (!isLocale(locale) || locale === "en") notFound();
  return <LegalDocument doc="terms" locale={locale} content={TERMS[locale]} />;
}
