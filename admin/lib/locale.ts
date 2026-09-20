import "server-only";

import { cookies } from "next/headers";
import { DEFAULT_LOCALE, LOCALE_COOKIE, isLocale, makeT, type Locale } from "./i18n";

/**
 * The chosen language, read on the server.
 *
 * A COOKIE, not localStorage, and that is forced rather than preferred. Every
 * page in this console is a server component with `force-dynamic`, so the text
 * is built before the browser has run anything - the customer app's
 * localStorage approach would render English and then correct itself, which on
 * a page of tables is a visible flash and on a server-rendered one is simply
 * impossible. Reading a cookie costs nothing here because nothing is static.
 */
export async function getLocale(): Promise<Locale> {
  const chosen = (await cookies()).get(LOCALE_COOKIE)?.value;
  return isLocale(chosen) ? chosen : DEFAULT_LOCALE;
}

/** `const t = await translator()` at the top of a page. */
export async function translator() {
  return makeT(await getLocale());
}
