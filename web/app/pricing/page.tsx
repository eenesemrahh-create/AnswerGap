import { PricingPage } from "@/components/marketing/PricingPage";
import { PRICING } from "@/content/marketing/pricing";
import { CHROME } from "@/content/marketing/chrome";
import { buildMarketingMetadata } from "@/lib/marketing";

/**
 * `/pricing` — English, and the canonical URL of the page.
 *
 * The four translations live one segment deeper at `/pricing/{locale}`, and
 * `/pricing/en` 308-redirects here so the English page has exactly one
 * address. Same arrangement as `/terms`; see `lib/marketing.ts`.
 */

export const metadata = buildMarketingMetadata("pricing", "en", PRICING.en);

export default function Pricing() {
  return <PricingPage content={PRICING.en} chrome={CHROME.en} locale="en" />;
}
