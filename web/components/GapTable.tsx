"use client";

import { useMemo, useState } from "react";
import { Badge } from "./Badge";
import { useI18n } from "@/i18n";
import type { Node } from "@/lib/types";

/* SEO people copy this into a spreadsheet, so it is a real <table> with
 * selectable text — not a virtualized list. That is the concrete payoff of
 * choosing web-first over a React Native shell. */

type Column =
  | "question"
  | "status"
  | "matching_pages"
  | "results_checked"
  | "repeat_count"
  | "depth";

const COLUMNS: { key: Column; label: string; hint?: string; right?: boolean }[] = [
  { key: "question", label: "table.question" },
  { key: "status", label: "table.status" },
  { key: "matching_pages", label: "table.matchingPages", hint: "table.matchingPagesHint", right: true },
  { key: "results_checked", label: "table.checked", hint: "table.checkedHint", right: true },
  { key: "repeat_count", label: "table.branches", hint: "table.branchesHint", right: true },
  { key: "depth", label: "table.depth", right: true },
];

export function GapTable({
  nodes,
  selectedId,
  onSelect,
  localeTag,
}: {
  nodes: Node[];
  selectedId: string | null;
  onSelect: (id: string) => void;
  localeTag: string;
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
      } else {
        diff = (a[column] as number) - (b[column] as number);
      }
      if (diff === 0) diff = a.question.localeCompare(b.question, localeTag);
      return ascending ? diff : -diff;
    });
    return copy;
  }, [nodes, column, ascending, localeTag]);

  const toggle = (key: Column) => {
    if (key === column) setAscending((v) => !v);
    else {
      setColumn(key);
      setAscending(key === "question" || key === "status");
    }
  };

  return (
    <div className="table-wrap">
      <table className="table">
        <thead>
          <tr>
            {COLUMNS.map((col) => (
              <th
                key={col.key}
                className={col.right ? "right" : undefined}
                title={col.hint ? t(col.hint) : undefined}
                onClick={() => toggle(col.key)}
                aria-sort={
                  column === col.key
                    ? ascending
                      ? "ascending"
                      : "descending"
                    : "none"
                }
              >
                {t(col.label)}{" "}
                <span className="arrow">
                  {column === col.key ? (ascending ? "▲" : "▼") : ""}
                </span>
              </th>
            ))}
            <th className="right" title={t("table.volumeHint")}>
              {t("table.volume")}
            </th>
          </tr>
        </thead>
        <tbody>
          {sorted.map((node) => (
            <tr
              key={node.id}
              aria-selected={node.id === selectedId}
              onClick={() => onSelect(node.id)}
            >
              <td>{node.question}</td>
              <td>
                <Badge
                  status={node.status}
                  matching={node.matching_pages}
                  checked={node.results_checked}
                />
              </td>
              <td className="right">
                {node.status === "no_data" ? (
                  <span className="muted">—</span>
                ) : (
                  node.matching_pages
                )}
              </td>
              <td className="right">
                {node.results_checked || <span className="muted">—</span>}
              </td>
              <td className="right">
                {node.repeat_count > 1 ? (
                  node.repeat_count
                ) : (
                  <span className="muted">1</span>
                )}
              </td>
              <td className="right">{node.depth}</td>
              {/* CLAUDE.md: never render an empty cell for missing volume. */}
              <td className="right muted">{t("table.noVolume")}</td>
            </tr>
          ))}
          {sorted.length === 0 && (
            <tr>
              <td colSpan={7} className="status-text">
                {t("table.empty")}
              </td>
            </tr>
          )}
        </tbody>
      </table>
    </div>
  );
}
