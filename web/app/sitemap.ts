import type { MetadataRoute } from "next";
import { LEGAL_DOCS, SITE_URL, legalPath } from "@/lib/legal";
import { TERMS } from "@/content/legal/terms";
import { PRIVACY } from "@/content/legal/privacy";
import { LOCALES } from "@/i18n/types";

/**
 * The first sitemap this app has had.
 *
 * Only the pages that are genuinely server-rendered belong here, which today
 * means the landing and the ten legal URLs. `/tree/[slug]` is per-account and
 * private; `/pay` is the temporary link-gated probe and `robots.ts` disallows
 * it outright.
 *
 * Each legal entry carries `alternates.languages`, which is how a search engine
 * learns the five URLs are the same document rather than five thin duplicates.
 */
export default function sitemap(): MetadataRoute.Sitemap {
  const updated = {
    terms: new Date(`${TERMS.en.effective}T00:00:00Z`),
    privacy: new Date(`${PRIVACY.en.effective}T00:00:00Z`),
  };

  return [
    {
      url: `${SITE_URL}/`,
      changeFrequency: "weekly",
      priority: 1,
    },
    ...LEGAL_DOCS.flatMap((doc) =>
      LOCALES.map((locale) => ({
        url: `${SITE_URL}${legalPath(doc, locale)}`,
        lastModified: updated[doc],
        changeFrequency: "yearly" as const,
        priority: 0.3,
        alternates: {
          languages: Object.fromEntries(
            LOCALES.map((l) => [l, `${SITE_URL}${legalPath(doc, l)}`])
          ),
        },
      }))
    ),
  ];
}
