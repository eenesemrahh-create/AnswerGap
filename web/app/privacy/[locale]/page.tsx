import { notFound } from "next/navigation";
import type { Metadata } from "next";
import { LegalDocument } from "@/components/LegalDocument";
import { PRIVACY } from "@/content/legal/privacy";
import { buildLegalMetadata, isLocale } from "@/lib/legal";
import { LOCALES } from "@/i18n/types";

/** `/privacy/{tr,de,es,fr}`. English lives at `/privacy`; `/privacy/en` redirects. */

export const dynamicParams = false;

export function generateStaticParams() {
  return LOCALES.filter((l) => l !== "en").map((locale) => ({ locale }));
}

type Props = { params: Promise<{ locale: string }> };

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { locale } = await params;
  if (!isLocale(locale) || locale === "en") notFound();
  return buildLegalMetadata("privacy", locale, PRIVACY[locale]);
}

export default async function PrivacyLocalePage({ params }: Props) {
  const { locale } = await params;
  if (!isLocale(locale) || locale === "en") notFound();
  return <LegalDocument doc="privacy" locale={locale} content={PRIVACY[locale]} />;
}
