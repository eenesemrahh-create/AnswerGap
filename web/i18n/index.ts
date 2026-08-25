"use client";

import { createContext, createElement, useCallback, useContext, useEffect, useState } from "react";
import { en } from "./en";
import { de } from "./de";
import { es } from "./es";
import { fr } from "./fr";
import { tr } from "./tr";
import {
  LOCALES,
  LOCALE_NAMES,
  LOCALE_TAGS,
  type Locale,
  type Messages,
} from "./types";

export { LOCALES, LOCALE_NAMES, LOCALE_TAGS };
export type { Locale, Messages };

const CATALOGUE: Record<Locale, Messages> = { en, de, es, fr, tr };

const STORAGE_KEY = "answergap.locale";
export const DEFAULT_LOCALE: Locale = "en";

/** Dotted paths into the message tree, e.g. "detail.updated". */
type Leaves<T, Prefix extends string = ""> = {
  [K in keyof T & string]: T[K] extends string
    ? `${Prefix}${K}`
    : Leaves<T[K], `${Prefix}${K}.`>;
}[keyof T & string];

export type MessageKey = Leaves<Messages>;

function lookup(messages: Messages, key: string): string {
  let node: unknown = messages;
  for (const part of key.split(".")) {
    if (typeof node !== "object" || node === null) return key;
    node = (node as Record<string, unknown>)[part];
  }
  // Falling back to the key itself makes a missing string visible in the UI
  // rather than rendering an empty space. In practice the type system prevents
  // this, but a runtime key (e.g. a status code from the API) can still miss.
  return typeof node === "string" ? node : key;
}

function interpolate(template: string, values?: Record<string, string | number>) {
  if (!values) return template;
  return template.replace(/\{(\w+)\}/g, (match, name) =>
    name in values ? String(values[name]) : match
  );
}

interface I18nValue {
  locale: Locale;
  setLocale: (locale: Locale) => void;
  t: (key: MessageKey | string, values?: Record<string, string | number>) => string;
  tag: string;
}

const I18nContext = createContext<I18nValue | null>(null);

function readStored(): Locale | null {
  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    return stored && (LOCALES as readonly string[]).includes(stored)
      ? (stored as Locale)
      : null;
  } catch {
    // Private windows and blocked site data throw on access.
    return null;
  }
}

export function I18nProvider({ children }: { children: React.ReactNode }) {
  const [locale, setLocaleState] = useState<Locale>(DEFAULT_LOCALE);

  // Read after mount, never during render: the server has no localStorage, and
  // reading it during the first client render would produce a hydration
  // mismatch. English renders first, then the stored choice applies.
  useEffect(() => {
    const stored = readStored();
    if (stored) setLocaleState(stored);
  }, []);

  useEffect(() => {
    document.documentElement.lang = locale;
  }, [locale]);

  const setLocale = useCallback((next: Locale) => {
    setLocaleState(next);
    try {
      localStorage.setItem(STORAGE_KEY, next);
    } catch {
      // Preference simply does not persist; the app still works.
    }
  }, []);

  const t = useCallback(
    (key: MessageKey | string, values?: Record<string, string | number>) =>
      interpolate(lookup(CATALOGUE[locale], key), values),
    [locale]
  );

  return createElement(
    I18nContext.Provider,
    { value: { locale, setLocale, t, tag: LOCALE_TAGS[locale] } },
    children
  );
}

export function useI18n(): I18nValue {
  const value = useContext(I18nContext);
  if (!value) throw new Error("useI18n must be used inside <I18nProvider>");
  return value;
}

/** Format an ISO timestamp in the active locale. */
export function useDateFormat() {
  const { tag } = useI18n();
  return useCallback(
    (iso: string | null) => {
      if (!iso) return "—";
      const date = new Date(iso);
      if (Number.isNaN(date.getTime())) return "—";
      return date.toLocaleString(tag, {
        day: "2-digit",
        month: "long",
        year: "numeric",
        hour: "2-digit",
        minute: "2-digit",
      });
    },
    [tag]
  );
}
