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
