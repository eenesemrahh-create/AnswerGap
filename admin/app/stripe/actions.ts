"use server";

import { get, post } from "@/lib/api";
import type { StripeStatus, StripeTestResult } from "@/lib/types";

/**
 * Couriers for the payments panel. Server actions, because the admin session
 * is an httpOnly cookie — and because the Stripe secret key lives one hop
 * further still, on the api service, where neither this service nor the
 * browser can reach it.
 */

export async function loadStripe(): Promise<StripeStatus> {
  return get<StripeStatus>("/api/admin/stripe");
}

export async function startTestPayment(confirmLive: boolean): Promise<StripeTestResult> {
  // The flag travels in the request rather than being implied by the mode, so
  // the api can refuse a live charge that nobody explicitly asked for.
  return post<StripeTestResult>("/api/admin/stripe/test-payment", {
    confirm_live: confirmLive,
  });
}
