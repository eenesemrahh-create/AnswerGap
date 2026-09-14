import type { Metadata } from "next";
import Link from "next/link";
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
 * The operator's console. ENGLISH ONLY, deliberately.
 *
 * The customer app carries five locales and a build gate that fails when one
 * falls behind. This has a single audience - whoever is running the product -
 * and putting it through the same machinery would mean four more files and four
 * broken builds every time a label changes here. That cost buys nothing.
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

  return (
    <html lang="en" className={jakarta.variable}>
      <body>
        <header className="topbar">
          <span className="brand">
            Answer<span>Gap</span> <small>admin</small>
          </span>
          {signedIn ? (
            <>
              <nav>
                <Link href="/">Overview</Link>
                <Link href="/users">Users</Link>
                <Link href="/settings">Settings</Link>
                <Link href="/audit">Audit</Link>
              </nav>
              <form action="/api/auth/signout" method="post">
                <button className="linkish" type="submit">Sign out</button>
              </form>
            </>
          ) : (
            <nav />
          )}
        </header>
        <main>{children}</main>
      </body>
    </html>
  );
}
