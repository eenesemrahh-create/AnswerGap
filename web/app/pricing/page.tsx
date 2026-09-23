import { PricingPage } from "@/components/marketing/PricingPage";
import { PRICING } from "@/content/marketing/pricing";
import { CHROME } from "@/content/marketing/chrome";
import { buildMarketingMetadata } from "@/lib/marketing";
import {
  contentPlanViews,
  fetchAdminPlans,
  plansMatchTable,
  toPlanViews,
  warnIfPricesDrifted,
} from "@/lib/pricing-plans";

/**
 * `/pricing` — English, the canonical URL, and the ONE pricing page wired to
 * the admin panel.
 *
 * The cards come from `GET /api/pricing`, which reads the same
 * `app_setting.pricing_plans` the editor at `/settings/pricing` writes;
 * migration 0011 seeded it, so a fresh deployment has the three cards without
 * anyone typing them. When the API cannot be reached — it is a separate
 * Railway service, and the web app builds on its own — the content file
 * stands in, which is also what every locale but this one renders.
 *
 * `revalidate` rather than `no-store`: an operator changing a price should
 * see it within five minutes, and the page must stay static HTML in between
 * for the crawlers it exists for.
 */

export const revalidate = 300;

export const metadata = buildMarketingMetadata("pricing", "en", PRICING.en);

export default async function Pricing() {
  const admin = await fetchAdminPlans();
  if (admin) warnIfPricesDrifted(admin, PRICING.en);

  return (
    <PricingPage
      content={PRICING.en}
      chrome={CHROME.en}
      locale="en"
      plans={admin ? toPlanViews(admin) : contentPlanViews(PRICING.en)}
      showCompare={admin ? plansMatchTable(admin) : true}
    />
  );
}
