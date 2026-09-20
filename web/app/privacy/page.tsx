import { LegalDocument } from "@/components/LegalDocument";
import { PRIVACY } from "@/content/legal/privacy";
import { buildLegalMetadata, warnIfPlaceholders } from "@/lib/legal";

/**
 * `/privacy` — the English policy, and the canonical URL of the document.
 *
 * This is the address given to the Google Cloud console: the app stays capped
 * at 100 users in "testing" mode until a reachable privacy URL is published,
 * so it needs to be short, permanent, and readable without JavaScript.
 */

export const metadata = buildLegalMetadata("privacy", "en", PRIVACY.en);

export default function PrivacyPage() {
  warnIfPlaceholders();
  return <LegalDocument doc="privacy" locale="en" content={PRIVACY.en} />;
}
