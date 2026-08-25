"use client";

import { Badge, Rich } from "./Badge";
import { useDateFormat, useI18n } from "@/i18n";
import type { Node, Tree } from "@/lib/types";

/* This panel answers "why is this a gap?".
 *
 * Showing a score is not enough. The threshold is unvalidated, so the product
 * has no standing to say "trust me" — it has to lay the evidence out and let
 * the user judge the page titles for themselves.
 */

export function QuestionDetail({
  node,
  tree,
}: {
  node: Node | null;
  tree: Tree;
}) {
  const { t } = useI18n();
  const formatDate = useDateFormat();

  if (!node) {
    return (
      <aside className="panel">
        <div className="panel-empty">{t("detail.empty")}</div>
      </aside>
    );
  }

  const hasData = node.results_checked > 0;

  return (
    <aside className="panel">
      <h2>{node.question}</h2>
      <div style={{ display: "flex", gap: 8, alignItems: "center", marginTop: 8 }}>
        <Badge status={node.status} />
        <span className="muted" style={{ fontSize: 12 }}>
          {t("detail.depth", { depth: node.depth })}
          {node.repeat_count > 1 &&
            ` · ${t("detail.branches", { count: node.repeat_count })}`}
        </span>
      </div>

      <p className="note">{t(`status.${node.status}Explained`)}</p>

      {hasData && (
        <dl className="metrics">
          <div>
            <dt>{t("detail.matchingPages")}</dt>
            <dd>{node.matching_pages}</dd>
          </div>
          <div>
            <dt>{t("detail.checked")}</dt>
            <dd>{node.results_checked}</dd>
          </div>
          <div>
            <dt>{t("detail.volume")}</dt>
            <dd className="muted" style={{ fontSize: 13, fontWeight: 500 }}>
              {t("table.noVolume")}
            </dd>
          </div>
        </dl>
      )}

      {hasData ? (
        <>
          <h3>
            {t("detail.resultsHeading", { threshold: tree.threshold.toFixed(2) })}
          </h3>
          {node.results.map((result, i) => (
            <div className="result" key={`${result.url}-${i}`}>
              <span
                className={`score${result.overlap >= tree.threshold ? " passed" : ""}`}
              >
                {result.overlap.toFixed(2)}
              </span>
              <div className="result-body">
                <a href={result.url} target="_blank" rel="noopener noreferrer">
                  <div className="result-title">
                    {result.title || t("detail.untitled")}
                  </div>
                </a>
                <div className="result-domain">{result.domain}</div>
              </div>
            </div>
          ))}
        </>
      ) : (
        <p className="note">
          <Rich html={t("detail.noResults")} />
        </p>
      )}

      {node.ai_sources.length > 0 && (
        <>
          <h3>{t("detail.aiHeading")}</h3>
          <div className="tag-list">
            {node.ai_sources.map((domain) => (
              <span className="tag" key={domain}>
                {domain}
              </span>
            ))}
          </div>
          <p className="note">{t("detail.aiNote")}</p>
        </>
      )}

      <h3>{t("detail.sourceHeading")}</h3>
      <div className="header-sub" style={{ flexDirection: "column", gap: 3 }}>
        <span>{t("detail.updated", { date: formatDate(node.updated_at) })}</span>
        {node.source_file && (
          <span className="result-domain">{node.source_file}</span>
        )}
        <span>
          {t("detail.matching", {
            strategy: tree.strategy,
            threshold: tree.threshold.toFixed(2),
          })}
          {!tree.threshold_validated && ` ${t("detail.unvalidated")}`}
        </span>
      </div>
    </aside>
  );
}
