import type { Metadata } from "next";
import { I18nProvider } from "@/i18n";
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
    <html lang="en">
      <body>
        <I18nProvider>{children}</I18nProvider>
      </body>
    </html>
  );
}
