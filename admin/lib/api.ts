import "server-only";

import { cookies } from "next/headers";
import { redirect } from "next/navigation";

/**
 * The admin panel's only route to the API. SERVER SIDE, always.
 *
 * The `import "server-only"` above is the point of this file. It turns
 * "somebody imported the admin API client into a client component" from a
 * security bug into a BUILD ERROR — the same trick web/i18n/types.ts uses to
 * turn a missing translation into a failed build. Without it, one careless
 * `"use client"` would ship the admin's session token to the browser.
 *
 * Verified rather than assumed: a client component importing `apiUrl` from
 * here was added deliberately, `npm run build` failed with the import trace,
 * and the probe was removed. Next resolves `server-only` itself, so it needs
 * no entry in package.json.
 *
 * That is the whole reason the admin is a separate service. The customer web
 * has to keep its token in localStorage, because api and web are separate sites
 * under the Public Suffix List and a cookie would never come back. The admin
 * does not: it holds its token in a first-party httpOnly cookie on its OWN
 * domain and talks to the API from the server, so the admin session is never
 * readable by page scripts and never crosses an origin in a browser.
 *
 * None of this is the security boundary. The API is: it reads ADMIN_EMAILS and
 * refuses anyone not on it. This service is a carrier, not a gate.
 */

const API_URL = process.env.API_URL ?? "";

/** Deliberately NOT NEXT_PUBLIC_. See the note above. */
export function apiUrl(): string {
  return API_URL.replace(/\/$/, "");
}

export const SESSION_COOKIE = "ag_admin";

/** Fails closed and visibly. A localhost default would silently render an
 *  empty panel in production, which is worse than an error that names itself. */
export function configured(): boolean {
  return Boolean(API_URL && process.env.PUBLIC_ADMIN_URL);
}

/**
 * Both URLs must carry a scheme, and this is checked rather than assumed.
 *
 * Railway's Networking panel shows a domain WITHOUT `https://`, so a
 * copy-paste drops it. The API then rejects the return target — correctly,
 * since it demands an exact origin match — and the admin sees a bare
 * `{"code":"badReturn"}` from a different service, with nothing pointing at
 * the variable that actually caused it. It cost a debugging round trip once.
 *
 * Checked, not silently repaired: quietly prepending `https://` would hide a
 * misconfiguration that also affects AUTH_RETURN_ORIGINS on the api service,
 * where nothing here can reach it.
 */
export function schemeProblem(): string | null {
  const bad = (["API_URL", "PUBLIC_ADMIN_URL"] as const).filter((name) => {
    const value = process.env[name];
    // Case-insensitive, because the api's own check is: urlsplit lowercases
    // the scheme, so HTTPS:// is accepted there. A stricter test here would
    // block a configuration that actually works, which is worse than
    // missing one that does not.
    return value && !/^https?:\/\//i.test(value);
  });
  if (bad.length === 0) return null;
  return `${bad.join(" and ")} must start with https:// — Railway shows domains without it.`;
}

export async function sessionToken(): Promise<string | null> {
  const jar = await cookies();
  return jar.get(SESSION_COOKIE)?.value ?? null;
}

export class ApiError extends Error {
  constructor(public readonly status: number, message: string) {
    super(message);
  }
}

async function call<T>(path: string, init?: RequestInit): Promise<T> {
  const token = await sessionToken();
  if (!token) redirect("/signin");

  const response = await fetch(`${apiUrl()}${path}`, {
    ...init,
    headers: {
      ...(init?.headers ?? {}),
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
    },
    cache: "no-store",
  });

  // 401: the token expired, or was revoked from this very panel. Back to
  // sign-in rather than an empty page nobody can explain.
  if (response.status === 401) redirect("/signin?expired=1");

  // 403: signed in, but not an admin. This gets its OWN page rather than a
  // bounce back to sign-in, because signing in again is precisely what will
  // not help - and it must never surface as a bare 500, which is what it did
  // the first time somebody hit it. An admin panel that answers "a server
  // error occurred" when the real answer is "your address is not on the list"
  // sends its operator hunting through logs for a configuration line.
  if (response.status === 403) redirect("/no-access");

  // Anything else becomes a page that NAMES the status, rather than a thrown
  // error. Next strips error messages in production - an uncaught throw here
  // renders "A server error occurred" with nothing but a digest, which is how
  // a 403 spent an afternoon looking like a crash. The body goes to the
  // server log, where it is safe to be specific.
  if (!response.ok) {
    const body = await response.text().catch(() => "");
    console.error(`[admin] ${path} -> ${response.status} ${body.slice(0, 500)}`);
    redirect(`/api-error?status=${response.status}&path=${encodeURIComponent(path)}`);
  }
  return (await response.json()) as T;
}

export const get = <T,>(path: string) => call<T>(path);

export const post = <T,>(path: string, body?: unknown) =>
  call<T>(path, { method: "POST", body: JSON.stringify(body ?? {}) });

/** Money, always at four decimals: a request costs $0.0026 and two decimals
 *  would round the entire product's unit economics to zero. */
export const money = (value: number) => `$${(value ?? 0).toFixed(4)}`;

export const when = (iso: string | null | undefined) =>
  iso ? new Date(iso).toLocaleString() : "—";

/**
 * Dollars for a REPORT, where `money()`'s fixed four decimals are noise.
 *
 * `money()` shows $0.0026 because that is what one search costs and rounding
 * it to $0.00 would make the per-row numbers vanish. A month's total is
 * $12.41, and $12.4100 reads like a bug. So the precision follows the
 * magnitude: four decimals below a dollar, two above it.
 */
export const usd = (value: number) => {
  const n = Number(value ?? 0);
  return n !== 0 && Math.abs(n) < 1 ? `$${n.toFixed(4)}` : `$${n.toFixed(2)}`;
};

/** Stripe speaks cents; this is the only place that has to know. */
export const cents = (value: number) => `$${(Number(value ?? 0) / 100).toFixed(2)}`;

/** "September 2026". The month column of a budget table, not a timestamp. */
export const monthName = (iso: string) =>
  new Date(iso).toLocaleDateString(undefined, { month: "long", year: "numeric" });
