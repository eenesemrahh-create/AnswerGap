import Link from "next/link";
import { get } from "@/lib/api";
import type { Pricing } from "@/lib/types";
import { PricingEditor } from "./editor";

// The editor manages local state and posts back on save, so the initial render
// wants fresh data at every visit rather than a cached response. Same choice
// as /settings a level up.
export const dynamic = "force-dynamic";

export default async function PricingPage() {
  const current = await get<Pricing>("/api/admin/pricing");

  return (
    <>
      <p className="sub" style={{ marginTop: 0 }}>
        <Link href="/settings" className="linkish">&larr; Settings</Link>
      </p>
      <h1>Pricing plans</h1>
      <p className="sub">
        What the marketing landing shows in the pricing section. Between 0 and
        4 plans; empty means the landing renders its hardcoded fallback in
        every supported language. Once anything is saved here, the landing
        shows THIS text in every locale — the multi-language fallback stops
        applying, deliberately (see CLAUDE.md).
      </p>
      <p className="sub">
        Saved changes append a row to <code>app_setting</code>: the previous
        value stays on record and shows up in the audit log. Nothing here is
        overwritten in place.
      </p>

      <PricingEditor initial={current.plans} />
    </>
  );
}
