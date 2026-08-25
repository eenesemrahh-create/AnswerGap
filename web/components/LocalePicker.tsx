"use client";

import { LOCALES, LOCALE_NAMES, useI18n, type Locale } from "@/i18n";

export function LocalePicker() {
  const { locale, setLocale, t } = useI18n();
  return (
    <select
      className="locale-picker"
      value={locale}
      aria-label={t("language.label")}
      title={t("language.label")}
      onChange={(e) => setLocale(e.target.value as Locale)}
    >
      {LOCALES.map((code) => (
        <option key={code} value={code}>
          {LOCALE_NAMES[code]}
        </option>
      ))}
    </select>
  );
}
