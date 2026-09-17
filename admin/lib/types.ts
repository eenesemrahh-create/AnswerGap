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
  /**
   * Whether the address was ever confirmed. An operator asked "why can this
   * person not spend?" has exactly two answers - suspended, or never
   * confirmed - and the second one is invisible without this.
   */
  email_verified: boolean;
  /** Which doors the account can use. Both true once Google and a password
   *  are linked to the same address. */
  has_password: boolean;
  has_google: boolean;
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

/** Four discrete colour themes. Chosen as an enum, not a free colour, so the
 *  landing renders coherent - discrete choices from the brand family sit
 *  tidy; a hex picker would ship rainbows. */
export type PlanTheme = "light" | "violet" | "pink" | "dark";

/** Presented in this order in the editor's theme picker. `light` first so it
 *  is the natural default; `dark` last so featured-style cards read as an
 *  emphasis rather than the starting point. */
export const THEME_OPTIONS: readonly {
  value: PlanTheme;
  label: string;
  swatch: string;
}[] = [
  { value: "light", label: "Light", swatch: "#ffffff" },
  { value: "violet", label: "Violet", swatch: "hsl(270 70% 92%)" },
  { value: "pink", label: "Pink", swatch: "hsl(320 80% 93%)" },
  { value: "dark", label: "Dark", swatch: "#16151d" },
] as const;

/** A row on the marketing landing's pricing section. Mirrors the Plan model
 *  in api/admin.py; the CTA on the landing renders each one as a card. */
export interface Plan {
  id: string;
  /** The publish switch. Only enabled plans reach the landing. */
  enabled: boolean;
  /** The card's colour identity. See THEME_OPTIONS. */
  theme: PlanTheme;
  name: string;
  desc: string;
  price: string;
  per: string;
  features: string[];
  cta: string;
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
    theme: "light",
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
    badge: null,
  },
  {
    id: "pro",
    enabled: false,
    theme: "dark",
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
    badge: "Most Popular",
  },
  {
    id: "business",
    enabled: false,
    theme: "violet",
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
    badge: null,
  },
  {
    id: "enterprise",
    enabled: false,
    theme: "pink",
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
    badge: null,
  },
];

/* CI page. Mirrors `api/ci.py` summarize_run / summarize_job. */
export interface CiJob {
  id: number | null;
  name: string;
  status: string | null;
  conclusion: string | null;
  started_at: string | null;
  completed_at: string | null;
  url: string | null;
  failed_step: string | null;
}

export interface CiRun {
  id: number;
  number: number;
  attempt: number;
  status: string | null;
  conclusion: string | null;
  event: string;
  branch: string;
  sha: string;
  message: string;
  actor: string | null;
  created_at: string | null;
  started_at: string | null;
  updated_at: string | null;
  url: string;
  jobs: CiJob[] | null;
}

export interface CiOverview {
  repo: string;
  workflow: string;
  branch: string;
  can_trigger: boolean;
  cache_seconds: number;
  runs: CiRun[];
  active: boolean;
  error: string | null;
  fetched_at: number | null;
}

export interface CiTriggerResult {
  ok: boolean;
  error: string | null;
}

/* Payments. Mirrors `api/admin.stripe_status`; no key material is ever in it. */
export interface StripeAccount {
  id: string | null;
  name: string | null;
  country: string | null;
  default_currency: string | null;
  charges_enabled: boolean;
  payouts_enabled: boolean;
  details_submitted: boolean;
}

export interface PaymentEvent {
  event_id: string;
  kind: string;
  livemode: boolean;
  amount_cents: number | null;
  currency: string | null;
  email: string | null;
  status: string | null;
  object_id: string | null;
  created_at: string;
}

export interface StripeStatus {
  mode: "test" | "live" | "unknown" | "missing";
  webhook_configured: boolean;
  webhook_url: string | null;
  test_amount_cents: number;
  test_currency: string;
  can_test_payment: boolean;
  /** Live keys: the request must carry confirm_live, so the panel asks first. */
  needs_confirm: boolean;
  account: StripeAccount | null;
  events: PaymentEvent[];
  error: string | null;
}

export interface StripeTestResult {
  ok: boolean;
  error: string | null;
  url: string | null;
  id?: string;
  mode?: string;
}
