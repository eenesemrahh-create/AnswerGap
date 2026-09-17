"use server";

import { get, post } from "@/lib/api";
import type { CiOverview, CiTriggerResult } from "@/lib/types";

/**
 * The CI board's couriers. Server actions because the admin token lives in an
 * httpOnly cookie - same reason as settings/actions.ts. The GitHub token is
 * one hop further away still: it lives on the api service, and neither this
 * service nor the browser ever holds it.
 */

export async function loadCi(): Promise<CiOverview> {
  return get<CiOverview>("/api/admin/ci");
}

export async function runNow(): Promise<CiTriggerResult> {
  return post<CiTriggerResult>("/api/admin/ci/run");
}

export async function rerun(runId: number, failedOnly: boolean): Promise<CiTriggerResult> {
  const path = failedOnly ? "/api/admin/ci/rerun-failed" : "/api/admin/ci/rerun";
  return post<CiTriggerResult>(path, { run_id: runId });
}

export async function cancelRun(runId: number): Promise<CiTriggerResult> {
  return post<CiTriggerResult>("/api/admin/ci/cancel", { run_id: runId });
}
