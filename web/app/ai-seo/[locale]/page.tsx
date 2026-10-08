import { notFound } from "next/navigation";
import type { Metadata } from "next";
import { AiSeoPage } from "@/components/marketing/AiSeoPage";
import { AI_SEO } from "@/content/marketing/ai-seo";
import { CHROME } from "@/content/marketing/chrome";
import { buildMarketingMetadata } from "@/lib/marketing";
import { isLocale } from "@/lib/legal";
import { LOCALES } from "@/i18n/types";

/** `/ai-seo/{tr,de,es,fr}`. English lives at `/ai-seo`. */

export const dynamicParams = false;

export function generateStaticParams() {
  return LOCALES.filter((l) => l !== "en").map((locale) => ({ locale }));
}

type Props = { params: Promise<{ locale: string }> };

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { locale } = await params;
  if (!isLocale(locale) || locale === "en") notFound();
  return buildMarketingMetadata("ai-seo", locale, AI_SEO[locale]);
}

export default async function AiSeoLocale({ params }: Props) {
  const { locale } = await params;
  if (!isLocale(locale) || locale === "en") notFound();
  return (
    <AiSeoPage
      content={AI_SEO[locale]}
      chrome={CHROME[locale]}
      locale={locale}
    />
  );
}
