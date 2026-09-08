/** Where the session lives in the browser, and why it lives there.
 *
 * localStorage, not a cookie — and that is forced rather than chosen. The api
 * and the web are separate `*.up.railway.app` subdomains, and `up.railway.app`
 * is on the Public Suffix List, so browsers treat them as DIFFERENT SITES. A
 * cookie set by the api would be a third-party cookie: it needs
 * `SameSite=None; Secure`, Safari drops it today and Chrome is heading the same
 * way. So the token is stored here and sent as an `Authorization` header, which
 * works on every origin combination.
 *
 * The cost is honest: localStorage is readable by any script on the page, so an
 * XSS becomes a stolen session. The real fix is a custom domain — with
 * `api.answergap.com` and `app.answergap.com` under one registrable domain the
 * cookie becomes first-party and this file collapses into an httpOnly cookie.
 * That is a one-module change on the day the domain is bought.
 *
 * The admin service does NOT use this. It keeps its token in a first-party
 * httpOnly cookie on its own domain, server-side, precisely because it is worth
 * more.
 */

const TOKEN_KEY = "answergap.token";
const ANON_KEY = "answergap.anon";

/** Every read is wrapped: a private window or blocked site data throws here. */
function read(key: string): string | null {
  if (typeof window === "undefined") return null;
  try {
    return window.localStorage.getItem(key);
  } catch {
    return null;
  }
}

function write(key: string, value: string): void {
  if (typeof window === "undefined") return;
  try {
    window.localStorage.setItem(key, value);
  } catch {
    /* Storage is a convenience here, never load-bearing. */
  }
}

export function token(): string | null {
  return read(TOKEN_KEY);
}

export function setToken(value: string): void {
  write(TOKEN_KEY, value);
}

export function clearToken(): void {
  if (typeof window === "undefined") return;
  try {
    window.localStorage.removeItem(TOKEN_KEY);
  } catch {
    /* nothing to do */
  }
}

/** The anonymous visitor's own id, for the daily free-search counter.
 *
 * Generated here and sent as a header, for the same reason the token is: a
 * cookie set by the api would never come back. Clearing site data resets it,
 * which is exactly why the server counts an IP hash as well — either counter
 * reaching the limit refuses.
 */
export function anonId(): string {
  const existing = read(ANON_KEY);
  if (existing) return existing;
  const fresh =
    typeof crypto !== "undefined" && crypto.randomUUID
      ? crypto.randomUUID()
      : `${Date.now()}-${Math.random().toString(36).slice(2)}`;
  write(ANON_KEY, fresh);
  return fresh;
}

/** Take the token out of the URL fragment the API redirected us back with.
 *
 * A FRAGMENT, not a query string: fragments are never sent to a server, so the
 * token stays out of access logs and out of the `Referer` header. It is removed
 * from the address bar immediately so a copied link cannot carry a session.
 *
 * Returns true when a token was found, so the caller knows to refetch `/api/me`.
 */
export function captureTokenFromHash(): boolean {
  if (typeof window === "undefined") return false;
  const hash = window.location.hash;
  if (!hash.startsWith("#token=")) return false;
  const value = decodeURIComponent(hash.slice("#token=".length));
  if (!value) return false;
  setToken(value);
  window.history.replaceState(null, "", window.location.pathname + window.location.search);
  return true;
}
