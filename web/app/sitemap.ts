import type { MetadataRoute } from "next";
import { LEGAL_DOCS, SITE_URL, legalPath } from "@/lib/legal";
import { TERMS } from "@/content/legal/terms";
import { PRIVACY } from "@/content/legal/privacy";
import { LOCALES } from "@/i18n/types";
import { MARKETING_PAGES, marketingPath } from "@/lib/marketing";

/**
 * Only the pages that are genuinely server-rendered belong here: the landing,
 * the fifteen marketing URLs and the ten legal ones. `/tree/[slug]` is
 * per-account and private; `/pay` is the temporary link-gated probe and
 * `robots.ts` disallows it outright.
 *
 * Every entry carries `alternates.languages`, which is how a search engine
 * learns five URLs are one page in five languages rather than five thin
 * duplicates of each other.
 *
 * The marketing pages outrank the legal ones here on purpose. Priority is a
 * hint about relative importance WITHIN this site, and a pricing page is what
 * this site would like found; a contract is something it is obliged to
 * publish.
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
    ...MARKETING_PAGES.flatMap((page) =>
      LOCALES.map((locale) => ({
        url: `${SITE_URL}${marketingPath(page, locale)}`,
        changeFrequency: "monthly" as const,
        priority: 0.8,
        alternates: {
          languages: Object.fromEntries(
            LOCALES.map((l) => [l, `${SITE_URL}${marketingPath(page, l)}`])
          ),
        },
      }))
    ),
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
