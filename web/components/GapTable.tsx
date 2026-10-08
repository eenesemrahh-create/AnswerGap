"use client";

import { useMemo, useState } from "react";
import { Badge } from "./Badge";
import { AiSummary, citedDomains } from "./AiSummary";
import { useI18n } from "@/i18n";
import { aiKnown, isCited } from "@/lib/domains";
import type { Node } from "@/lib/types";

/* SEO people copy this into a spreadsheet, so it is a real <table> with
 * selectable text — not a virtualized list. That is the concrete payoff of
 * choosing web-first over a React Native shell.
 *
 * 2026-10-08, the visual language of the question panel: the table is a card,
 * the evidence is one dot per page checked (filled = targets the question),
 * and branches / AI Overview are the same pills the tree draws. On a phone the
 * rows become cards and a select replaces the clickable headers. */

type Column = "question" | "status" | "matching_pages" | "ai_sources" | "repeat_count" | "depth";

const COLUMNS: { key: Column; label: string; hint?: string; right?: boolean }[] = [
  { key: "question", label: "table.question" },
  { key: "status", label: "table.status" },
  { key: "matching_pages", label: "table.matchingPages", hint: "table.matchingPagesHint" },
  { key: "ai_sources", label: "table.aiSources", hint: "table.aiSourcesHint" },
  { key: "repeat_count", label: "table.branches", hint: "table.branchesHint", right: true },
  { key: "depth", label: "table.depth", right: true },
];

/* Unchecked sorts below "none": unknown is not zero. With a site entered,
 * questions citing it sort above every question that does not. */
const aiRank = (node: Node, site: string | null) => {
  if (!aiKnown(node)) return -1;
  const own = site && isCited(node.ai_sources ?? [], site) ? 1000 : 0;
  return own + citedDomains(node).length;
};

/* Unchecked sorts below a checked 0: a page count of nothing fetched is not
 * zero pages, and putting it among the gaps would present unknown as a gap. */
const pagesRank = (node: Node) => (node.results_checked === 0 ? -1 : node.matching_pages);

export function GapTable({
  nodes,
  allNodes,
  selectedId,
  onSelect,
  localeTag,
  siteInput,
  site,
  onSiteChange,
}: {
  nodes: Node[];
  /** The unfiltered tree, so the AI summary does not move with the filter. */
  allNodes: Node[];
  selectedId: string | null;
  onSelect: (id: string) => void;
  localeTag: string;
  siteInput: string;
  site: string | null;
  onSiteChange: (value: string) => void;
}) {
  const { t } = useI18n();
  const [column, setColumn] = useState<Column>("matching_pages");
  const [ascending, setAscending] = useState(true);

  const sorted = useMemo(() => {
    const copy = [...nodes];
    copy.sort((a, b) => {
      let diff: number;
      if (column === "question") {
        diff = a.question.localeCompare(b.question, localeTag);
      } else if (column === "status") {
        diff = a.status.localeCompare(b.status);
      } else if (column === "ai_sources") {
        diff = aiRank(a, site) - aiRank(b, site);
      } else if (column === "matching_pages") {
        /* Ascending means fewest targeting pages first — the gaps — with
           every unchecked question kept at the bottom either way. */
        const ua = a.results_checked === 0, ub = b.results_checked === 0;
        if (ua !== ub) return ua ? 1 : -1;
        diff = pagesRank(a) - pagesRank(b);
      } else {
        diff = a[column] - b[column];
      }
      if (diff === 0) diff = a.question.localeCompare(b.question, localeTag);
      return ascending ? diff : -diff;
    });
    return copy;
  }, [nodes, column, ascending, localeTag, site]);

  const defaultAscending = (key: Column) =>
    key === "question" || key === "status" || key === "matching_pages" || key === "depth";

  const toggle = (key: Column) => {
    if (key === column) setAscending((v) => !v);
    else {
      setColumn(key);
      setAscending(defaultAscending(key));
    }
  };

  return (
    <div className="table-wrap gt-wrap">
      <AiSummary
        nodes={allNodes}
        siteInput={siteInput}
        site={site}
        onSiteChange={onSiteChange}
        onSelect={onSelect}
      />

      <div className="gt-card">
        {/* A phone has no room for clickable headers; the same sort, as a select. */}
        <label className="gt-sort">
          <span>{t("table.sortBy")}</span>
          <select
            value={`${column}:${ascending ? "asc" : "desc"}`}
            onChange={(e) => {
              const [key, dir] = e.target.value.split(":") as [Column, string];
              setColumn(key);
              setAscending(dir === "asc");
            }}
          >
            {COLUMNS.flatMap((col) => [
              <option key={`${col.key}:asc`} value={`${col.key}:asc`}>
                {t(col.label)} ▲
              </option>,
              <option key={`${col.key}:desc`} value={`${col.key}:desc`}>
                {t(col.label)} ▼
              </option>,
            ])}
          </select>
        </label>

        <table className="table gt">
          <thead>
            <tr>
              {COLUMNS.map((col) => (
                <th
                  key={col.key}
                  className={`gt-col-${col.key}${col.right ? " right" : ""}`}
                  title={col.hint ? t(col.hint) : undefined}
                  aria-sort={
                    column === col.key ? (ascending ? "ascending" : "descending") : "none"
                  }
                >
                  <button type="button" onClick={() => toggle(col.key)}>
                    {t(col.label)}
                    <span className="arrow" aria-hidden>
                      {column === col.key ? (ascending ? "▲" : "▼") : ""}
                    </span>
                  </button>
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {sorted.map((node) => {
              const checked = node.results_checked;
              const domains = citedDomains(node);
              const you = !!site && isCited(node.ai_sources ?? [], site);
              return (
                <tr
                  key={node.id}
                  className={`gt-row is-${node.status}`}
                  aria-selected={node.id === selectedId}
                  onClick={() => onSelect(node.id)}
                >
                  <td className="gt-question">{node.question}</td>
                  <td className="gt-status">
                    <Badge status={node.status} />
                  </td>
                  <td className="gt-pages">
                    {checked === 0 ? (
                      <span className="muted gt-empty">—</span>
                    ) : (
                      /* One dot per page looked at, filled when it targets the
                         question — the panel's verdict card, in a row. */
                      <span
                        className="gt-evidence"
                        title={t("status.evidence", { matching: node.matching_pages, checked })}
                      >
                        <span className="gt-dots" aria-hidden>
                          {Array.from({ length: checked }, (_, i) => (
                            <i key={i} className={i < node.matching_pages ? "on" : undefined} />
                          ))}
                        </span>
                        <b>
                          {node.matching_pages}/{checked}
                        </b>
                      </span>
                    )}
                  </td>
                  <td className="gt-ai">
                    {checked === 0 ? (
                      <span className="muted gt-empty">—</span>
                    ) : !aiKnown(node) ? (
                      /* The block was there; its sources never arrived. Unknown
                         is not "none" - see the accuracy rules in CLAUDE.md. */
                      <span className="muted" title={t("table.aiUnknownHint")}>
                        {t("table.aiUnknown")}
                      </span>
                    ) : domains.length > 0 ? (
                      <span
                        className={`gt-pill${you ? " is-you" : ""}`}
                        title={you ? t("table.aiYouHint", { site }) : t("table.aiSourcesHint")}
                      >
                        {t("ai.treeMarker", { count: domains.length })}
                        {you && ` · ${t("table.aiYou")}`}
                      </span>
                    ) : (
                      <span className="muted">{t("table.aiNone")}</span>
                    )}
                  </td>
                  <td className="gt-branches right" title={t("table.branchesHint")}>
                    {node.repeat_count > 1 ? (
                      <span className="gt-pill">×{node.repeat_count}</span>
                    ) : (
                      <span className="muted gt-empty">1</span>
                    )}
                  </td>
                  <td className="gt-depth right">
                    <span className="gt-depth-label">{t("table.depth")} </span>
                    {node.depth}
                  </td>
                </tr>
              );
            })}
            {sorted.length === 0 && (
              <tr>
                <td colSpan={COLUMNS.length} className="status-text">
                  {t("table.empty")}
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {/* CLAUDE.md: never render an empty cell for missing volume. No question
          carries a volume yet, so a whole column of "no data" said one thing
          fifty times; it is said once here, with what stands in for it. */}
      <p className="gt-foot">{t("table.volumeNote")}</p>
    </div>
  );
}
