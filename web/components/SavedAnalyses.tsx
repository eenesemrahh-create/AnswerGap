"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { STATUSES, STATUS_COLOR, type Status, type TreeSummary } from "@/lib/types";
import { useDateFormat, useI18n } from "@/i18n";

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
export function SavedAnalyses({ trees }: { trees: TreeSummary[] }) {
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

      {shown.length === 0 ? (
        <p className="home-nomatch">{t("home.noMatch", { query: query.trim() })}</p>
      ) : (
        <div className="home-grid">
          {shown.map((tree) => (
            <AnalysisCard key={tree.slug} tree={tree} updated={formatDate(tree.updated_at)} />
          ))}
        </div>
      )}
    </section>
  );
}

function AnalysisCard({ tree, updated }: { tree: TreeSummary; updated: string }) {
  const { t } = useI18n();
  const total = questionsIn(tree);
  const gaps = tree.status_counts.gap ?? 0;
  /* Nothing checked yet means the unanswered count is UNKNOWN, not zero. A
     big "0 unanswered" on a tree nobody has analysed reads as "no gaps here",
     which is exactly the claim CLAUDE.md forbids: unknown is not answered. */
  const checked = total - (tree.status_counts.no_data ?? 0);
  return (
    <Link href={`/tree/${tree.slug}`} className="home-card">
      <div className="home-card-top">
        <b className="home-card-title">{tree.seed}</b>
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
    </Link>
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
