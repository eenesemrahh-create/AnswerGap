import { API_BASE } from "@/lib/api";
import type { PricingContent } from "@/content/marketing/pricing";

/**
 * The plan cards `/pricing` draws, from the admin panel when it can be
 * reached and from the translated content file when it cannot.
 *
 * WHY ENGLISH ONLY READS THE ADMIN. The admin editor holds ONE set of
 * strings, so admin-supplied cards would put English descriptions and English
 * feature bullets on the Turkish, German, Spanish and French pages. The US is
 * the primary market and `/pricing` is the page the operator maintains, so it
 * is the one wired to the panel; the four translations render their own
 * content and `assertPricingAgrees` below is what stops them drifting quietly.
 *
 * Teaching the admin `Plan` shape about locales is the real fix and is
 * recorded in CLAUDE.md. Until then this is a stated limitation rather than
 * an accident.
 */

/** What the page renders. Both sources map onto it. */
export interface PlanView {
  name: string;
  desc: string;
  priceMonthly: string;
  priceAnnual: string;
  per: string;
  cta: string;
  badge: string | null;
  featuresHeading: string;
  features: readonly string[];
  /** `dark` is the card the design emphasises. */
  theme: "light" | "violet" | "pink" | "dark";
}

/** The shape `GET /api/pricing` returns. Mirrors `Plan` in api/admin.py. */
interface AdminPlan {
  id: string;
  enabled: boolean;
  theme: PlanView["theme"];
  name: string;
  desc: string;
  price: string;
  price_annual?: string;
  per: string;
  features_heading?: string;
  features: string[];
  cta: string;
  badge: string | null;
}

/**
 * The ids migration 0011 seeds, in the order the comparison table assumes.
 *
 * The table's rows are three-tuples written against Starter / Lite / Pro. If
 * an operator reorders the cards, renames one, or publishes a fourth, those
 * tuples would label the wrong column - a table that says Pro lacks API
 * access is worse than no table - so the page drops the section instead. See
 * `plansMatchTable`.
 */
export const TABLE_PLAN_IDS = ["starter", "lite", "pro"] as const;

export async function fetchAdminPlans(): Promise<AdminPlan[] | null> {
  try {
    const response = await fetch(`${API_BASE}/api/pricing`, {
      // ISR rather than no-store: this is marketing copy that changes when an
      // operator edits it, not per-request data, and the page has to stay
      // static HTML for the crawlers it exists for.
      next: { revalidate: 300 },
    });
    if (!response.ok) return null;
    const body = (await response.json()) as { plans?: AdminPlan[] };
    const plans = (body.plans ?? []).filter((p) => p.enabled);
    return plans.length ? plans : null;
  } catch {
    // The API is a separate Railway service and may be unreachable while the
    // web app builds. A pricing page that fails to render because a sibling
    // service was slow is worse than one showing the copy it shipped with.
    return null;
  }
}

export function toPlanViews(plans: AdminPlan[]): PlanView[] {
  return plans.map((plan) => ({
    name: plan.name,
    desc: plan.desc,
    priceMonthly: plan.price,
    // An empty annual rate means "no annual option" rather than "free", so
    // the monthly figure stands in and the switch simply shows no saving.
    priceAnnual: plan.price_annual?.trim() || plan.price,
    per: plan.per,
    cta: plan.cta,
    badge: plan.badge,
    featuresHeading: plan.features_heading?.trim() || "",
    features: plan.features,
    theme: plan.theme,
  }));
}

/** The content file's cards, for every locale and as the English fallback. */
export function contentPlanViews(content: PricingContent): PlanView[] {
  return content.plans.map((plan) => ({
    name: plan.name,
    desc: plan.desc,
    priceMonthly: plan.priceMonthly,
    priceAnnual: plan.priceAnnual,
    per: plan.per,
    cta: plan.cta,
    badge: plan.badge,
    featuresHeading: plan.featuresHeading,
    features: plan.features,
    // Derived, not carried: the design darkens exactly the card it badges,
    // and four translations should not each get a vote on a colour.
    theme: plan.badge ? "dark" : "light",
  }));
}

export function plansMatchTable(plans: AdminPlan[]): boolean {
  return (
    plans.length === TABLE_PLAN_IDS.length &&
    plans.every((plan, i) => plan.id === TABLE_PLAN_IDS[i])
  );
}

/**
 * Shout when the admin's prices and the English fallback have drifted apart.
 *
 * Two copies of the same three numbers exist on purpose - one in the database
 * so an operator can change a price without a deploy, one in the content file
 * so the page still renders when the API is down and so the four translations
 * have something to match. Two copies can disagree, and the first person to
 * notice a disagreement should not be a customer.
 *
 * A server log rather than a thrown error: a mismatch means somebody changed
 * a price in the panel, which is exactly what the panel is for. It is a
 * prompt to update the translations, not a fault.
 */
export function warnIfPricesDrifted(
  plans: AdminPlan[],
  content: PricingContent
): void {
  const fallback = content.plans;
  const drifted = plans.filter((plan, i) => {
    const mine = fallback[i];
    return mine && plan.price.trim() !== mine.priceMonthly.trim();
  });
  if (!drifted.length) return;
  console.warn(
    "[pricing] The admin panel and web/content/marketing/pricing/*.ts " +
      "disagree on a price, so /pricing and its four translations now show " +
      "different numbers: " +
      drifted
        .map((p, i) => `${p.id} admin=${p.price} content=${fallback[i]?.priceMonthly}`)
        .join(", ")
  );
}
