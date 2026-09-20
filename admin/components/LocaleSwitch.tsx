"use client";

import { usePathname } from "next/navigation";
import { LOCALES, LOCALE_NAMES, type Locale } from "@/lib/i18n";

/**
 * Two languages, one click.
 *
 * A FORM THAT POSTS, not a link, for the reason sign-out posts: switching
 * language writes a cookie, and a GET that changes state is one a prefetch, a
 * crawler or a chat preview can pull on somebody's behalf.
 *
 * `usePathname` is the only reason this is a client component. The route
 * handler needs to know where to send the reader back to, so that changing
 * language on Reports leaves them on Reports rather than on the dashboard -
 * and a server component cannot see its own URL.
 *
 * Renders only the language the reader is NOT using. A two-item picker where
 * one item is already active is a menu pretending to be a toggle.
 */
export function LocaleSwitch({ locale }: { locale: Locale }) {
  const pathname = usePathname() || "/";
  const other = LOCALES.find((l) => l !== locale) ?? locale;

  return (
    <form action="/api/locale" method="post" className="lang">
      <input type="hidden" name="lang" value={other} />
      <input type="hidden" name="back" value={pathname} />
      <button className="linkish" type="submit" lang={other}>
        {LOCALE_NAMES[other]}
      </button>
    </form>
  );
}
