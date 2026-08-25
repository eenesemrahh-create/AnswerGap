import type {
  Country,
  Meta,
  SearchLanguage,
  Tree,
  TreeSummary,
} from "./types";

const BASE = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:8000";

export const API_BASE = BASE;

/** Error shaped for translation: the UI picks the message, we supply the facts. */
export class ApiError extends Error {
  constructor(
    public readonly kind: "unreachable" | "http",
    public readonly values: Record<string, string | number>
  ) {
    super(kind);
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
    throw new ApiError("http", {
      status: response.status,
      statusText: response.statusText,
      path,
    });
  }
  return (await response.json()) as T;
}

export const fetchMeta = () => get<Meta>("/api/meta");
export const fetchTrees = () => get<TreeSummary[]>("/api/trees");
export const fetchTree = (slug: string) => get<Tree>(`/api/tree/${slug}`);
export const fetchCountries = () => get<Country[]>("/api/countries");
export const fetchLanguages = () => get<SearchLanguage[]>("/api/languages");
