/** Mirrors the API model produced by `answergap/tree.py`. */

export type Status = "gap" | "weak" | "covered" | "no_data";

export const STATUSES: Status[] = ["gap", "weak", "covered", "no_data"];

/** Swatch colours. Defined once in globals.css; referenced, never duplicated. */
export const STATUS_COLOR: Record<Status, string> = {
  gap: "var(--gap)",
  weak: "var(--weak)",
  covered: "var(--covered)",
  no_data: "var(--nodata)",
};

export interface Result {
  title: string;
  url: string;
  domain: string;
  overlap: number;
}

export interface Node {
  id: string;
  slug: string;
  question: string;
  /** How much of the seed's meaning this question still carries, 0–1. */
  relevance: number | null;
  /** `relevance` decayed along the path from the root — what the crawler gates on. */
  reach: number | null;
  /** "harvest": found inside a response bought to gap-score another question. */
  discovered_by: "paa" | "harvest";
  depth: number;
  parent_id: string | null;
  parents: string[];
  repeat_count: number;
  status: Status;
  matching_pages: number;
  results_checked: number;
  results: Result[];
  ai_sources: string[];
  /** What that list means. "unresolved" = Google's AI answer could not be read;
   *  null = scored before this was recorded. Both are unknown, never "none". */
  ai_state: "cited" | "none" | "unresolved" | "absent" | null;
  source_file: string | null;
  updated_at: string | null;
}

export interface TreeSummary {
  seed: string;
  slug: string;
  language_code: string;
  language_name: string;
  location_code: number | null;
  node_count: number;
  status_counts: Record<Status, number>;
  threshold: number;
  strategy: string;
  threshold_validated: boolean;
  updated_at: string | null;
  /** "live" for a crawl the user ran; absent for the Phase 0 archive. */
  source?: string;
  /**
   * Query phrases Google shows alongside the results, accumulated across every
   * response fetched for this tree. NOT questions, so they are never nodes —
   * they are the next seeds to search.
   */
  related_searches?: string[];
}

export interface Tree extends TreeSummary {
  nodes: Node[];
  /** Requests actually billed by the call that produced this tree. */
  billable_calls?: number;
  estimated_spend?: number;
  /** True when the crawl was served from cache and cost nothing. */
  from_cache?: boolean;
}

/** `POST /api/search` with `dry_run: true` — the plan and its price, no data. */
export interface DryRun {
  dry_run: true;
  planned: string[];
  estimated_spend: number;
}

export type SearchResult = Tree | DryRun;

export function isDryRun(result: SearchResult): result is DryRun {
  return (result as DryRun).dry_run === true;
}

/** A question the relevance gate refused to add to the tree. */
export interface DroppedQuestion {
  question: string;
  relevance: number;
  reach: number;
}

/**
 * `POST /api/tree/{slug}/question/{slug}/score`.
 *
 * Scoring is also a discovery call: the response carries a PAA block and a set
 * of related searches beyond the organic results being scored. So the reply is
 * not just the scored node — `nodes` is the whole updated list, because the
 * harvest can also add parents to questions already on screen.
 */
export interface ScoreResult {
  node: Node;
  nodes: Node[];
  /** Newly added by the harvest. Only for telling the user what it found. */
  discovered: Node[];
  /** Refused by the relevance gate. Shown so a bounded crawl says it is bounded. */
  dropped: DroppedQuestion[];
  related_searches: string[];
  status_counts: Record<Status, number>;
  node_count: number;
}

/**
 * A human verdict on a gap score. `G` gap · `N` not a gap.
 *
 * Phase 0.5 measured the metric against 14 hand-labelled questions and the best
 * of 72 rules reached precision 0.20 — the one real gap was never separated
 * from four false ones. Fourteen labels cannot settle that, so the product
 * collects them as a by-product of use.
 */
export type Verdict = "G" | "N";

/** How much labelled data exists. Shown so the UI can say why it is asking. */
export interface LabelCounts {
  gap: number;
  not_gap: number;
  questions: number;
  /** Includes superseded verdicts; the log is append-only. */
  verdicts: number;
}

/** `POST .../label` — the tree's verdicts after the vote, and the global tally. */
export interface LabelResult {
  labels: Record<string, Verdict>;
  counts: LabelCounts;
}

export interface Meta {
  source: string;
  live: boolean;
  threshold: number;
  strategy: string;
  threshold_validated: boolean;
  search_volume_available: boolean;
  live_crawl_available: boolean;
  default_location_code: number;
  default_language_code: string;
  /** Size of the labelled set the threshold question has to work with. */
  labels: LabelCounts;
  /**
   * Who is looking. This now comes from the session, exactly as the hard-coded
   * `"developer"` version predicted it would - and the prediction held: the
   * only change in DevPanel was the value it compares against.
   *
   * Derived server-side from the token's own email claim against ADMIN_EMAILS,
   * with no database query, because `/api/meta` is the deployment healthcheck.
   * It grants nothing on its own: every admin endpoint reloads the row.
   */
  role: Role;
  /**
   * Whether sign-in is configured at all. False on a machine with no
   * SESSION_SECRET or no database - the product then behaves exactly as it did
   * before accounts existed, and the UI hides the account menu rather than
   * offering a button that cannot work.
   */
  accounts_enabled: boolean;
  /**
   * Whether the GOOGLE door specifically is configured. Split from
   * `accounts_enabled` when password sign-in arrived: a deployment with no
   * Google client still runs email accounts perfectly well, and the dialog
   * must not draw a button whose only possible answer is 503.
   */
  google_enabled?: boolean;
  /**
   * `"resend"` (mail really goes out) or `"console"` (it is printed to the
   * server log). Shown to a developer so that "no verification mail arrived"
   * on a local machine reads as configuration rather than as a bug.
   */
  mail_backend?: "resend" | "console";
  /** Real per-request cost in USD. Not credits - see `Pricing`. */
  pricing: Pricing;
  /** What the storage layer did at boot. Null when no database is configured. */
  storage?: StorageState;
}

export type Role = "anonymous" | "user" | "admin";

/**
 * The signed-in user. Fetched from `/api/me`, never from `/api/meta`.
 *
 * The balance can only come from a query, and `/api/meta` is the healthcheck
 * path - a SELECT there would cost ~150 ms on every page load and a restart
 * loop whenever the database hiccuped.
 */
export interface Me {
  email: string;
  name: string | null;
  picture_url: string | null;
  /** `erased` is set by `db.user_erase` and cleared only by a revival.
   *  It is carried on `status` as well as on `erased_at` so that the
   *  sign-in paths already written as `status != "active"` refuse an
   *  erased account without any of them having to learn a new idea. */
  status: "active" | "suspended" | "erased";
  /** May be negative: a debit is unconditional because the money is already
   * spent upstream by the time it is written. Shown as-is rather than clamped. */
  credits: number;
  /**
   * Whether the address has been proven. Drives the banner and the resend
   * button. An unverified account can sign in and look around but cannot
   * spend - its signup credits are not granted until this turns true, so the
   * gate refuses it with `emailUnverified` rather than `noCredits`, which
   * would be true and useless advice.
   */
  email_verified?: boolean;
  /** Which doors this account can use. Both can be true once linked. */
  has_password?: boolean;
  has_google?: boolean;
  role: Role;
}

/**
 * The underlying cost of a request, in dollars.
 *
 * Customers will be priced in credits; a developer needs this, because the
 * argument for the Standard queue is a comparison that can only be made in the
 * currency actually being spent.
 */
export interface Pricing {
  live_per_request: number;
  standard_per_request: number;
  click_surcharge: number;
  click_depth: number;
}

export interface StorageState {
  configured: boolean;
  ok: boolean;
  tables: string[];
  applied: string[];
  error: string | null;
}

/** What a batch would cost, or what it just queued. */
export interface BatchPlan {
  queued: string[];
  skipped: { slug: string; reason: string }[];
  count: number;
  /** Always present, dry run or not: the price is visible before it is spent. */
  estimated_spend: number;
  queue: "standard";
  callback: boolean;
  dry_run?: boolean;
  /** Reported by DataForSEO once the tasks are actually posted. */
  spend?: number;
  posted?: {
    slug: string | null;
    task_id: string | null;
    cost: number | null;
    error: string | null;
  }[];
}

export interface Job {
  task_id: string;
  cache_key: string;
  keyword: string;
  status: "posted" | "done" | "failed";
  cost: number | null;
  error: string | null;
  posted_at: string;
  completed_at: string | null;
}

export interface JobsStatus {
  tasks: Job[];
  pending: number;
  done: number;
  failed: number;
  task_count: number;
  spend: number;
  swept: { checked: number; ingested: number; errors: string[] } | null;
}

/** Everything spent so far, split by how it was bought. Reported, not estimated. */
export interface DevSpend {
  live: { crawls: number; requests: number; spend: number };
  standard: {
    tasks: number;
    spend: number;
    pending: number;
    failed: number;
    /** What the same queued work would have cost on Live. */
    if_live: number;
  };
  total: number;
  rows: {
    questions: number;
    /** Null when scoped to one tree - a per-tree score count is not meaningful. */
    gap_scores: number | null;
    serp_snapshots: number;
  };
  /** Which tree this is scoped to, or null for everything. */
  slug: string | null;
  /** Spent across the whole project, whatever the scope above. */
  grand_total: number;
  storage: StorageState;
  callback_configured: boolean;
}

export interface Country {
  code: number;
  name: string;
  iso: string;
  languages: string[];
}

export interface SearchLanguage {
  code: string;
  name: string;
}

/** One question that appeared or disappeared between two crawls. */
export interface DiffQuestion {
  question: string;
  normalized: string;
  depth: number;
}

/**
 * What Google changed between the two most recent crawls of a seed.
 *
 * Order changes never appear here - CLAUDE.md: PAA ordering moves for an
 * identical query, and notifying on it would drown users in false alarms.
 */
export interface CrawlDiff {
  current: { crawl_id: number; at: string };
  previous: { crawl_id: number; at: string };
  added: DiffQuestion[];
  removed: DiffQuestion[];
  unchanged: number;
  crawl_count: number;
}

export interface CrawlRun {
  crawl_id: number;
  at: string;
  questions: number;
  spend: number;
  billable_calls: number;
}

export interface DiffResult {
  /** `null` when there is only one crawl: nothing to compare is not "no change". */
  diff: CrawlDiff | null;
  history: CrawlRun[];
}

/**
 * A row in the marketing landing's pricing section. Stored as a JSON array in
 * `app_setting.pricing_plans` and edited from the admin panel.
 *
 * `featured` and `badge` decouple deliberately: a plan can be visually
 * highlighted (dark card, brighter checks) without a badge, or carry a badge
 * without the highlight. The landing reads both independently.
 *
 * `enabled` is the publish switch. The admin keeps four card slots on
 * screen and only enabled cards reach the landing. When NO cards are enabled
 * (or the whole array is empty) the landing renders the hardcoded i18n
 * defaults in `market.pricing.*` — that way a fresh install with no admin
 * write still shows a pricing section in every supported locale.
 */
/** Four discrete colour themes for a pricing card. Chosen as an enum, not a
 *  free colour, because a landing renders best when its cards look coherent -
 *  four preset choices from the brand family sit tidy; a hex picker would
 *  ship rainbows. */
export type PlanTheme = "light" | "violet" | "pink" | "dark";

export interface Plan {
  id: string;
  enabled: boolean;
  theme: PlanTheme;
  name: string;
  desc: string;
  price: string;
  per: string;
  features: string[];
  cta: string;
  badge: string | null;
}
