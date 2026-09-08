import type { Metadata } from "next";
import Link from "next/link";
import "./globals.css";

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

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body>
        <header className="topbar">
          <span className="brand">
            Answer<span>Gap</span> <small>admin</small>
          </span>
          <nav>
            <Link href="/">Overview</Link>
            <Link href="/users">Users</Link>
            <Link href="/settings">Settings</Link>
            <Link href="/audit">Audit</Link>
          </nav>
          <form action="/api/auth/signout" method="post">
            <button className="linkish" type="submit">Sign out</button>
          </form>
        </header>
        <main>{children}</main>
      </body>
    </html>
  );
}
