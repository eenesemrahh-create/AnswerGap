import { LegalDocument } from "@/components/LegalDocument";
import { TERMS } from "@/content/legal/terms";
import { buildLegalMetadata, warnIfPlaceholders } from "@/lib/legal";

/**
 * `/terms` — the English terms, and the canonical URL of the document.
 *
 * Short and permanent on purpose: this is the address pasted into the Stripe
 * dashboard. The four translations live one segment deeper at `/terms/{locale}`
 * and `/terms/en` redirects here (see `next.config.ts`).
 *
 * A server component, so `metadata` can be exported and — the point of the
 * whole exercise — the text is in the HTML a reviewer's fetcher receives.
 */

export const metadata = buildLegalMetadata("terms", "en", TERMS.en);

export default function TermsPage() {
  warnIfPlaceholders();
  return <LegalDocument doc="terms" locale="en" content={TERMS.en} />;
}
