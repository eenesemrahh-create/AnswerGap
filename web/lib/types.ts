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
  tree_count: number;
  default_location_code: number;
  default_language_code: string;
  /** Size of the labelled set the threshold question has to work with. */
  labels: LabelCounts;
  /**
   * Who is looking. One value today, and the whole point is that the UI asks.
   * When sign-in arrives this comes from a session instead of a constant and
   * nothing else changes - a screen that has never had to ask is far harder to
   * retrofit than one that always asked and always got the same answer.
   */
  role: "developer";
  /** Real per-request cost in USD. Not credits - see `Pricing`. */
  pricing: Pricing;
  /** What the storage layer did at boot. Null when no database is configured. */
  storage?: StorageState;
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
  rows: { questions: number; gap_scores: number; serp_snapshots: number };
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
