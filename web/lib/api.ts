import type {
  BatchPlan,
  Country,
  CreditEntry,
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
import { anonId, clearToken, setToken, token } from "./auth";

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
  | "notFound"
  | "http"
  | "noCredentials"
  | "budget"
  | "upstream"
  | "badRequest"
  | "signedOut"
  | "noCredits"
  | "suspended"
  | "serverError"
  // --- email + password sign-in ---------------------------------------
  | "badCredentials"
  | "emailUnverified"
  | "tooManyAttempts"
  | "passwordTooShort"
  | "passwordTooCommon"
  | "resetExpired"
  | "invalidEmail"
  | "googleOff";

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
 * than spend more — which is advice for a completely different problem than a
 * refusal about who is asking. So the gate sends a code, and a 429 WITHOUT one
 * still maps to `budget` exactly as before.
 */
const CODES: Record<string, ErrorKind> = {
  signedOut: "signedOut",
  noCredits: "noCredits",
  // Retired with the anonymous daily allowance on 2026-09-23, and kept here
  // pointing at `signedOut` on purpose: web and api deploy separately, so a
  // browser holding the new bundle can still be answered by the old API for a
  // few minutes. Dropping the row would send that refusal to the 429 fallback
  // and tell the reader the crawl ran out of budget, when what they need is
  // the sign-in button — which is exactly what `signedOut` shows them.
  anonLimit: "signedOut",
  suspended: "suspended",
  // Something raised inside the request. Sent by the catch-all middleware in
  // `api/main.py`, which exists because Starlette answers an unhandled
  // exception OUTSIDE the CORS layer - so before it, every server bug reached
  // the browser as a network error and read as "the backend is down".
  serverError: "serverError",
  accountsOff: "noCredentials",
  // Sign-in refusals. `badCredentials` is deliberately the ONLY code the
  // server returns for "no such account", "no password on it" and "wrong
  // password" alike - three codes would be three answers to "does this
  // address have an account", which the API refuses to answer.
  badCredentials: "badCredentials",
  emailUnverified: "emailUnverified",
  tooManyAttempts: "tooManyAttempts",
  // Mail-sending caps share the attempts message; both say "wait a moment".
  tooManyRequests: "tooManyAttempts",
  passwordTooShort: "passwordTooShort",
  passwordTooLong: "passwordTooShort",
  passwordTooCommon: "passwordTooCommon",
  resetExpired: "resetExpired",
  invalidEmail: "invalidEmail",
  googleOff: "googleOff",
};

function kindFor(status: number, code?: string): ErrorKind {
  if (code && CODES[code]) return CODES[code];
  if (status === 503) return "noCredentials";
  // A 404 is the one status a customer reaches by their own navigation - a
  // mistyped slug, a bookmark to a tree that is gone. `http` renders it as
  // "404 — /api/tree/king-arthur-en-2840", which names our route rather than
  // their problem, so it gets a sentence of its own.
  if (status === 404) return "notFound";
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

/** What moved this account's balance, newest first.
 *
 * A separate call from `/api/me` on purpose: the balance is read on every page
 * that shows the account strip, and fifty ledger rows travelling with it
 * would be paid for everywhere to be read in one place.
 */
export const fetchCredits = () =>
  get<{ entries: CreditEntry[] }>("/api/me/credits");

/**
 * Start a Stripe Checkout for one plan and hand back the URL to go to.
 *
 * THE PRICE IS NOT SENT. The plan id is; the API looks its Stripe price up
 * server-side, which is the only thing standing between a client naming its
 * own price and a discount nobody authorised.
 *
 * Returns the URL rather than navigating, so the caller can keep its button
 * in a "working" state until the browser actually leaves - a checkout link
 * takes a second to mint, and a button that looks idle in that second gets
 * pressed twice.
 */
export const startCheckout = (planId: string, cycle: "monthly" | "annual") =>
  post<{ url: string }>("/api/billing/checkout", { plan_id: planId, cycle });

/**
 * A link into Stripe's billing portal: cancel, switch plan, change card,
 * download invoices.
 *
 * Everything it does is something we would otherwise have to build and keep
 * correct against Stripe's own state - and proration on a mid-period switch is
 * arithmetic this product has no business repeating.
 *
 * Answers `noCustomer` for an account that never bought anything, which is why
 * the button is only drawn for a subscription whose `source` is `stripe`.
 */
export const openBillingPortal = () =>
  post<{ url: string }>("/api/billing/portal", {});

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

/** What `signOut` does, named for the callers that are not signing out.
 *  Erasure ends the same way - drop the local copy of a token that is already
 *  dead server-side - but calling it "sign out" at that call site would read
 *  as if the account were still there. */
export const clearTokenAndReload = signOut;

/**
 * Delete your own account. The Privacy Policy's section 7, as a call.
 *
 * `confirm` is the password when the account has one, and the account's own
 * email address when it came through Google and does not. ONE field for both,
 * so the client never has to announce which kind of account an address is.
 *
 * A POST rather than a DELETE, following `submitLabel`: this codebase spends
 * its verbs on the two transports it has, and adding a third for one call is
 * twenty lines to say the same thing.
 *
 * Deliberately does NOT clear the token itself - the caller does, once it has
 * shown the person what happened. The token is already dead server-side
 * (erasure bumps the epoch), so there is no window to worry about.
 */
export const eraseAccount = (confirm: string, locale?: string) =>
  post<{ status: string }>("/api/account/erase", { confirm, locale });

/* ------------------------------------------------- email + password sign-in
 *
 * The second door. `login` and `resetPassword` return a session token exactly
 * as the Google redirect does, and `setToken` is the only thing either of them
 * does with it - nothing downstream can tell which door was used.
 *
 * `signUp` deliberately returns NO token. An account that has not proven its
 * address cannot hold a session at all, which is a stronger guarantee than any
 * check made after issuing one.
 */

/** What every non-session auth call answers with. Never says whether the
 *  address had an account: see the enumeration note in `api/auth.py`. */
export interface AuthStatus {
  status: "verificationSent" | "resetSent";
  email: string;
}

export const signUp = (input: {
  email: string;
  password: string;
  name?: string;
  locale?: string;
}) => post<AuthStatus>("/api/auth/signup", input);

export const resendVerification = (email: string, locale?: string) =>
  post<AuthStatus>("/api/auth/resend", { email, locale });

export const forgotPassword = (email: string, locale?: string) =>
  post<AuthStatus>("/api/auth/forgot", { email, locale });

/** Signs in on success - the token is stored before this resolves. */
export async function logIn(email: string, password: string): Promise<void> {
  const out = await post<{ token: string }>("/api/auth/login", {
    email,
    password,
  });
  if (out.token) setToken(out.token);
}

/** Redeems a reset link, sets the new password and signs in.
 *
 * Every OTHER session for this account dies here - the server bumps the token
 * epoch, because a reset exists precisely because the account may have been
 * reached by somebody else. The token stored below is the only one left alive.
 */
export async function resetPassword(
  resetToken: string,
  password: string
): Promise<void> {
  const out = await post<{ token: string }>("/api/auth/reset", {
    token: resetToken,
    password,
  });
  if (out.token) setToken(out.token);
}

export interface ContactMessage {
  name: string;
  email: string;
  company: string;
  subject: string;
  message: string;
}

/** Sends the contact form. Nothing is stored; the API mails it and forgets it.
 *
 * Deliberately NOT authenticated - the people most likely to use it are the
 * ones who have not signed up yet, which is also why the endpoint carries its
 * own per-IP rate limit rather than leaning on the gate.
 */
export async function sendContactMessage(message: ContactMessage): Promise<void> {
  await post<{ ok: boolean }>("/api/contact", message);
}
