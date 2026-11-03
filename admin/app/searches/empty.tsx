"use client";

import { makeT, type Locale } from "@/lib/i18n";
import { useState, useTransition } from "react";
import type { EmptySearchList, EmptySearchRun } from "@/lib/types";
import { loadEmptySearches, runEmptySearches } from "./actions";

const usd = (value: number) => `$${value.toFixed(4)}`;

/**
 * Searches that ended with no question before the fallback existed
 * (2026-11-03). Running them buys real requests, so it takes two clicks and
 * names the ceiling; five per press keeps one call inside the proxy timeout.
 */
export function EmptySearches({ initial, locale }: { initial: EmptySearchList; locale: Locale }) {
  const t = makeT(locale);
  const [data, setData] = useState(initial);
  const [asking, setAsking] = useState(false);
  const [result, setResult] = useState<EmptySearchRun | null>(null);
  const [error, setError] = useState(false);
  const [pending, startTransition] = useTransition();

  const next = Math.min(5, data.searches.length);
  const ceiling = usd(next * data.max_cost_each);

  const run = () =>
    startTransition(async () => {
      setAsking(false);
      setError(false);
      try {
        setResult(await runEmptySearches());
        setData(await loadEmptySearches());
      } catch {
        setError(true);
      }
    });

  return (
    <section className="card" style={{ marginTop: 16 }}>
      <h2>{t("searches.emptyTitle")}</h2>
      <p className="sub">{t("searches.emptyLead")}</p>
      {data.searches.length === 0 ? (
        <p className="faint">{t("searches.emptyNone")}</p>
      ) : (
        <>
          <p>
            {t("searches.emptyCount", {
              count: data.searches.length,
              cost: usd(data.searches.length * data.max_cost_each),
            })}
          </p>
          <p className="faint">{data.searches.slice(0, 10).map((s) => s.seed).join(" · ")}</p>
          <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
            {asking ? (
              <>
                <button className="act warn" type="button" disabled={pending} onClick={run}>
                  {t("searches.emptyConfirm", { count: next, cost: ceiling })}
                </button>
                <button className="act" type="button" disabled={pending} onClick={() => setAsking(false)}>
                  {t("searches.emptyCancel")}
                </button>
              </>
            ) : (
              <button className="act" type="button" disabled={pending} onClick={() => setAsking(true)}>
                {pending ? t("searches.emptyRunning") : t("searches.emptyRun", { count: next })}
              </button>
            )}
          </div>
        </>
      )}
      {result && (
        <p>
          {t("searches.emptyDone", {
            filled: result.filled,
            empty: result.still_empty,
            failed: result.failed,
            spend: usd(result.spend),
            left: result.left,
          })}
          {result.stopped != null && ` ${t("searches.emptyStopped", { code: result.stopped })}`}
        </p>
      )}
      {error && <p className="notice">{t("searches.emptyError")}</p>}
    </section>
  );
}
