"use server";

import { revalidatePath } from "next/cache";
import { post } from "@/lib/api";

/**
 * Save what each plan grants. One input per plan per feature, named
 * `credits:<plan id>`; a blank input is left out rather than sent as 0,
 * because 0 is a real answer here - "this plan grants nothing".
 */
export async function savePlanFeatures(formData: FormData) {
  const features: Record<string, { credits: number }> = {};
  for (const [name, raw] of formData.entries()) {
    if (!name.startsWith("credits:")) continue;
    const text = String(raw).trim();
    if (text === "") continue;
    const credits = Number(text);
    if (!Number.isInteger(credits) || credits < 0) continue;
    features[name.slice("credits:".length)] = { credits };
  }
  if (Object.keys(features).length === 0) return;
  await post("/api/admin/plan-features", { features });
  revalidatePath("/settings/plans");
}
