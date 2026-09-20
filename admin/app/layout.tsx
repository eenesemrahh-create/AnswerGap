import type { Metadata } from "next";
import Link from "next/link";
import { LocaleSwitch } from "@/components/LocaleSwitch";
import { getLocale } from "@/lib/locale";
import { makeT } from "@/lib/i18n";
import { Plus_Jakarta_Sans } from "next/font/google";
import { sessionToken } from "@/lib/api";
import "./globals.css";

// The pricing editor renders the marketing landing's card design inside the
// admin so the operator sees exactly what will ship. Plus Jakarta Sans is
// the landing's font; scoping it here means the rest of the admin stays on
// system fonts and only the pricing preview picks it up (via .pricing-preview
// in globals.css, which reads the variable).
const jakarta = Plus_Jakarta_Sans({
  subsets: ["latin", "latin-ext"],
  weight: ["400", "500", "600", "700", "800"],
  display: "swap",
  variable: "--font-landing",
});

/**
 * The operator's console. TURKISH AND ENGLISH.
 *
 * This header used to read ENGLISH ONLY, and its reasoning was sound for what
 * it was answering: the customer app carries five locales and a build gate,
 * and the same machinery here would mean four more files and four broken
 * builds every time a label changes. At five that cost buys nothing.
 *
 * At TWO it is one file and one broken build, and what it buys is the person
 * who actually runs this product reading their own panel in their own
 * language. The principle did not change; its input did. See `lib/i18n.ts`.
 *
 * The Guide page stays English - it is a manual that describes the code
 * closely enough that a translation would drift, and it says so on itself.
 */
export const metadata: Metadata = {
  title: "AnswerGap admin",
  description: "Users, credits and spend.",
};

export default async function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  // Navigation and sign-out only exist for somebody who has a session. Showing
  // "Sign out" to a signed-out visitor is not just untidy - it says the panel
  // thinks they are signed in, which is the one thing an admin screen must
  // never be vague about. Links that would bounce straight back to /signin are
  // hidden for the same reason.
  //
  // Presence of the cookie, not proof of anything: whether it is a VALID
  // session is the API's call, and it re-checks on every request. This decides
  // what to draw, never what is allowed.
  const signedIn = Boolean(await sessionToken());
  // The language is read even when signed out, because /signin and
  // /no-access are the two screens a confused operator reads most carefully.
  const locale = await getLocale();
  const t = makeT(locale);

  return (
    <html lang={locale} className={jakarta.variable}>
      <body>
        <header className="topbar">
          <span className="brand">
            Answer<span>Gap</span> <small>admin</small>
          </span>
          {signedIn ? (
            <>
              <nav>
                <Link href="/">{t("nav.overview")}</Link>
                <Link href="/users">{t("nav.users")}</Link>
                <Link href="/reports">{t("nav.reports")}</Link>
                <Link href="/settings">{t("nav.settings")}</Link>
                <Link href="/stripe">{t("nav.payments")}</Link>
                <Link href="/ci">{t("nav.ci")}</Link>
                <Link href="/guide">{t("nav.guide")}</Link>
                <Link href="/audit">{t("nav.audit")}</Link>
              </nav>
              <LocaleSwitch locale={locale} />
              <form action="/api/auth/signout" method="post">
                <button className="linkish" type="submit">{t("nav.signOut")}</button>
              </form>
            </>
          ) : (
            <>
              <nav />
              <LocaleSwitch locale={locale} />
            </>
          )}
        </header>
        <main>{children}</main>
      </body>
    </html>
  );
}
