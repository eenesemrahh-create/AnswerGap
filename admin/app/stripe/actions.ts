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

export async function startTestPayment(): Promise<StripeTestResult> {
  return post<StripeTestResult>("/api/admin/stripe/test-payment");
}
