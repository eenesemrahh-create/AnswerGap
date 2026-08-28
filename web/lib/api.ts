import type {
  Country,
  LabelResult,
  Meta,
  ScoreResult,
  SearchLanguage,
  SearchResult,
  Tree,
  TreeSummary,
  Verdict,
} from "./types";

const BASE = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:8000";

export const API_BASE = BASE;

/** Error shaped for translation: the UI picks the message, we supply the facts.
 *
 * `kind` is what the UI translates. A crawl can fail in ways the user can act
 * on — no credentials, budget ceiling hit, DataForSEO itself down — and those
 * deserve distinct advice, so the HTTP status is mapped to a kind here rather
 * than the server's English `detail` being printed into a five-language UI.
 * `detail` is carried anyway and shown as secondary technical text.
 */
export type ErrorKind =
  | "unreachable"
  | "http"
  | "noCredentials"
  | "budget"
  | "upstream"
  | "badRequest";

export class ApiError extends Error {
  constructor(
    public readonly kind: ErrorKind,
    public readonly values: Record<string, string | number>,
    public readonly detail?: string
  ) {
    super(kind);
  }
}

function kindFor(status: number): ErrorKind {
  if (status === 503) return "noCredentials";
  if (status === 429) return "budget";
  if (status === 502) return "upstream";
  if (status === 400 || status === 409) return "badRequest";
  return "http";
}

/** Pull FastAPI's `{ "detail": ... }` out without letting a parse failure win. */
async function detailOf(response: Response): Promise<string | undefined> {
  try {
    const body = await response.json();
    const detail = (body as { detail?: unknown }).detail;
    return typeof detail === "string" ? detail : undefined;
  } catch {
    return undefined;
  }
}

async function get<T>(path: string): Promise<T> {
  let response: Response;
  try {
    response = await fetch(`${BASE}${path}`, { cache: "no-store" });
  } catch {
    // Overwhelmingly the most common failure: the backend is not running.
    // Say that, rather than surfacing a bare "fetch failed".
    throw new ApiError("unreachable", { url: BASE });
  }
  if (!response.ok) {
    throw new ApiError(
      kindFor(response.status),
      { status: response.status, statusText: response.statusText, path },
      await detailOf(response)
    );
  }
  return (await response.json()) as T;
}

async function post<T>(path: string, payload?: unknown): Promise<T> {
  let response: Response;
  try {
    response = await fetch(`${BASE}${path}`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload ?? {}),
      cache: "no-store",
    });
  } catch {
    throw new ApiError("unreachable", { url: BASE });
  }
  if (!response.ok) {
    throw new ApiError(
      kindFor(response.status),
      { status: response.status, statusText: response.statusText, path },
      await detailOf(response)
    );
  }
  return (await response.json()) as T;
}

export interface SearchInput {
  seed: string;
  location_code: number;
  language_code: string;
  /** Cached crawls are free; a refresh re-fetches and costs a credit. */
  refresh?: boolean;
  /** Returns the request plan and its price without spending anything. */
  dry_run?: boolean;
}

export const search = (input: SearchInput) =>
  post<SearchResult>("/api/search", input);

/** Gap-scores ONE question. One billable SERP request, or zero if cached. */
export const scoreQuestion = (
  slug: string,
  questionSlug: string,
  refresh = false
) =>
  post<ScoreResult>(
    `/api/tree/${slug}/question/${questionSlug}/score?refresh=${refresh}`
  );

export const fetchMeta = () => get<Meta>("/api/meta");
export const fetchTrees = () => get<TreeSummary[]>("/api/trees");
export const fetchTree = (slug: string) => get<Tree>(`/api/tree/${slug}`);
export const fetchCountries = () => get<Country[]>("/api/countries");
export const fetchLanguages = () => get<SearchLanguage[]>("/api/languages");

/** Verdicts already recorded on this tree's questions, by question slug. */
export const fetchLabels = (slug: string) =>
  get<Record<string, Verdict>>(`/api/tree/${slug}/labels`);

/**
 * Record a human verdict on one gap score. Free — never a billable request.
 *
 * `"?"` retracts a previous verdict. It is sent as a value rather than as a
 * DELETE because the store is append-only: withdrawing a judgement is itself a
 * judgement, and overwriting history is the mistake this whole layer avoids.
 */
export const submitLabel = (
  slug: string,
  questionSlug: string,
  label: Verdict | "?"
) =>
  post<LabelResult>(`/api/tree/${slug}/question/${questionSlug}/label`, {
    label,
  });
