/** Light, dark, or whatever the operating system says.
 *
 * Three states, not two. "System" is a real choice and it is the default:
 * somebody who runs their machine dark expects a dark app without asking, and
 * somebody who switches at sunset expects the app to follow. Collapsing that
 * into a boolean loses the ability to go back to following.
 *
 * The chosen value is written to `data-theme` on <html>, which is what
 * globals.css keys off. "system" writes NOTHING, so the `prefers-color-scheme`
 * media query decides — that is why the CSS defines light on bare `:root` and
 * only overrides tokens inside the media query and the `[data-theme]` blocks.
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
  if (t === "light" || t === "dark") document.documentElement.dataset.theme = t;
} catch (e) {}
`.trim();

export function readTheme(): Theme {
  if (typeof window === "undefined") return "system";
  try {
    const stored = window.localStorage.getItem(THEME_KEY);
    return stored === "light" || stored === "dark" ? stored : "system";
  } catch {
    return "system";
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
    if (theme === "system") window.localStorage.removeItem(THEME_KEY);
    else window.localStorage.setItem(THEME_KEY, theme);
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
