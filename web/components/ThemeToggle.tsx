"use client";

import { useEffect, useState } from "react";
import { THEMES, type Theme, applyTheme, readTheme } from "@/lib/theme";
import { useI18n } from "@/i18n";

/**
 * Light / dark / system, cycling in that order.
 *
 * A three-way cycle rather than a switch, because "system" is a destination
 * and not an absence: someone who has picked dark by hand needs a way back to
 * following the machine, and a two-state toggle can never offer it.
 *
 * Renders a stable placeholder until mounted. The stored preference lives in
 * localStorage, which the server cannot see, so drawing the real state on the
 * first pass would be a hydration mismatch. The theme itself is already
 * correct by then - the inline script in <head> set it before paint.
 */
export function ThemeToggle() {
  const { t } = useI18n();
  const [theme, setTheme] = useState<Theme>("system");
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setTheme(readTheme());
    setMounted(true);
  }, []);

  const next = () => {
    const value = THEMES[(THEMES.indexOf(theme) + 1) % THEMES.length];
    setTheme(value);
    applyTheme(value);
  };

  const icon = theme === "light" ? "☀" : theme === "dark" ? "☾" : "◐";

  return (
    <button
      className="theme-toggle"
      onClick={next}
      // The label says what you will GET, not what is on. A toggle that
      // announces its current state leaves the reader to work out what
      // pressing it does.
      aria-label={t(`theme.${theme}`)}
      title={t(`theme.${theme}`)}
      suppressHydrationWarning
    >
      <span aria-hidden>{mounted ? icon : "◐"}</span>
    </button>
  );
}
