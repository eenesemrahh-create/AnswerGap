import { notFound } from "next/navigation";
import type { Metadata } from "next";
import { ContactPage } from "@/components/marketing/ContactPage";
import { CONTACT } from "@/content/marketing/contact";
import { CHROME } from "@/content/marketing/chrome";
import { buildMarketingMetadata } from "@/lib/marketing";
import { isLocale } from "@/lib/legal";
import { LOCALES } from "@/i18n/types";

/** `/contact/{tr,de,es,fr}`. English lives at `/contact`. */

export const dynamicParams = false;

export function generateStaticParams() {
  return LOCALES.filter((l) => l !== "en").map((locale) => ({ locale }));
}

type Props = { params: Promise<{ locale: string }> };

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { locale } = await params;
  if (!isLocale(locale) || locale === "en") notFound();
  return buildMarketingMetadata("contact", locale, CONTACT[locale]);
}

export default async function ContactLocale({ params }: Props) {
  const { locale } = await params;
  if (!isLocale(locale) || locale === "en") notFound();
  return (
    <ContactPage
      content={CONTACT[locale]}
      chrome={CHROME[locale]}
      locale={locale}
    />
  );
}
