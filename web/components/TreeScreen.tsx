"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { ApiError, API_BASE, fetchTree } from "@/lib/api";
import {
  STATUSES,
  STATUS_COLOR,
  type ScoreResult,
  type Status,
  type Tree,
} from "@/lib/types";
import { useDateFormat, useI18n } from "@/i18n";
import { QuestionTree } from "./QuestionTree";
import { GapTable } from "./GapTable";
import { QuestionDetail } from "./QuestionDetail";
import { Notice } from "./Badge";
import { LocalePicker } from "./LocalePicker";

type View = "tree" | "table";

export function TreeScreen({ slug }: { slug: string }) {
  const { t, tag } = useI18n();
  const formatDate = useDateFormat();

  const [tree, setTree] = useState<Tree | null>(null);
  const [error, setError] = useState<ApiError | null>(null);
  const [view, setView] = useState<View>("tree");
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [query, setQuery] = useState("");
  const [hidden, setHidden] = useState<Set<Status>>(new Set());

  useEffect(() => {
    fetchTree(slug)
      .then(setTree)
      .catch((e) => setError(e instanceof ApiError ? e : new ApiError("http", {})));
  }, [slug]);

  const toggleStatus = (status: Status) =>
    setHidden((current) => {
      const next = new Set(current);
      if (next.has(status)) next.delete(status);
      else next.add(status);
      return next;
    });

  const filtered = useMemo(() => {
    if (!tree) return [];
    const needle = query.trim().toLocaleLowerCase(tag);
    return tree.nodes.filter(
      (node) =>
        !hidden.has(node.status) &&
        (!needle || node.question.toLocaleLowerCase(tag).includes(needle))
    );
  }, [tree, query, hidden, tag]);

  // Hiding nodes in the tree would sever branches and misrepresent the
  // structure, so filtered-out nodes are faded instead. In the table, hiding
  // is the correct behaviour.
  const highlighted = useMemo(() => {
    if (!tree) return null;
    const noFilter = query.trim() === "" && hidden.size === 0;
    return noFilter ? null : new Set(filtered.map((n) => n.id));
  }, [tree, filtered, query, hidden]);

  const selected = useMemo(
    () => tree?.nodes.find((n) => n.id === selectedId) ?? null,
    [tree, selectedId]
  );

  /* A scored question changes both the node and the tree's status counts.
   * Refetching the whole tree would work but would also throw away the pan/zoom
   * position and the selection, so the one node is swapped in place. */
  const applyScore = (result: ScoreResult) =>
    setTree((current) =>
      current
        ? {
            ...current,
            status_counts: result.status_counts,
            nodes: current.nodes.map((n) =>
              n.id === result.node.id ? result.node : n
            ),
          }
        : current
    );

  if (error) {
    return (
      <div className="landing">
        <div className="error">
          <strong>{t(`error.${error.kind}`, error.values)}</strong>
          <div style={{ marginTop: 8 }}>
            {t("error.startBackend")}
            <br />
            <code>python -m uvicorn api.main:app --reload --port 8000</code>
          </div>
        </div>
        <p style={{ marginTop: 16 }}>
          <Link href="/">← {t("error.backToAnalyses")}</Link>
        </p>
      </div>
    );
  }

  if (!tree) return <div className="status-text">{t("error.loading")}</div>;

  return (
    <div className="shell">
      <header className="header">
        <Link href="/" className="brand">
          Answer<span>Gap</span> <small>{t("brand.prototype")}</small>
        </Link>
        <div className="header-mid">
          <div className="header-title">{tree.seed}</div>
          <div className="header-sub">
            <span>{t("landing.questionCount", { count: tree.node_count })}</span>
            <span>{tree.language_name}</span>
            <span>{t("detail.updated", { date: formatDate(tree.updated_at) })}</span>
          </div>
        </div>
        {/* CLAUDE.md accuracy rule: never claim "live data". A live crawl is
            still a snapshot, so it is labelled by when it was fetched, and the
            archive is labelled as the archive. */}
        {tree.source === "live" ? (
          <Notice title={t("notice.liveDataNote")}>
            <b>{t("notice.liveData")}</b> — {t("notice.liveDataDetail")}
          </Notice>
        ) : (
          <Notice>
            <b>{t("notice.archiveData")}</b> — {t("notice.archiveDataDetail")}
          </Notice>
        )}
        {!tree.threshold_validated && (
          <Notice title={t("notice.thresholdNote")}>
            <b>{t("notice.provisionalThreshold")}</b> {tree.threshold.toFixed(2)}
          </Notice>
        )}
        <LocalePicker />
      </header>

      <div className="toolbar">
        <div className="segment">
          <button aria-pressed={view === "tree"} onClick={() => setView("tree")}>
            {t("toolbar.tree")}
          </button>
          <button aria-pressed={view === "table"} onClick={() => setView("table")}>
            {t("toolbar.table")}
          </button>
        </div>

        <div className="filters">
          {STATUSES.map((status) => (
            <button
              key={status}
              className="chip"
              aria-pressed={!hidden.has(status)}
              onClick={() => toggleStatus(status)}
              title={t(`status.${status}Explained`)}
            >
              <i className="dot" style={{ background: STATUS_COLOR[status] }} />
              {t(`status.${status}`)}
              <b className="count">{tree.status_counts[status] ?? 0}</b>
            </button>
          ))}
        </div>

        <input
          className="search"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder={t("toolbar.searchPlaceholder")}
          aria-label={t("toolbar.searchPlaceholder")}
        />

        {view === "table" && (
          <span className="muted" style={{ fontSize: 12, marginLeft: "auto" }}>
            {t("toolbar.showing", {
              shown: filtered.length,
              total: tree.node_count,
            })}
          </span>
        )}
      </div>

      <div className="body-row">
        <main className="main">
          <div className="canvas">
            {view === "tree" ? (
              <QuestionTree
                nodes={tree.nodes}
                selectedId={selectedId}
                onSelect={setSelectedId}
                highlighted={highlighted}
              />
            ) : (
              <GapTable
                nodes={filtered}
                selectedId={selectedId}
                onSelect={setSelectedId}
                localeTag={tag}
              />
            )}
          </div>
        </main>
        <QuestionDetail node={selected} tree={tree} onScored={applyScore} />
      </div>
    </div>
  );
}
