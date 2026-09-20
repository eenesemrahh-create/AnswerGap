import type { MetadataRoute } from "next";
import { SITE_URL } from "@/lib/legal";

/**
 * `/pay` is disallowed on purpose.
 *
 * It is the temporary link-gated payment probe: an unauthenticated page that
 * mints a Checkout session for a chosen amount. Card-testing abuse looks for
 * exactly that, so it must not be discoverable in a search index. The page is
 * due to be deleted once credit packs are wired; this line goes with it.
 */
export default function robots(): MetadataRoute.Robots {
  return {
    rules: { userAgent: "*", allow: "/", disallow: ["/pay", "/api/"] },
    sitemap: `${SITE_URL}/sitemap.xml`,
  };
}
