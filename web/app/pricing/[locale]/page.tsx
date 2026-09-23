import { notFound } from "next/navigation";
import type { Metadata } from "next";
import { PricingPage } from "@/components/marketing/PricingPage";
import { PRICING } from "@/content/marketing/pricing";
import { CHROME } from "@/content/marketing/chrome";
import { buildMarketingMetadata } from "@/lib/marketing";
import { isLocale } from "@/lib/legal";
import { contentPlanViews } from "@/lib/pricing-plans";
import { LOCALES } from "@/i18n/types";

/**
 * `/pricing/{tr,de,es,fr}` — the translations.
 *
 * English is excluded because it lives at `/pricing`. `params` is typed by
 * hand rather than with the generated `PageProps` helper, which only exists
 * after `next build` has written `.next/types` and would therefore break
 * `tsc --noEmit` on a fresh clone.
 *
 * THESE DO NOT READ THE ADMIN PANEL, and `/pricing` does. The editor holds
 * one set of strings, so admin cards here would mean English descriptions and
 * English feature bullets under a Turkish headline. The cost is that an
 * operator changing a price in the panel leaves these four showing the old
 * one; `warnIfPricesDrifted` on the English page is what says so out loud.
 * Teaching the admin `Plan` shape about locales is the real fix — CLAUDE.md.
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
  return buildMarketingMetadata("pricing", locale, PRICING[locale]);
}

export default async function PricingLocale({ params }: Props) {
  const { locale } = await params;
  if (!isLocale(locale) || locale === "en") notFound();
  return (
    <PricingPage
      content={PRICING[locale]}
      chrome={CHROME[locale]}
      locale={locale}
      plans={contentPlanViews(PRICING[locale])}
    />
  );
}
