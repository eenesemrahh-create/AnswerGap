import type { Metadata } from "next";
import { Plus_Jakarta_Sans } from "next/font/google";
import { I18nProvider } from "@/i18n";
import { THEME_SCRIPT } from "@/lib/theme";
import { SITE_URL } from "@/lib/legal";
import "./globals.css";

// Loaded via next/font so the file is fingerprinted, self-hosted and doesn't
// block on Google Fonts DNS. `variable` exposes it as `--font` for globals.css
// (the token stays where the rest of the design system lives; nothing else has
// to know a font was swapped).
const jakarta = Plus_Jakarta_Sans({
  subsets: ["latin", "latin-ext"],
  weight: ["400", "500", "600", "700", "800"],
  display: "swap",
  variable: "--font-sans",
});

export const metadata: Metadata = {
  // Required, not decorative: a page that declares a relative canonical or
  // hreflang without it is a BUILD error, and the legal routes declare both.
  // It is also what turns those relative paths into the absolute URLs a
  // search engine and a review fetcher expect.
  metadataBase: new URL(SITE_URL),
  // An object rather than a bare string, because a plain string here is
  // REPLACED outright by a child page's title. The template keeps the brand
  // on "/terms" without every page having to repeat it.
  title: {
    default: "AnswerGap — Rank and Appear in AI Search",
    template: "%s — AnswerGap",
  },
  description:
    "Discover what people ask, identify the answers AI engines need, and " +
    "create content that gets found, cited, and recommended.",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  // lang is set to "en" here and updated by I18nProvider once the stored
  // locale is read on the client. Server-rendered markup must not depend on
  // localStorage, or hydration mismatches.
  return (
    <html lang="en" suppressHydrationWarning className={jakarta.variable}>
      <head>
        {/* Runs BEFORE first paint. Without it, a reader who has chosen dark
            gets a full white flash on every single load while React hydrates
            and swaps the attribute — the most visible way to get a theme
            toggle wrong. It has to be blocking and inline; anything deferred
            has already missed the paint. `suppressHydrationWarning` above is
            because this script legitimately edits <html> before React sees it. */}
        <script dangerouslySetInnerHTML={{ __html: THEME_SCRIPT }} />
      </head>
      <body>
        <I18nProvider>{children}</I18nProvider>
      </body>
    </html>
  );
}
