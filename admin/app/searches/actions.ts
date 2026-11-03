"use server";

import { get, post } from "@/lib/api";
import type { EmptySearchList, EmptySearchRun } from "@/lib/types";

/**
 * Leave an audit row before an admin downloads somebody's search.
 *
 * A Server Action so the admin token stays on the server; the API checks
 * `require_admin` again and writes `admin_action`. The file itself is built in
 * the browser from data the page already has.
 */
export async function recordSearchExport(
  slug: string,
  kind: "csv" | "png",
  items: number
): Promise<void> {
  await post(`/api/admin/search/${encodeURIComponent(slug)}/export`, { kind, items });
}

/** Searches that ended with no question, and the ceiling for running them. */
export async function loadEmptySearches(): Promise<EmptySearchList> {
  return get<EmptySearchList>("/api/admin/empty-searches");
}

/** Search the next five again for their owners. Spends real money; the api
 *  audits the run before buying anything. */
export async function runEmptySearches(): Promise<EmptySearchRun> {
  return post<EmptySearchRun>("/api/admin/empty-searches/run", { limit: 5 });
}
