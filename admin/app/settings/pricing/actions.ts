"use server";

import { revalidatePath } from "next/cache";
import { post } from "@/lib/api";
import type { Plan } from "@/lib/types";

/**
 * Save the pricing plans back to the api. Called from the client editor with
 * the current state.
 *
 * Server action rather than a fetch from the browser because the admin token
 * lives in an httpOnly cookie the browser cannot read - `post()` in
 * `lib/api.ts` reads it from `cookies()`, which only exists server-side.
 * Same pattern as `settings/actions.ts` a level up.
 *
 * The payload is not re-validated here: the client component enforces the
 * shape (required fields, max lengths, unique ids) and the API re-validates
 * on receive. This layer is a courier.
 */
export async function savePricing(plans: Plan[]): Promise<void> {
  await post("/api/admin/pricing", { plans });
  revalidatePath("/settings/pricing");
}
