import type {
  BatchPlan,
  Country,
  DevSpend,
  DiffResult,
  JobsStatus,
  LabelResult,
  Me,
  Meta,
  Plan,
  ScoreResult,
  SearchLanguage,
  SearchResult,
  Tree,
  TreeSummary,
  Verdict,
} from "./types";
import { anonId, clearToken, token } from "./auth";

const BASE = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:8000";

export const API_BASE = BASE;

/** Error shaped for translation: the UI picks the message, we supply the facts.
 *
 * `kind` is what the UI translates. A crawl can fail in ways the user can act
 * on — no credentials, budget ceiling hit, DataForSEO itself down — and those
 * deserve distinct advice, so the HTTP status is mapped to a kind here rather
 * than the server's English `detail` being printed into a five-language UI.
 * `detail` is carried anyway and shown as secondary technical text.
 *
 * EVERY MEMBER OF THIS UNION NEEDS AN `error.<kind>` KEY IN ALL FIVE LOCALES.
 * Errors render as t(`error.${kind}`), and i18n's lookup falls back to the raw
 * key when a message is missing — so a forgotten translation shows a customer
 * the literal text "error.noCredits" at the exact moment something went wrong.
 * Nothing in the type system catches that link; this comment is the only guard.
 */
export type ErrorKind =
  | "unreachable"
  | "http"
  | "noCredentials"
  | "budget"
  | "upstream"
  | "badRequest"
  | "signedOut"
  | "noCredits"
  | "anonLimit"
  | "suspended";

export class ApiError extends Error {
  constructor(
    public readonly kind: ErrorKind,
    public readonly values: Record<string, string | number>,
    public readonly detail?: string
  ) {
    super(kind);
  }
}

/** A server-supplied code wins; otherwise fall back to the status.
 *
 * The code matters because 429 is already taken. It means the DataForSEO
 * request ceiling, and `error.budget` tells the reader the crawl stopped rather
 * than spend more — which is advice for a completely different problem than
 * "your daily free search is used up". So the gate sends a code, and a 429
 * WITHOUT one still maps to `budget` exactly as before.
 */
const CODES: Record<string, ErrorKind> = {
  signedOut: "signedOut",
  noCredits: "noCredits",
  anonLimit: "anonLimit",
  suspended: "suspended",
  accountsOff: "noCredentials",
};

function kindFor(status: number, code?: string): ErrorKind {
  if (code && CODES[code]) return CODES[code];
  if (status === 503) return "noCredentials";
  if (status === 429) return "budget";
  if (status === 502) return "upstream";
  if (status === 400 || status === 409) return "badRequest";
  return "http";
}

/** Pull FastAPI's `{ "detail": ... }` out without letting a parse failure win.
 *
 * `detail` is a string on every endpoint written before accounts existed and a
 * dict on the gated ones. Both shapes have to keep working.
 */
async function parseError(
  response: Response
): Promise<{ detail?: string; code?: string }> {
  try {
    const body = await response.json();
    const detail = (body as { detail?: unknown }).detail;
    if (typeof detail === "string") return { detail };
    if (detail && typeof detail === "object") {
      const d = detail as { code?: unknown; message?: unknown };
      return {
        code: typeof d.code === "string" ? d.code : undefined,
        detail: typeof d.message === "string" ? d.message : undefined,
      };
    }
    return {};
  } catch {
    return {};
  }
}

/** Identity on every request, set in ONE place so no call site can forget it. */
function authHeaders(): Record<string, string> {
  const headers: Record<string, string> = { "X-AG-Anon": anonId() };
  const session = token();
  if (session) headers.Authorization = `Bearer ${session}`;
  return headers;
}

async function get<T>(path: string): Promise<T> {
  let response: Response;
  try {
    response = await fetch(`${BASE}${path}`, {
      cache: "no-store",
      headers: authHeaders(),
    });
  } catch {
    // Overwhelmingly the most common failure: the backend is not running.
    // Say that, rather than surfacing a bare "fetch failed".
    throw new ApiError("unreachable", { url: BASE });
  }
  if (!response.ok) {
    const { detail, code } = await parseError(response);
    throw new ApiError(
      kindFor(response.status, code),
      { status: response.status, statusText: response.statusText, path },
      detail
    );
  }
  return (await response.json()) as T;
}

async function post<T>(path: string, payload?: unknown): Promise<T> {
  let response: Response;
  try {
    response = await fetch(`${BASE}${path}`, {
      method: "POST",
      headers: { "Content-Type": "application/json", ...authHeaders() },
      body: JSON.stringify(payload ?? {}),
      cache: "no-store",
    });
  } catch {
    throw new ApiError("unreachable", { url: BASE });
  }
  if (!response.ok) {
    const { detail, code } = await parseError(response);
    throw new ApiError(
      kindFor(response.status, code),
      { status: response.status, statusText: response.statusText, path },
      detail
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

/**
 * Queue gap scoring for several questions at once, on the Standard queue.
 *
 * `dry_run` returns the plan and its price without spending anything, and the
 * UI always asks for that first: a batch is exactly where a surprise would be
 * expensive. Results do NOT come back here - tasks land minutes later, so the
 * caller polls `fetchJobs`.
 */
export const scoreBatch = (
  slug: string,
  input: { questions?: string[]; top_n?: number; dry_run?: boolean }
) => post<BatchPlan>(`/api/tree/${slug}/score-batch`, input);

/** Queued scoring for one tree. Also sweeps stranded tasks on the way past. */
export const fetchJobs = (slug: string) =>
  get<JobsStatus>(`/api/tree/${slug}/jobs`);

/**
 * What has been spent, reported rather than estimated. Developer view only.
 *
 * Pass a slug to scope it to one tree - "what did THIS analysis cost" is the
 * question a developer looking at a tree is actually asking. The grand total
 * comes back either way.
 */
export const fetchDevSpend = (slug?: string) =>
  get<DevSpend>(`/api/dev/spend${slug ? `?slug=${encodeURIComponent(slug)}` : ""}`);

/** What Google changed between this seed's two most recent crawls. */
export const fetchDiff = (slug: string) =>
  get<DiffResult>(`/api/tree/${slug}/diff`);

export const fetchMeta = () => get<Meta>("/api/meta");
export const fetchTrees = () => get<TreeSummary[]>("/api/trees");
export const fetchTree = (slug: string) => get<Tree>(`/api/tree/${slug}`);
export const fetchCountries = () => get<Country[]>("/api/countries");
export const fetchLanguages = () => get<SearchLanguage[]>("/api/languages");

/** Pricing plans shown on the landing. Empty list -> use i18n fallback. */
export const fetchPricing = () => get<{ plans: Plan[] }>("/api/pricing");

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

// --------------------------------------------------------------- accounts

/** The signed-in user and their balance.
 *
 * Deliberately NOT part of `/api/meta`: that endpoint is Railway's healthcheck
 * path and must never touch the database, so the balance — which can only come
 * from a query — lives here and is fetched only when a token exists.
 */
export const fetchMe = () => get<Me>("/api/me");

/** Send the browser to Google. A full navigation, not a fetch.
 *
 * `return_to` is checked against an allowlist server-side, by exact origin. The
 * API redirects back here with the token in a URL fragment.
 */
export function signIn(): void {
  if (typeof window === "undefined") return;
  const returnTo = encodeURIComponent(window.location.origin);
  window.location.href = `${BASE}/api/auth/google/start?return_to=${returnTo}`;
}

/** Sign out locally. There is no server call and there does not need to be:
 * the token is stateless, and an admin who needs a session killed everywhere
 * bumps the user's token epoch from the panel.
 */
export function signOut(): void {
  clearToken();
  if (typeof window !== "undefined") window.location.reload();
}
