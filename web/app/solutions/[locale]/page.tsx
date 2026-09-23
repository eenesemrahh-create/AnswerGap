import { notFound } from "next/navigation";
import type { Metadata } from "next";
import { SolutionsPage } from "@/components/marketing/SolutionsPage";
import { SOLUTIONS } from "@/content/marketing/solutions";
import { CHROME } from "@/content/marketing/chrome";
import { buildMarketingMetadata } from "@/lib/marketing";
import { isLocale } from "@/lib/legal";
import { LOCALES } from "@/i18n/types";

/** `/solutions/{tr,de,es,fr}`. English lives at `/solutions`. */

export const dynamicParams = false;

export function generateStaticParams() {
  return LOCALES.filter((l) => l !== "en").map((locale) => ({ locale }));
}

type Props = { params: Promise<{ locale: string }> };

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { locale } = await params;
  if (!isLocale(locale) || locale === "en") notFound();
  return buildMarketingMetadata("solutions", locale, SOLUTIONS[locale]);
}

export default async function SolutionsLocale({ params }: Props) {
  const { locale } = await params;
  if (!isLocale(locale) || locale === "en") notFound();
  return (
    <SolutionsPage
      content={SOLUTIONS[locale]}
      chrome={CHROME[locale]}
      locale={locale}
    />
  );
}
