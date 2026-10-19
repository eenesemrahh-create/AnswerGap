"use server";

import { revalidatePath } from "next/cache";
import { post } from "@/lib/api";

/** Form field -> API field. 0 is a REAL value for every one of them. */
const FIELDS: Record<string, string> = {
  signup_credits: "signup_credits",
  anon_per_visitor: "anon_per_visitor",
  anon_daily_total: "anon_daily_total",
};

export async function saveSettings(formData: FormData) {
  const payload: Record<string, number> = {};
  for (const [field, key] of Object.entries(FIELDS)) {
    // `Number("")` is 0, and 0 is a REAL value here - "new accounts start with
    // nothing", "signed-out searching off". So an empty field has to be told
    // apart from a deliberate zero by looking at the raw string.
    const raw = String(formData.get(field) ?? "");
    const value = Number(raw);
    if (raw !== "" && Number.isFinite(value)) payload[key] = value;
  }
  if (Object.keys(payload).length === 0) return;
  await post("/api/admin/settings", payload);
  revalidatePath("/settings");
}
