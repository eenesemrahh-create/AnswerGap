"use server";

import { post } from "@/lib/api";

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
