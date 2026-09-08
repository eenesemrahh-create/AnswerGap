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

  // 401 means the token expired or was revoked from this very panel. Send the
  // admin back to sign in rather than rendering an empty page they cannot
  // explain. 403 does NOT redirect: it means signed in but not an admin, and
  // bouncing them into a sign-in loop would hide that.
  if (response.status === 401) redirect("/signin?expired=1");
  if (!response.ok) {
    throw new ApiError(response.status, await response.text().catch(() => ""));
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
