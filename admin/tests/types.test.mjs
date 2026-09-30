import test from "node:test";
import assert from "node:assert/strict";

import {
  CAPABILITY_OPTIONS,
  PLAN_DEFAULTS,
  PRICING_TEMPLATES,
  completePlan,
} from "../lib/types.ts";

/**
 * THE ADMIN'S FIRST TESTS, and they exist because of a crash.
 *
 * `pricing_plans` is a JSON blob written by whatever version of the editor last
 * saved it. A card stored in September has no `capabilities`, no `credits` and
 * no Stripe ids - those fields did not exist yet. The `Plan` interface says
 * they are `string[]` and `number`, and is simply wrong about rows already in
 * the database.
 *
 * So the editor rendered `plan.capabilities.includes(...)` against `undefined`
 * and took the whole pricing page down the first time a real deployment opened
 * it. The same shape crashed the question panel on 2026-09-17, where
 * `types.ts` declared `reach: number | null` and the API sent nothing.
 *
 * Node runs these directly and strips the TypeScript itself - no framework, no
 * dependency, the arrangement `web/tests` already uses. `lib/types.ts` stays
 * free of `server-only` and `@/` imports so it can be loaded this way.
 */

/** The three production cards as `/api/admin/pricing` really returns them,
 *  measured on 2026-09-27. Note what is NOT here. */
const STORED_TODAY = {
  id: "pro",
  enabled: true,
  theme: "light",
  name: "Pro",
  desc: "For high-volume teams.",
  price: "$39.99",
  price_annual: "$31.99",
  per: "/month",
  features_heading: "Best value for money",
  features: ["1,000 credits per month"],
  cta: "Go Pro",
  badge: null,
};

test("the stored card that crashed the editor now completes", () => {
  const plan = completePlan(STORED_TODAY);
  // The exact expression that threw.
  assert.doesNotThrow(() => plan.capabilities.includes("csv_export"));
  assert.deepEqual(plan.capabilities, []);
  assert.equal(plan.credits, 0);
  assert.equal(plan.stripe_price_id, "");
  assert.equal(plan.stripe_price_id_annual, "");
});

test("what the card DID carry is kept, not defaulted away", () => {
  const plan = completePlan(STORED_TODAY);
  assert.equal(plan.name, "Pro");
  assert.equal(plan.price, "$39.99");
  assert.equal(plan.enabled, true);
  assert.deepEqual(plan.features, ["1,000 credits per month"]);
});

test("a stored null survives a spread and must still not crash", () => {
  // `{...defaults, ...saved}` skips keys that are ABSENT, not keys present and
  // null - so null needs its own handling or it crashes exactly like undefined.
  const plan = completePlan({ id: "x", capabilities: null, features: null });
  assert.deepEqual(plan.capabilities, []);
  assert.deepEqual(plan.features, []);
});

test("every card gets its OWN arrays", () => {
  // Sharing the defaults object between slots would make editing one card's
  // features edit all four.
  const a = completePlan({ id: "a" });
  const b = completePlan({ id: "b" });
  a.features.push("only mine");
  a.capabilities.push("csv_export");
  assert.deepEqual(b.features, []);
  assert.deepEqual(b.capabilities, []);
  assert.deepEqual(PLAN_DEFAULTS.features, []);
});

test("a complete card passes through unchanged", () => {
  const full = completePlan({ ...PRICING_TEMPLATES[2] });
  assert.deepEqual(full, PRICING_TEMPLATES[2]);
});

test("PLAN_DEFAULTS covers every field the templates have", () => {
  // The guard against the NEXT field. Adding one to `Plan` without adding it
  // here recreates the crash for the next operator who opens this page.
  const template = PRICING_TEMPLATES[0];
  for (const key of Object.keys(template)) {
    if (key === "id") continue;
    assert.ok(
      key in PLAN_DEFAULTS,
      `PLAN_DEFAULTS is missing "${key}" - a stored card without it will crash the editor`
    );
  }
});

test("the capability options are the ones the API accepts", () => {
  // Mirrors CAPABILITIES in answergap/entitlements.py. A value here the API
  // refuses makes the save fail with a validation error; one missing here is a
  // capability nobody can grant.
  assert.deepEqual(
    CAPABILITY_OPTIONS.map((c) => c.value).sort(),
    [
      "api_access",
      "bulk_search",
      "csv_export",
      "deep_search",
      "png_export",
      "scheduled_crawls",
      "white_label",
    ]
  );
});

test("every template is already complete", () => {
  // They are the starting point for an empty slot, so a template missing a
  // field would write an incomplete card into the database on first save.
  for (const template of PRICING_TEMPLATES) {
    assert.deepEqual(completePlan(template), template, `template ${template.id}`);
  }
});
