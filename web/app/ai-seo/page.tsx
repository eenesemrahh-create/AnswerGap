import { AiSeoPage } from "@/components/marketing/AiSeoPage";
import { AI_SEO } from "@/content/marketing/ai-seo";
import { CHROME } from "@/content/marketing/chrome";
import { buildMarketingMetadata } from "@/lib/marketing";

/** `/ai-seo` — English, and the canonical URL. See `/pricing` for the shape. */

export const metadata = buildMarketingMetadata("ai-seo", "en", AI_SEO.en);

export default function AiSeo() {
  return <AiSeoPage content={AI_SEO.en} chrome={CHROME.en} locale="en" />;
}
