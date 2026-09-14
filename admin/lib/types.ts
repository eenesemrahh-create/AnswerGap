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
