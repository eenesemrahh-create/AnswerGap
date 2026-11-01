/** Light, dark, or whatever the operating system says.
 *
 * Three states, not two. LIGHT IS THE DEFAULT (operator, 2026-11-01: the site
 * is designed light and should open that way on a dark machine too). "System"
 * stays a real choice for somebody who switches at sunset and wants the app to
 * follow, so it is stored by name; an empty key now means "never chose".
 *
 * The chosen value is written to `data-theme` on <html>, which is what
 * globals.css keys off. "system" writes NOTHING, so `color-scheme: light dark`
 * on `:root` lets the operating system decide.
 */

export type Theme = "light" | "dark" | "system";

export const THEMES: Theme[] = ["light", "dark", "system"];

export const THEME_KEY = "answergap.theme";

/**
 * Runs BEFORE first paint, inlined into <head>. Stringified on purpose.
 *
 * Without it the page renders light, then React hydrates and swaps to dark —
 * a white flash on every load for every dark-mode user, which is the single
 * most visible way a theme toggle can be done badly. It has to be a blocking
 * inline script; anything deferred is already too late.
 *
 * Deliberately tiny and defensive: it runs before anything else and a throw
 * here would take the whole page with it.
 */
export const THEME_SCRIPT = `
try {
  var t = localStorage.getItem(${JSON.stringify(THEME_KEY)});
  if (t !== "system") document.documentElement.dataset.theme = t === "dark" ? "dark" : "light";
} catch (e) {
  document.documentElement.dataset.theme = "light";
}
`.trim();

export function readTheme(): Theme {
  if (typeof window === "undefined") return "light";
  try {
    const stored = window.localStorage.getItem(THEME_KEY);
    return stored === "dark" || stored === "system" ? stored : "light";
  } catch {
    return "light";
  }
}

export function applyTheme(theme: Theme): void {
  if (typeof document === "undefined") return;
  if (theme === "system") {
    delete document.documentElement.dataset.theme;
  } else {
    document.documentElement.dataset.theme = theme;
  }
  try {
    window.localStorage.setItem(THEME_KEY, theme);
  } catch {
    /* The theme still applies for this session. */
  }
}

/** What the user would actually see right now, with "system" resolved. */
export function effectiveTheme(theme: Theme): "light" | "dark" {
  if (theme !== "system") return theme;
  if (typeof window === "undefined" || !window.matchMedia) return "light";
  return window.matchMedia("(prefers-color-scheme: dark)").matches ? "dark" : "light";
}
