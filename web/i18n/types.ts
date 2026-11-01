import type { en } from "./en";

/** Recursively strip `as const` readonly-ness so translations stay writable. */
type Mutable<T> = T extends string
  ? string
  : { -readonly [K in keyof T]: Mutable<T[K]> };

/**
 * The shape every locale must satisfy, derived from English.
 *
 * Adding a key to `en.ts` immediately breaks compilation of tr/de/es/fr until
 * they are updated. That is intentional: it converts "remember to update the
 * translations" from a habit into a build failure.
 */
export type Messages = Mutable<typeof en>;

export const LOCALES = ["en", "de", "es", "fr", "tr"] as const;
export type Locale = (typeof LOCALES)[number];

export const LOCALE_NAMES: Record<Locale, string> = {
  en: "English",
  de: "Deutsch",
  es: "Español",
  fr: "Français",
  tr: "Türkçe",
};

/** BCP 47 tags for Intl date and number formatting. */
export const LOCALE_TAGS: Record<Locale, string> = {
  en: "en-US",
  de: "de-DE",
  es: "es-ES",
  fr: "fr-FR",
  tr: "tr-TR",
};

export const LOCALE_KEY = "answergap.locale";

/**
 * Runs BEFORE first paint, inlined into <head>. Pages prerender in English, so
 * a reader who will get another language saw English and then watched it
 * change. This hides the page until `I18nProvider` has applied the language.
 * Here rather than in `index.ts`, which is a client module the server layout
 * cannot read a value from. The timer means a failed bundle cannot leave the
 * page blank: late English beats nothing.
 */
export const LOCALE_SCRIPT = `
try {
  var l = ${JSON.stringify(LOCALES)};
  var s = localStorage.getItem(${JSON.stringify(LOCALE_KEY)});
  var c = l.indexOf(s) >= 0 ? s : null;
  if (!c) (navigator.languages || [navigator.language]).some(function (t) {
    var b = (t || "").slice(0, 2).toLowerCase();
    if (l.indexOf(b) >= 0) { c = b; return true; }
  });
  if (c && c !== "en") {
    var h = document.documentElement;
    h.dataset.localePending = "1";
    setTimeout(function () { delete h.dataset.localePending; }, 3000);
  }
} catch (e) {}
`.trim();
