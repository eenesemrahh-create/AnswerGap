"use client";

import { useEffect, useSyncExternalStore } from "react";
import { fetchMe, fetchPricing } from "./api";
import { token } from "./auth";
import type { Me, Plan } from "./types";

/**
 * Who is signed in, read ONCE per page and shared.
 *
 * The avatar menu, the credit strip under the nav and the account pages all
 * show the same balance. Each fetching `/api/me` for itself would be three
 * requests per page and, worse, three answers that can disagree for a moment -
 * a strip saying 12 credits under a menu saying 11. One store, one answer.
 *
 * `known` is the third state the rest of the interface already insists on:
 * "not answered yet" must never render as "signed out", or every signed-in
 * reader sees a sign-in button flash before their own page.
 */
interface Snapshot {
  me: Me | null;
  known: boolean;
  plans: Plan[];
}

let snapshot: Snapshot = { me: null, known: false, plans: [] };
let inflight: Promise<Me | null> | null = null;
let plansRequested = false;
const listeners = new Set<() => void>();

function emit(next: Partial<Snapshot>) {
  snapshot = { ...snapshot, ...next };
  listeners.forEach((l) => l());
}

/** Fetch `/api/me`, sharing one request between every caller on the page.
 *  `force` refetches - after a sign-in, a purchase, a spend. */
export function loadMe(force = false): Promise<Me | null> {
  if (inflight && !force) return inflight;
  if (!token()) {
    emit({ me: null, known: true });
    return Promise.resolve(null);
  }
  inflight = fetchMe()
    .then((me) => {
      emit({ me, known: true });
      return me;
    })
    .catch(() => {
      emit({ me: null, known: true });
      return null;
    });
  return inflight;
}

/** The plan cards, for turning a subscription's `plan_id` into a name.
 *  Fetched once; an empty list just means the id is shown instead. */
function loadPlans() {
  if (plansRequested) return;
  plansRequested = true;
  fetchPricing()
    .then((r) => emit({ plans: r.plans }))
    .catch(() => {});
}

function subscribe(listener: () => void) {
  listeners.add(listener);
  return () => listeners.delete(listener);
}

const SERVER: Snapshot = { me: null, known: false, plans: [] };

/** The shared answer. Starts the fetch on first use. */
export function useMe(): Snapshot {
  const current = useSyncExternalStore(
    subscribe,
    () => snapshot,
    () => SERVER
  );
  useEffect(() => {
    if (!inflight && !snapshot.known) void loadMe();
    loadPlans();
  }, []);
  return current;
}

/** A plan's display name, or its id - capitalised - when the cards have not
 *  loaded or no longer list it. */
export function planName(plans: Plan[], id: string | null | undefined): string | null {
  if (!id) return null;
  return plans.find((p) => p.id === id)?.name ?? id.charAt(0).toUpperCase() + id.slice(1);
}
