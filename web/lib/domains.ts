/* "Is my site cited?" — matching a typed domain against AI Overview sources.
 *
 * Sources arrive as bare hostnames (`www.medicana.com.tr`,
 * `my.clevelandclinic.org`). People type whatever they have to hand: a full
 * URL, a `www.` prefix, a trailing slash. Both sides are reduced to a
 * hostname without `www.`, and a source matches when it IS the site or sits
 * UNDER it — `clevelandclinic.org` owns `my.` and `health.`, while typing
 * `health.clevelandclinic.org` asks about that subdomain alone.
 *
 * Pure on purpose: no storage, no React, so `web/tests/` can run it with
 * `node --test` and nothing else. */

const HOST = /^[\p{L}\p{N}-]+(\.[\p{L}\p{N}-]+)+$/u;

function stripWww(host: string): string {
  return host.startsWith("www.") ? host.slice(4) : host;
}

/** A typed domain or URL as a comparable hostname, or null if it is not one. */
export function normalizeSite(input: string): string | null {
  let host = input.trim().toLowerCase();
  host = host.replace(/^[a-z][a-z0-9+.-]*:\/\//, "");
  host = host.split(/[/?#]/, 1)[0];
  host = host.slice(host.lastIndexOf("@") + 1);
  host = host.replace(/:\d+$/, "").replace(/\.$/, "");
  host = stripWww(host);
  return HOST.test(host) ? host : null;
}

/** Whether a cited source hostname belongs to the normalized site. */
export function citesSite(source: string, site: string): boolean {
  const host = stripWww(source.trim().toLowerCase().replace(/\.$/, ""));
  return host === site || host.endsWith(`.${site}`);
}

/** Whether any of a question's cited sources belongs to the site. */
export function isCited(sources: readonly string[], site: string): boolean {
  return sources.some((source) => citesSite(source, site));
}
