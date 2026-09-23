"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { ApiError, API_BASE, fetchLabels, fetchMeta, fetchTree } from "@/lib/api";
import {
  STATUSES,
  STATUS_COLOR,
  type LabelCounts,
  type Meta,
  type ScoreResult,
  type Status,
  type Tree,
  type Verdict,
} from "@/lib/types";
import { normalizeSite } from "@/lib/domains";
import { useDateFormat, useI18n } from "@/i18n";
import { ErrorNote } from "./ErrorNote";
import { QuestionTree } from "./QuestionTree";
import { GapTable } from "./GapTable";
import { QuestionDetail } from "./QuestionDetail";
import { NoQuestions, RelatedSeeds } from "./RelatedSeeds";
import { Notice } from "./Badge";
import { LocalePicker } from "./LocalePicker";
import { ThemeToggle } from "./ThemeToggle";
import { BatchScore } from "./BatchScore";
import { AccountMenu } from "./AccountMenu";
import { DevPanel } from "./DevPanel";
import { CrawlDiff } from "./CrawlDiff";

type View = "tree" | "table" | "seeds";

const SITE_KEY = "answergap.site";

export function TreeScreen({ slug }: { slug: string }) {
  const { t, tag } = useI18n();
  const formatDate = useDateFormat();

  const [tree, setTree] = useState<Tree | null>(null);
  const [error, setError] = useState<ApiError | null>(null);
  const [view, setView] = useState<View>("tree");
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [query, setQuery] = useState("");
  const [hidden, setHidden] = useState<Set<Status>>(new Set());

  /* Verdicts live here rather than in the panel because they outlive the
     selection: clicking through questions must not reload them, and a verdict
     given on one question is drawn on the node in the tree behind it. */
  const [verdicts, setVerdicts] = useState<Record<string, Verdict>>({});
  const [labelCounts, setLabelCounts] = useState<LabelCounts | null>(null);

  /* The reader's own domain, for "is my site cited?". Kept here because both
     the table and the detail panel mark it, and remembered per browser: it is
     a convenience, so a storage failure just means typing it again. */
  const [siteInput, setSiteInput] = useState("");
  useEffect(() => {
    try {
      setSiteInput(window.localStorage.getItem(SITE_KEY) ?? "");
    } catch {
      /* private window or blocked site data */
    }
  }, []);
  const changeSite = (value: string) => {
    setSiteInput(value);
    try {
      if (value.trim()) window.localStorage.setItem(SITE_KEY, value);
      else window.localStorage.removeItem(SITE_KEY);
    } catch {
      /* not load-bearing */
    }
  };
  const site = useMemo(() => normalizeSite(siteInput), [siteInput]);

  /* The detail panel overlays the canvas now, so Escape has to dismiss it —
     the close button is 400px away from wherever the reader just clicked. */
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setSelectedId(null);
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, []);

  /* Who is looking, and what a request actually costs. Allowed to fail
     quietly: without it the screen loses the developer panel and the batch
     button, which is a smaller loss than losing the tree. */
  const [meta, setMeta] = useState<Meta | null>(null);
  useEffect(() => {
    fetchMeta().then(setMeta).catch(() => setMeta(null));
  }, []);

  const reload = () =>
    fetchTree(slug)
      .then(setTree)
      .catch(() => {
        /* the tree on screen is still the last good one */
      });

  useEffect(() => {
    fetchTree(slug)
      .then(setTree)
      .catch((e) => setError(e instanceof ApiError ? e : new ApiError("http", {})));
  }, [slug]);

  // Loaded separately and allowed to fail quietly. Labels are a side channel;
  // an empty verdict map is a working screen, so a failure here must not take
  // the tree down with it.
  useEffect(() => {
    fetchLabels(slug).then(setVerdicts).catch(() => setVerdicts({}));
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

  /* Scoring one question changes more than that question.
   *
   * The request bought for its organic results also carries a PAA block and a
   * set of related searches, and the API now harvests both. So a score can add
   * NEW nodes, and can add a parent to a node already on screen — neither of
   * which swapping a single node in place could express. The API therefore
   * returns the whole node list and it is taken as authoritative.
   *
   * Refetching the tree would do the same job but would also reset the pan/zoom
   * position and the selection, which live in this component's state. */
  const applyScore = (result: ScoreResult) =>
    setTree((current) =>
      current
        ? {
            ...current,
            status_counts: result.status_counts,
            node_count: result.node_count,
            related_searches: result.related_searches,
            nodes: result.nodes,
          }
        : current
    );

  if (error) {
    return (
      <div className="landing">
        <div className="error">
          <ErrorNote error={error} />
        </div>
        <p style={{ marginTop: 16 }}>
          <Link href="/">← {t("error.backToAnalyses")}</Link>
        </p>
      </div>
    );
  }

  if (!tree) return <div className="status-text">{t("error.loading")}</div>;

  // The seed is the only node: Google returned no PAA block at all.
  const noQuestions =
    tree.source === "live" && tree.nodes.every((n) => n.depth === 0);

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
          <Notice
            title={
              labelCounts
                ? `${t("notice.thresholdNote")} ${t("verdict.tally", {
                    questions: labelCounts.questions,
                    gap: labelCounts.gap,
                    notGap: labelCounts.not_gap,
                  })}`
                : t("notice.thresholdNote")
            }
          >
            <b>{t("notice.provisionalThreshold")}</b> {tree.threshold.toFixed(2)}
          </Notice>
        )}
        {tree.source === "live" && <CrawlDiff slug={slug} />}
        {meta && <DevPanel meta={meta} slug={slug} />}
        {meta && <AccountMenu meta={meta} />}
        <ThemeToggle />
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
          <button aria-pressed={view === "seeds"} onClick={() => setView("seeds")}>
            {t("toolbar.seeds")}
            <b className="count">{tree.related_searches?.length ?? 0}</b>
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

        {meta && tree.source === "live" && !noQuestions && (
          <BatchScore
            slug={slug}
            pricing={meta.pricing}
            unscored={tree.nodes.filter((n) => !n.results_checked).length}
            onFinished={reload}
          />
        )}

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
            {noQuestions && view !== "seeds" && (
              <NoQuestions phrases={tree.related_searches ?? []} />
            )}
            {!noQuestions && view === "tree" && (
              <QuestionTree
                nodes={tree.nodes}
                selectedId={selectedId}
                onSelect={setSelectedId}
                highlighted={highlighted}
                site={site}
              />
            )}
            {!noQuestions && view === "table" && (
              <GapTable
                nodes={filtered}
                allNodes={tree.nodes}
                selectedId={selectedId}
                onSelect={setSelectedId}
                localeTag={tag}
                siteInput={siteInput}
                site={site}
                onSiteChange={changeSite}
              />
            )}
            {view === "seeds" && (
              <RelatedSeeds phrases={tree.related_searches ?? []} />
            )}
          </div>
        </main>
        <QuestionDetail
          node={selected}
          tree={tree}
          onScored={applyScore}
          verdicts={verdicts}
          site={site}
          onClose={() => setSelectedId(null)}
          overlay={view === "tree"}
          onVerdict={(labels, counts) => {
            setVerdicts(labels);
            setLabelCounts(counts);
          }}
        />
      </div>
    </div>
  );
}
