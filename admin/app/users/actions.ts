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

/**
 * Put an account on a plan without a payment. Trials, the people who tested
 * this before it could take money, an apology, an agency invoiced elsewhere.
 *
 * `credits` is sent only when the operator typed one. Left blank it is
 * omitted entirely rather than sent as 0, which are two different
 * instructions: omitted means "whatever the plan grants", and 0 would mean
 * "this plan, no credits" - a real thing to want, and reachable by typing 0.
 */
export async function assignPlan(userId: number, formData: FormData) {
  const planId = String(formData.get("plan_id") ?? "");
  if (!planId) return;
  const rawCredits = String(formData.get("credits") ?? "").trim();
  const credits = rawCredits === "" ? null : Number(rawCredits);
  const days = Number(formData.get("days") ?? 30);
  const note = String(formData.get("note") ?? "");
  await post(`/api/admin/user/${userId}/plan`, {
    plan_id: planId,
    days: Number.isFinite(days) && days > 0 ? days : 30,
    ...(credits !== null && Number.isFinite(credits) ? { credits } : {}),
    grant_credits: formData.get("grant_credits") !== null,
    note: note || null,
  });
  revalidatePath(`/users/${userId}`);
}

/**
 * End an assigned plan. The API refuses a paid one - `source = 'admin'` is in
 * its WHERE clause - so this cannot cancel a real subscription by mistake,
 * and the button is not rendered for one either.
 */
export async function revokePlan(userId: number, subscriptionId: number) {
  await post(`/api/admin/user/${userId}/plan/${subscriptionId}/revoke`, {});
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
