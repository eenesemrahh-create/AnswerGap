import type { Metadata } from "next";
import { I18nProvider } from "@/i18n";
import { THEME_SCRIPT } from "@/lib/theme";
import "./globals.css";

export const metadata: Metadata = {
  title: "AnswerGap — Find the questions your competitors never answered",
  description:
    "Expands Google's People Also Ask into a question tree and shows which " +
    "questions no page actually targets.",
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
    <html lang="en" suppressHydrationWarning>
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
