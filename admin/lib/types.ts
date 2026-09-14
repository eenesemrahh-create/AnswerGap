/** Shapes returned by /api/admin/*. Mirrors api/admin.py. */

export interface Overview {
  users: { total: number; active: number; suspended: number; new_7d: number };
  credits: { granted: number; spent: number; outstanding: number };
  usage: { allowed_today: number; anonymous_today: number; refused_today: number };
  spend: { attributed_usd: number; live_usd: number; standard_usd: number };
  settings: Settings;
}

export interface Settings {
  anonymous_daily_searches: number;
  signup_credits: number;
}

export interface UserRow {
  id: number;
  email: string;
  name: string | null;
  picture_url: string | null;
  status: "active" | "suspended";
  created_at: string;
  last_seen_at: string | null;
  balance: number;
  searches: number;
  spend_usd: number;
}

export interface LedgerRow {
  delta: number;
  reason: string;
  ref: string | null;
  note: string | null;
  created_at: string;
}

export interface UsageRow {
  action: string;
  outcome: string;
  credits: number;
  spend_usd: number;
  tree_slug: string | null;
  question_slug: string | null;
  created_at: string;
}

export interface CrawlRow {
  id: number;
  slug: string;
  seed: string;
  language_code: string;
  location_code: number;
  spend: number;
  created_at: string;
}

export interface UserDetail extends UserRow {
  token_epoch: number;
  is_admin: boolean;
  ledger: LedgerRow[];
  usage: UsageRow[];
  crawls: CrawlRow[];
}

export interface AdminAction {
  id: number;
  actor: string;
  action: string;
  target_user: number | null;
  target_email: string | null;
  detail: Record<string, unknown> | null;
  created_at: string;
}

/** A row on the marketing landing's pricing section. Mirrors the Plan model
 *  in api/admin.py; the CTA on the landing renders each one as a card. */
export interface Plan {
  id: string;
  /** The publish switch. Only enabled plans reach the landing. */
  enabled: boolean;
  name: string;
  desc: string;
  price: string;
  per: string;
  features: string[];
  cta: string;
  featured: boolean;
  badge: string | null;
}

export interface Pricing {
  plans: Plan[];
}

/** Set once and read in both the client editor and the server action. */
export const PRICING_MAX_PLANS = 4;
export const PRICING_MAX_FEATURES = 8;

/**
 * Four ready-made card templates. Shown in the empty slots of the editor so
 * a first-time visitor sees content to react to, not four blank cards to
 * fill from zero. The user picks one, edits the text in place, ticks
 * `enabled` to publish, and the card appears on the landing.
 *
 * All four ship with `enabled: false` because the whole point of the
 * publish switch is that nothing goes live until the operator ticks it. A
 * template that shipped enabled would put its placeholder text on the
 * marketing landing the moment an admin saves without reading.
 *
 * The content follows the product's AI Search Visibility positioning so
 * the templates feel native to AnswerGap rather than generic SaaS scaffolding.
 * Prices and copy are suggestions - the admin edits them in place.
 */
export const PRICING_TEMPLATES: Plan[] = [
  {
    id: "starter",
    enabled: false,
    name: "Starter",
    desc: "For creators building visibility in AI search.",
    price: "$49",
    per: "/month",
    features: [
      "100 topic searches per month",
      "AI search question maps",
      "Search intent classification",
      "Opportunity export",
    ],
    cta: "Get Started",
    featured: false,
    badge: null,
  },
  {
    id: "pro",
    enabled: false,
    name: "Pro",
    desc: "For teams scaling AI search authority.",
    price: "$149",
    per: "/month",
    features: [
      "Unlimited topic searches",
      "AI visibility opportunity scoring",
      "Answer and citation gap analysis",
      "API access",
      "Priority support",
    ],
    cta: "Go Pro",
    featured: true,
    badge: "Most Popular",
  },
  {
    id: "business",
    enabled: false,
    name: "Business",
    desc: "For agencies running many brands at once.",
    price: "$299",
    per: "/month",
    features: [
      "Everything in Pro",
      "Multiple workspaces",
      "White-label reports",
      "Scheduled crawls",
      "Team collaboration",
    ],
    cta: "Choose Business",
    featured: false,
    badge: null,
  },
  {
    id: "enterprise",
    enabled: false,
    name: "Enterprise",
    desc: "For large organizations with custom needs.",
    price: "Custom",
    per: "contact us",
    features: [
      "Custom volume pricing",
      "Dedicated infrastructure",
      "SSO and audit logs",
      "Custom integrations",
      "Dedicated support",
    ],
    cta: "Contact Sales",
    featured: false,
    badge: null,
  },
];
