"use client";

import { useState } from "react";
import { ApiError } from "@/lib/api";
import { startSearch, useSearchJob } from "@/lib/search-job";
import { useI18n } from "@/i18n";

/**
 * "Live": search a saved seed again for the newest data. One credit.
 *
 * Asks first, every time - this spends a credit on something the reader
 * already has, so the button alone must never spend it. The confirmation
 * names the price.
 *
 * Runs through the same search job as the box on the home page, so it shows
 * the same "processing" state, survives navigation, and cannot run while
 * another search is in flight. `onDone` receives the slug once the update
 * has finished (the tree screen reloads itself with it).
 */
export function RefreshSearch({
  seed,
  location,
  language,
  onDone,
}: {
  seed: string;
  location: number;
  language: string;
  onDone?: (slug: string) => void;
}) {
  const { t } = useI18n();
  const job = useSearchJob();
  const [asking, setAsking] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const running = job?.status === "running" || job?.status === "recovering";
  const mine =
    running && job.seed.trim().toLocaleLowerCase() === seed.trim().toLocaleLowerCase();

  const run = async () => {
    setAsking(false);
    setError(null);
    try {
      const slug = await startSearch({ seed, location, language, refresh: true });
      if (slug) onDone?.(slug);
    } catch (e) {
      setError(e instanceof ApiError ? t(`error.${e.kind}`, e.values) : t("auth.failed"));
    }
  };

  if (mine) {
    return (
      <span className="refresh-live is-running" role="status">
        <i className="refresh-dot" aria-hidden /> {t("refresh.running")}
      </span>
    );
  }

  if (asking) {
    return (
      <span className="refresh-confirm" role="group" aria-label={t("refresh.confirm")}>
        <span>{t("refresh.confirm")}</span>
        <button type="button" className="refresh-yes" onClick={() => void run()}>
          {t("refresh.yes")}
        </button>
        <button type="button" className="refresh-no" onClick={() => setAsking(false)}>
          {t("refresh.no")}
        </button>
      </span>
    );
  }

  return (
    <span className="refresh-wrap">
      <button
        type="button"
        className="refresh-live"
        disabled={running}
        title={running ? t("refresh.busy") : t("refresh.title")}
        onClick={(e) => {
          // Inside a clickable card: this button must not also open the tree.
          e.preventDefault();
          e.stopPropagation();
          setAsking(true);
        }}
      >
        <svg viewBox="0 0 20 20" aria-hidden>
          <path d="M16 10a6 6 0 1 1-1.8-4.3M16 3.5v3.2h-3.2" />
        </svg>
        {t("refresh.live")}
      </button>
      {error && <span className="refresh-error">{error}</span>}
    </span>
  );
}
