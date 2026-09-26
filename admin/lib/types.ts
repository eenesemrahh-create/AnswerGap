/** Shapes returned by /api/admin/*. Mirrors api/admin.py. */

export interface Overview {
  users: { total: number; active: number; suspended: number; new_7d: number };
  credits: { granted: number; spent: number; outstanding: number };
  usage: { allowed_today: number; anonymous_today: number; refused_today: number };
  spend: { attributed_usd: number; live_usd: number; standard_usd: number };
  settings: Settings;
}

export interface Settings {
  signup_credits: number;
}

export interface UserRow {
  id: number;
  email: string;
  name: string | null;
  picture_url: string | null;
  /** `erased` is set by `db.user_erase` and cleared only by a revival.
   *  It is carried on `status` as well as on `erased_at` so that the
   *  sign-in paths already written as `status != "active"` refuse an
   *  erased account without any of them having to learn a new idea. */
  status: "active" | "suspended" | "erased";
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

/**
 * One subscription, paid or assigned.
 *
 * `source` is the whole difference. A `stripe` row is mirrored from a real
 * subscription and only Stripe may end it; an `admin` row was handed out from
 * this panel, carries no `stripe_subscription_id`, and is the only kind the
 * revoke button can touch.
 */
export interface SubscriptionRow {
  id: number;
  stripe_subscription_id: string | null;
  plan_id: string | null;
  status: string;
  credits_per_period: number;
  current_period_end: string | null;
  cancel_at_period_end: boolean;
  source: "stripe" | "admin";
  /** Which admin assigned it. Null on a paid row - nobody did. */
  granted_by: string | null;
  note: string | null;
  created_at: string;
  /**
   * Entitled RIGHT NOW. Not the same as `status === "active"`: nothing
   * renews an assigned plan, so one whose period has passed still says
   * `active` and is no longer live. Computed by the database on read, because
   * the moment a plan lapses is exactly when somebody is looking at it.
   */
  live: boolean;
}

export interface UserDetail extends UserRow {
  token_epoch: number;
  /** When the account was erased, or null. The authoritative flag; `status`
   *  carries the same fact so the existing refusals work unchanged. */
  erased_at: string | null;
  is_admin: boolean;
  ledger: LedgerRow[];
  usage: UsageRow[];
  crawls: CrawlRow[];
  /** Every subscription, newest first - not just the live one. The question
   *  on this page is "why does this person have what they have", and a trial
   *  assigned in March is half the answer to a complaint made in June. */
  subscriptions: SubscriptionRow[];
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
  /** The same plan billed annually, per month. Empty means no annual rate,
   *  which is how every row saved before 2026-09-23 reads - the landing has
   *  no monthly/annual switch and never sends one. */
  price_annual: string;
  per: string;
  /** The small caps line above the feature list on `/pricing`. Optional for
   *  the same backward-compatibility reason; the landing draws no such line. */
  features_heading: string;
  features: string[];
  cta: string;
  badge: string | null;
  /**
   * The Stripe Price this card sells, PASTED from the Stripe dashboard.
   * Nothing here mints billable objects - a product that could create its own
   * prices could create the wrong one, and the dashboard is where a price is
   * reviewed before it can charge anybody.
   *
   * Empty means not purchasable: `POST /api/billing/checkout` answers
   * `planNotPurchasable` rather than sending somebody to a broken Stripe page.
   * That is the state every card ships in.
   */
  stripe_price_id: string;
  /** The annual Price for the same plan. Empty means the annual toggle has
   *  nothing to sell, whatever `price_annual` advertises. */
  stripe_price_id_annual: string;
  /**
   * Credits one paid period grants. A REAL FIELD, not parsed out of
   * "300 credits per month" - that is a sentence an operator will reword or
   * translate, and a regex over it would hand somebody the wrong number of
   * credits the first time they did.
   */
  credits: number;
}

export interface Pricing {
  plans: Plan[];
}

/** Set once and read in both the client editor and the server action. */
export const PRICING_MAX_PLANS = 4;
/** Raised from 8 on 2026-09-23: the approved Pro card carries twelve bullets.
 *  Must stay in step with `PRICING_MAX_FEATURES` in api/admin.py, which is the
 *  one that actually refuses a save. */
export const PRICING_MAX_FEATURES = 12;

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
    desc: "For creators and small teams building visibility in AI search.",
    price: "$9.99",
    price_annual: "$7.99",
    per: "/month",
    features_heading: "Best starter plan",
    features: [
      "100 credits per month",
      "Unlimited users",
      "All regions",
      "All languages",
      "PNG image export",
      "24-hour search history",
    ],
    cta: "Start 7-Day Trial",
    badge: null,
    stripe_price_id: "",
    stripe_price_id_annual: "",
    credits: 100,
  },
  {
    id: "lite",
    enabled: false,
    theme: "dark",
    name: "Lite",
    desc: "For SEO professionals scaling AI search authority.",
    price: "$19.99",
    price_annual: "$15.99",
    per: "/month",
    features_heading: "Most popular",
    features: [
      "300 credits per month",
      "Unlimited users",
      "All regions",
      "All languages",
      "PNG image export",
      "1-month search history",
      "Deep search",
      "CSV data export",
    ],
    cta: "Go Lite",
    badge: "Most Popular",
    stripe_price_id: "",
    stripe_price_id_annual: "",
    credits: 300,
  },
  {
    id: "pro",
    enabled: false,
    theme: "light",
    name: "Pro",
    desc: "For high-volume teams and agencies requiring white-labeling.",
    price: "$39.99",
    price_annual: "$31.99",
    per: "/month",
    features_heading: "Best value for money",
    features: [
      "1,000 credits per month",
      "Unlimited users",
      "All regions",
      "All languages",
      "PNG image export",
      "1-year search history",
      "Deep search",
      "CSV data export",
      "Bulk searches",
      "API access",
      "Pay-as-you-go credits",
      "MCP server",
    ],
    cta: "Go Pro",
    badge: null,
    stripe_price_id: "",
    stripe_price_id_annual: "",
    credits: 1000,
  },
  {
    id: "enterprise",
    enabled: false,
    theme: "violet",
    name: "Enterprise",
    desc: "For large organizations with custom volume and custom terms.",
    price: "Custom",
    price_annual: "",
    per: "contact us",
    features_heading: "Talk to us",
    features: [
      "Custom volume pricing",
      "White-label reports",
      "Multiple workspaces",
      "Scheduled crawls",
      "SSO and audit logs",
      "Dedicated support",
    ],
    cta: "Contact Sales",
    badge: null,
    // No Stripe price and no credit figure ON PURPOSE. This card says
    // "contact us", so its terms are agreed in a conversation and then
    // assigned by hand from the user page. A number here would be a quote
    // nobody gave.
    stripe_price_id: "",
    stripe_price_id_annual: "",
    credits: 0,
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

/* --- Reports -------------------------------------------------------
 *
 * Costs arrive as numbers of DOLLARS, not cents: `usage_event.spend_usd` is
 * NUMERIC(12,6) because a single search costs about $0.0026 and cents cannot
 * hold it. Revenue arrives in CENTS, because Stripe speaks cents. The two
 * units sit side by side in the same table, so the formatters are different
 * on purpose - `usd()` for the first, `cents()` for the second.
 */

export interface MonthUsage {
  month: string;
  /** Requests that actually cost money. Cache hits are free and excluded. */
  billable: number;
  /** Every request, including cache hits and refusals. */
  attempts: number;
  refused: number;
  cost_usd: number;
  credits_spent: number;
  /** The four-way split of the SAME dollars, so these sum to `cost_usd`. */
  cost_customer: number;
  cost_admin: number;
  cost_anonymous: number;
  /** Erased accounts: `user_erase` blanks every identifier by design. */
  cost_unattributed: number;
  active_accounts: number;
  revenue_cents: number;
  payments: number;
}

export interface UserUsage {
  id: number;
  email: string;
  status: "active" | "suspended" | "erased";
  created_at: string;
  last_seen_at: string | null;
  is_admin: boolean;
  billable: number;
  attempts: number;
  refused: number;
  cost_usd: number;
  credits_spent: number;
  credits_left: number;
  paid_cents: number;
  last_activity: string | null;
}

export interface Reports {
  months: MonthUsage[];
  users: UserUsage[];
  window_months: number;
  totals: {
    usage: {
      billable: number;
      attempts: number;
      refused: number;
      cost_usd: number;
      cost_admin: number;
      credits_spent: number;
      accounts_active: number;
      first_event: string | null;
    };
    money: { revenue_cents: number; payments: number; test_payments: number };
    credits: { granted: number; spent: number };
    /** `usage_event` is best-effort and only exists since accounts shipped.
     *  `crawl.spend` + `serp_task.cost` are the provider's own receipts and
     *  predate it, so the difference is money we spent and cannot trace. */
    reconcile: {
      attributed_usd: number;
      provider_usd: number;
      unattributed_usd: number;
    };
  };
}
