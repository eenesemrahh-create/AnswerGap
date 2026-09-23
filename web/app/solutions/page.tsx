import { SolutionsPage } from "@/components/marketing/SolutionsPage";
import { SOLUTIONS } from "@/content/marketing/solutions";
import { CHROME } from "@/content/marketing/chrome";
import { buildMarketingMetadata } from "@/lib/marketing";

/** `/solutions` — English, and the canonical URL. See `/pricing` for the shape. */

export const metadata = buildMarketingMetadata("solutions", "en", SOLUTIONS.en);

export default function Solutions() {
  return <SolutionsPage content={SOLUTIONS.en} chrome={CHROME.en} locale="en" />;
}
