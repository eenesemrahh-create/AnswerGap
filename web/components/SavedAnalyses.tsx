"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { STATUSES, STATUS_COLOR, type Status, type TreeSummary } from "@/lib/types";
import type { SearchJob } from "@/lib/search-job";
import { useDateFormat, useI18n } from "@/i18n";
import { RefreshSearch } from "./RefreshSearch";

type Sort = "newest" | "questions" | "gaps";

/** How many QUESTIONS a summary holds - the seed is the typed keyword, not a
 *  question. `node_count` stands in for an API older than `question_count`. */
export function questionsIn(tree: TreeSummary): number {
  return tree.question_count ?? tree.node_count;
}

/**
 * The member's own analyses, 2026-10-07.
 *
 * A grid of every search somebody has run stops being browsable at about a
 * dozen, so it can be filtered by seed and sorted three ways - newest, the
 * biggest trees, and the most unanswered questions, which is the order a
 * content team actually works through them in.
 *
 * Each card leads with the unanswered count because that is the product's
 * whole claim; the other three statuses sit beside it, smaller. Counts are
 * over questions, never nodes.
 */
export function SavedAnalyses({
  trees,
  job = null,
  readOnly = false,
}: {
  trees: TreeSummary[];
  /** A signed-out visitor's free searches (2026-10-19): openable, never
   *  updated - an update is a paid search. */
  readOnly?: boolean;
  /** The search in flight, drawn as a "processing" card ahead of the list -
   *  the way AlsoAsked shows "In progress" in its history until it is ready. */
  job?: SearchJob | null;
}) {
  const { t } = useI18n();
  const formatDate = useDateFormat();
  const [query, setQuery] = useState("");
  const [sort, setSort] = useState<Sort>("newest");

  const shown = useMemo(() => {
    const q = query.trim().toLocaleLowerCase();
    const list = q ? trees.filter((tree) => tree.seed.toLocaleLowerCase().includes(q)) : [...trees];
    const gaps = (tree: TreeSummary) => tree.status_counts.gap ?? 0;
    list.sort((a, b) =>
      sort === "questions"
        ? questionsIn(b) - questionsIn(a)
        : sort === "gaps"
          ? gaps(b) - gaps(a) || questionsIn(b) - questionsIn(a)
          : (b.updated_at ?? "").localeCompare(a.updated_at ?? "")
    );
    return list;
  }, [trees, query, sort]);
  const pending = job && (job.status === "running" || job.status === "recovering") ? job : null;

  return (
    <section className="home-analyses">
      <div className="home-analyses-head">
        <div>
          <h2>{t("market.saved.heading")}</h2>
          <span className="home-muted">{t("market.saved.count", { count: trees.length })}</span>
        </div>
        <div className="home-analyses-tools">
          <input
            className="home-filter"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder={t("home.filter")}
            aria-label={t("home.filter")}
          />
          <select
            className="home-sort"
            value={sort}
            onChange={(e) => setSort(e.target.value as Sort)}
            aria-label={t("home.sortLabel")}
          >
            <option value="newest">{t("home.sortNewest")}</option>
            <option value="questions">{t("home.sortQuestions")}</option>
            <option value="gaps">{t("home.sortGaps")}</option>
          </select>
        </div>
      </div>

      {shown.length === 0 && !pending ? (
        <p className="home-nomatch">{t("home.noMatch", { query: query.trim() })}</p>
      ) : (
        <div className="home-grid">
          {pending && (
            <div className="home-card home-card-pending" role="status">
              <div className="home-card-top">
                <b className="home-card-title">{pending.seed}</b>
              </div>
              <span className="home-card-processing">
                <i className="refresh-dot" aria-hidden /> {t("refresh.processing")}
              </span>
              <span className="home-muted home-card-meta">{t("refresh.processingNote")}</span>
            </div>
          )}
          {shown.map((tree) => (
            <AnalysisCard key={tree.slug} tree={tree} updated={formatDate(tree.updated_at)} readOnly={readOnly} />
          ))}
        </div>
      )}
    </section>
  );
}

function AnalysisCard({
  tree,
  updated,
  readOnly,
}: {
  tree: TreeSummary;
  updated: string;
  readOnly: boolean;
}) {
  const { t } = useI18n();
  const total = questionsIn(tree);
  const gaps = tree.status_counts.gap ?? 0;
  /* Nothing checked yet means the unanswered count is UNKNOWN, not zero. A
     big "0 unanswered" on a tree nobody has analysed reads as "no gaps here",
     which is exactly the claim CLAUDE.md forbids: unknown is not answered. */
  const checked = total - (tree.status_counts.no_data ?? 0);
  return (
    <div className="home-card">
      <div className="home-card-top">
        {/* The title link is stretched over the whole card (CSS ::after), so
            the card still opens with one click while the Live button inside it
            stays a separate control - a button nested in a link is invalid. */}
        <Link href={`/tree/${tree.slug}`} className="home-card-title home-card-link">
          {tree.seed}
        </Link>
        <span className="home-card-arrow" aria-hidden>→</span>
      </div>
      <span className="home-muted home-card-meta">
        {t("landing.questionCount", { count: total })} · {tree.language_name} · {updated}
      </span>
      <StatusBar counts={tree.status_counts} total={total} />
      <div className="home-card-stats">
        {checked > 0 ? (
          <span className="home-card-gap">
            <b>{gaps}</b>
            {t("home.unanswered")}
          </span>
        ) : (
          <span className="home-card-unchecked">{t("home.notChecked")}</span>
        )}
        <span className="home-card-rest">
          {STATUSES.filter((s) => s !== "gap").map((status) => (
            <span key={status} title={t(`status.${status}`)}>
              <i style={{ background: STATUS_COLOR[status] }} />
              {tree.status_counts[status] ?? 0}
            </span>
          ))}
        </span>
      </div>
      {tree.location_code != null && (
        <div className="home-card-actions">
          <span className="home-card-saved">
            <i aria-hidden /> {t("refresh.saved")}
          </span>
          {!readOnly && (
            <RefreshSearch
              seed={tree.seed}
              location={tree.location_code}
              language={tree.language_code}
            />
          )}
        </div>
      )}
    </div>
  );
}

export function StatusBar({ counts, total }: { counts: Record<Status, number>; total: number }) {
  const { t } = useI18n();
  if (!total) return null;
  return (
    <div
      className="bar home-bar"
      role="img"
      aria-label={STATUSES.map((s) => `${t(`status.${s}`)}: ${counts[s] ?? 0}`).join(", ")}
    >
      {STATUSES.map((status) => {
        const value = counts[status] ?? 0;
        if (!value) return null;
        return <i key={status} className={status} style={{ width: `${(value / total) * 100}%` }} />;
      })}
    </div>
  );
}
