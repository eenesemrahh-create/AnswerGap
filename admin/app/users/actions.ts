"use server";

import { revalidatePath } from "next/cache";
import { post } from "@/lib/api";

/**
 * The three things an admin can do to an account.
 *
 * Note what is NOT here: making somebody an admin. There is no endpoint for it
 * and no column to write, because admin is ADMIN_EMAILS on the api service.
 * Granting it takes a deploy, which is the point - it cannot be done from
 * inside the running product, by anyone, including whoever is reading this.
 *
 * Server Actions, so the token stays server-side. The API re-checks everything
 * anyway; this file is a caller, not a gate.
 */

export async function grantCredits(userId: number, formData: FormData) {
  const delta = Number(formData.get("delta"));
  const note = String(formData.get("note") ?? "");
  if (!Number.isFinite(delta) || delta === 0) return;
  await post(`/api/admin/user/${userId}/credits`, { delta, note: note || null });
  revalidatePath(`/users/${userId}`);
}

export async function setStatus(userId: number, formData: FormData) {
  const status = String(formData.get("status") ?? "");
  if (status !== "active" && status !== "suspended") return;
  await post(`/api/admin/user/${userId}/status`, { status });
  revalidatePath(`/users/${userId}`);
}

export async function revokeTokens(userId: number) {
  await post(`/api/admin/user/${userId}/revoke-tokens`, {});
  revalidatePath(`/users/${userId}`);
}

/**
 * Erase an account on the person's behalf. Irreversible from here.
 *
 * Returns the API's own summary instead of nothing, unlike the three above:
 * the others can be read off the refreshed page - a balance moved, a pill
 * changed colour - but erasure's whole effect is things that are no longer
 * there. "3 searches unlinked, 1 payment redacted" is the only way the
 * operator can see it worked, and a zero in that line is the signal that the
 * payment address did not match the account's.
 */
export async function eraseUser(userId: number, reason: string) {
  const out = await post<{
    already_erased: boolean;
    crawls: number;
    usage_events: number;
    payments_redacted: number;
    credentials_deleted: number;
  }>(`/api/admin/user/${userId}/erase`, { reason });
  revalidatePath(`/users/${userId}`);
  return out;
}
