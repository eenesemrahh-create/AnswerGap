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
