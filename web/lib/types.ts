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

/** `POST /api/tree/{slug}/question/{slug}/score`. */
export interface ScoreResult {
  node: Node;
  status_counts: Record<Status, number>;
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
