"use client";

import { useEffect, useState } from "react";
import { fetchDiff } from "@/lib/api";
import type { DiffResult } from "@/lib/types";
import { useDateFormat, useI18n } from "@/i18n";

/**
 * What Google changed since the last crawl of this seed.
 *
 * The signal nothing else has. Google does not publish PAA history and no
 * competitor keeps it, so "three questions appeared under your keyword this
 * week" is only answerable by someone who stored the last answer - which the
 * edge-row schema does by construction, every crawl keeping its own edges.
 *
 * THREE RULES FROM CLAUDE.md ARE VISIBLE IN WHAT THIS DOES NOT SHOW.
 *
 * Order changes are absent entirely. PAA ordering moves for an identical query;
 * reporting it would produce an alert on every run and the whole surface would
 * be ignored within a week.
 *
 * Harvested questions are absent. They arrive when WE pay to score something,
 * not when Google changes its mind, and presenting our own spending back as a
 * market signal would be indistinguishable from the real thing.
 *
 * A single crawl renders as "nothing to compare yet", never as "no changes".
 * Nothing measured is not a measurement of nothing - the same distinction the
 * badges draw between `Not checked` and `Unanswered`.
 */
export function CrawlDiff({ slug }: { slug: string }) {
  const { t } = useI18n();
  const formatDate = useDateFormat();
  const [data, setData] = useState<DiffResult | null>(null);
  const [open, setOpen] = useState(false);

  useEffect(() => {
    // Allowed to fail silently: this is a side channel, and a tree without its
    // history is still a working screen.
    fetchDiff(slug).then(setData).catch(() => setData(null));
  }, [slug]);

  if (!data) return null;

  const { diff, history } = data;

  if (!diff) {
    if (history.length === 0) return null;
    return (
      <span className="diff none" title={t("diff.firstNote")}>
        {t("diff.first", { at: formatDate(history[0].at) })}
      </span>
    );
  }

  const changes = diff.added.length + diff.removed.length;
  const since = formatDate(diff.previous.at);

  return (
    <span className={`diff${changes ? " changed" : ""}${open ? " open" : ""}`}>
      <button className="diff-toggle" onClick={() => setOpen(!open)}>
        {changes === 0
          ? t("diff.stable", { since, count: diff.unchanged })
          : t("diff.changed", {
              added: diff.added.length,
              removed: diff.removed.length,
              since,
            })}
        <span className="devpanel-caret">{open ? "▾" : "▸"}</span>
      </button>

      {open && (
        <div className="diff-body">
          <p className="muted diff-scope">{t("diff.scope")}</p>

          {diff.added.length > 0 && (
            <>
              <h4 className="diff-h added">{t("diff.addedHeading")}</h4>
              <ul className="diff-list">
                {diff.added.map((row) => (
                  <li key={row.normalized}>
                    <i className="diff-depth">L{row.depth}</i> {row.question}
                  </li>
                ))}
              </ul>
            </>
          )}

          {diff.removed.length > 0 && (
            <>
              <h4 className="diff-h removed">{t("diff.removedHeading")}</h4>
              <p className="muted diff-scope">{t("diff.removedNote")}</p>
              <ul className="diff-list">
                {diff.removed.map((row) => (
                  <li key={row.normalized}>
                    <i className="diff-depth">L{row.depth}</i> {row.question}
                  </li>
                ))}
              </ul>
            </>
          )}

          <h4 className="diff-h">{t("diff.historyHeading")}</h4>
          <ul className="diff-history">
            {history.map((run) => (
              <li key={run.crawl_id}>
                <span>{formatDate(run.at)}</span>
                <b>{t("diff.questionCount", { count: run.questions })}</b>
                <span className="muted">${run.spend.toFixed(4)}</span>
              </li>
            ))}
          </ul>
        </div>
      )}
    </span>
  );
}
