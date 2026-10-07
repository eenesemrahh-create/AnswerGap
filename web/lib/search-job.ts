"use client";

import { useSyncExternalStore } from "react";
import { ApiError, fetchTrees, search as runSearch } from "./api";
import { isDryRun } from "./types";

/**
 * The search in flight, outliving the page that started it.
 *
 * A search is one request that takes 30-60 seconds. It used to live in the
 * landing page's own state, so going to another page and coming back showed
 * an idle box while the server was still crawling - and later finished and
 * saved the tree with nothing on screen to say so. The work was never lost;
 * the screen just forgot it.
 *
 * Two layers:
 *  - in memory, for navigation inside the app: the request's promise is
 *    still running after the landing unmounts, and resolves into here;
 *  - in localStorage, for a reload or a closed tab, where that promise is
 *    gone. Then the job is RECOVERED by watching the analyses list for the
 *    tree to appear - the server saves it before it answers, so if the crawl
 *    finished, the tree is there.
 *
 * Only one search at a time, as before: the box is disabled while one runs.
 */
export type JobStatus = "running" | "recovering" | "done" | "failed" | "lost";

export interface SearchJob {
  seed: string;
  location: number;
  language: string;
  /** ms since epoch. Elapsed time is measured from here, so it is right
   *  whenever the reader comes back. */
  startedAt: number;
  status: JobStatus;
  /** The tree, once there is one. */
  slug?: string;
  finishedAt?: number;
  /** A failed search's error, as plain data so it survives storage. */
  error?: { kind: string; values: Record<string, string | number>; detail?: string };
}

const KEY = "answergap.search";
/** How long a recovered job is watched for before it is called lost. A crawl
 *  takes 30-60 s; three minutes covers a slow one with room to spare. */
const RECOVERY_WINDOW_MS = 3 * 60 * 1000;
const POLL_MS = 5000;

let job: SearchJob | null = null;
let loaded = false;
let recovering = false;
const listeners = new Set<() => void>();

/* A reload or a closed tab ABORTS the open request, and the browser reports
   that as a network error - which, recorded as "failed", is exactly wrong:
   the server is still crawling. While the page is going away, an error is
   not a verdict; the job stays "running" in storage and the next page load
   recovers it. Found by reloading mid-search in a real browser. */
let unloading = false;
if (typeof window !== "undefined") {
  window.addEventListener("pagehide", () => {
    unloading = true;
  });
  window.addEventListener("beforeunload", () => {
    unloading = true;
  });
}

function save() {
  try {
    if (job) localStorage.setItem(KEY, JSON.stringify(job));
    else localStorage.removeItem(KEY);
  } catch {
    // Storage blocked: the in-memory half still works within this tab.
  }
}

function set(next: SearchJob | null) {
  job = next;
  save();
  listeners.forEach((l) => l());
}

/** Read the stored job once per page load, and resume watching it if the
 *  request that started it did not survive the reload. */
function load() {
  if (loaded || typeof window === "undefined") return;
  loaded = true;
  try {
    const raw = localStorage.getItem(KEY);
    job = raw ? (JSON.parse(raw) as SearchJob) : null;
  } catch {
    job = null;
  }
  if (job && (job.status === "running" || job.status === "recovering")) {
    job = { ...job, status: "recovering" };
    void recover();
  }
}

function sameSeed(a: string, b: string) {
  return a.trim().toLocaleLowerCase() === b.trim().toLocaleLowerCase();
}

/** The request is gone (reload, closed tab): watch the analyses list for the
 *  tree it was making. Found -> done. Window passed -> lost, which the
 *  interface words as "we could not tell", never as "it failed". */
async function recover() {
  if (recovering) return;
  recovering = true;
  try {
    while (job && job.status === "recovering") {
      const started = job.startedAt;
      try {
        const trees = await fetchTrees();
        const found = trees.find(
          (t) =>
            sameSeed(t.seed, job!.seed) &&
            t.language_code === job!.language &&
            (t.location_code ?? job!.location) === job!.location &&
            // The same seed searched before today is not this search.
            Date.parse(t.updated_at ?? "") >= started - 5000
        );
        if (found && job?.status === "recovering") {
          set({ ...job, status: "done", slug: found.slug, finishedAt: Date.now() });
          return;
        }
      } catch {
        // A failed poll is not a failed search; try again.
      }
      if (!job || Date.now() - job.startedAt > RECOVERY_WINDOW_MS) {
        if (job?.status === "recovering") set({ ...job, status: "lost", finishedAt: Date.now() });
        return;
      }
      await new Promise((r) => setTimeout(r, POLL_MS));
    }
  } finally {
    recovering = false;
  }
}

/** Start a search. Resolves with the tree's slug, or null if it failed. */
export async function startSearch(input: {
  seed: string;
  location: number;
  language: string;
}): Promise<string | null> {
  load();
  set({ ...input, startedAt: Date.now(), status: "running" });
  try {
    const result = await runSearch({
      seed: input.seed,
      location_code: input.location,
      language_code: input.language,
    });
    if (isDryRun(result)) {
      set(null);
      return null;
    }
    set({ ...job!, status: "done", slug: result.slug, finishedAt: Date.now() });
    return result.slug;
  } catch (e) {
    if (unloading) return null; // see `unloading` above
    const err = e instanceof ApiError ? e : new ApiError("http", {});
    set({
      ...job!,
      status: "failed",
      finishedAt: Date.now(),
      error: { kind: err.kind, values: err.values, detail: err.detail },
    });
    return null;
  }
}

/** Forget the job: its tree was opened, or the reader dismissed it. */
export function clearSearch() {
  set(null);
}

function subscribe(listener: () => void) {
  load();
  listeners.add(listener);
  return () => listeners.delete(listener);
}

export function useSearchJob(): SearchJob | null {
  return useSyncExternalStore(
    subscribe,
    () => {
      load();
      return job;
    },
    () => null
  );
}

/** The stored error as an ApiError again, for the components that render one. */
export function jobError(j: SearchJob | null): ApiError | null {
  if (!j?.error) return null;
  return new ApiError(j.error.kind as ApiError["kind"], j.error.values, j.error.detail);
}
