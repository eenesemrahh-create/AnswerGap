"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { useI18n } from "@/i18n";
import type { Country, SearchLanguage } from "@/lib/types";

/**
 * Where a search runs: one quiet pill that opens a panel, in place of two
 * native selects. 213 countries is too long a list to scroll, so the panel
 * filters as you type.
 *
 * The badge is the ISO code rather than a flag emoji, because Windows has no
 * flag glyphs and would draw the same two letters anyway, in a worse font.
 */
export function MarketPicker({
  countries,
  languages,
  location,
  language,
  onChange,
}: {
  countries: Country[];
  languages: SearchLanguage[];
  location: number;
  language: string;
  onChange: (location: number, language: string) => void;
}) {
  const { t } = useI18n();
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");
  const root = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    const away = (event: PointerEvent) => {
      if (!root.current?.contains(event.target as Node)) setOpen(false);
    };
    const escape = (event: KeyboardEvent) => {
      if (event.key === "Escape") setOpen(false);
    };
    document.addEventListener("pointerdown", away);
    document.addEventListener("keydown", escape);
    return () => {
      document.removeEventListener("pointerdown", away);
      document.removeEventListener("keydown", escape);
    };
  }, [open]);

  const matches = useMemo(() => {
    const term = query.trim().toLocaleLowerCase();
    if (!term) return countries;
    return countries.filter(
      (country) =>
        country.name.toLocaleLowerCase().includes(term) ||
        country.iso.toLowerCase() === term
    );
  }, [countries, query]);

  const country = countries.find((item) => item.code === location);
  const languageName =
    languages.find((item) => item.code === language)?.name ?? "English";

  return (
    <div className="market" ref={root}>
      <button
        type="button"
        className="market-trigger"
        aria-haspopup="dialog"
        aria-expanded={open}
        aria-label={t("market.picker.open")}
        onClick={() => {
          setQuery("");
          setOpen(!open);
        }}
      >
        <span className="market-iso">{country?.iso ?? "US"}</span>
        <span>{country?.name ?? "United States"}</span>
        <span className="market-dot" aria-hidden />
        <span>{languageName}</span>
        <svg viewBox="0 0 20 20" aria-hidden>
          <path d="m5 8 5 5 5-5" />
        </svg>
      </button>

      {open && (
        <div className="market-panel" role="dialog" aria-label={t("market.picker.open")}>
          <p className="market-heading">{t("market.picker.language")}</p>
          <div className="market-languages">
            {languages.map((item) => (
              <button
                key={item.code}
                type="button"
                className="market-language"
                aria-pressed={item.code === language}
                onClick={() => onChange(location, item.code)}
              >
                {item.name}
              </button>
            ))}
          </div>

          <p className="market-heading">{t("market.picker.country")}</p>
          <input
            className="market-search"
            autoFocus
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            placeholder={t("market.picker.search")}
            aria-label={t("market.picker.search")}
          />
          <ul className="market-list">
            {matches.map((item) => (
              <li key={item.code}>
                <button
                  type="button"
                  className="market-country"
                  aria-pressed={item.code === location}
                  onClick={() => {
                    onChange(item.code, language);
                    setOpen(false);
                  }}
                >
                  <span className="market-iso">{item.iso}</span>
                  {item.name}
                </button>
              </li>
            ))}
            {matches.length === 0 && <li className="market-none">{t("market.picker.none")}</li>}
          </ul>
        </div>
      )}
    </div>
  );
}
