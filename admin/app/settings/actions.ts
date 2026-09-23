"use server";

import { revalidatePath } from "next/cache";
import { post } from "@/lib/api";

export async function saveSettings(formData: FormData) {
  const signup = Number(formData.get("signup_credits"));
  const payload: Record<string, number> = {};
  // `Number("")` is 0, and 0 is a REAL value here - "new accounts start with
  // nothing". So an empty field has to be told apart from a deliberate zero by
  // looking at the raw string, not at the parsed number.
  if (String(formData.get("signup_credits") ?? "") !== "" && Number.isFinite(signup)) {
    payload.signup_credits = signup;
  }
  if (Object.keys(payload).length === 0) return;
  await post("/api/admin/settings", payload);
  revalidatePath("/settings");
}
