"use client";

import { useState } from "react";
import { Badge, Rich } from "./Badge";
import { ApiError, scoreQuestion, submitLabel } from "@/lib/api";
import { useDateFormat, useI18n } from "@/i18n";
import type {
  LabelCounts,
  Node,
  ScoreResult,
  Tree,
  Verdict,
} from "@/lib/types";

/* This panel answers "why is this a gap?".
 *
 * Showing a score is not enough. The threshold is unvalidated, so the product
 * has no standing to say "trust me" — it has to lay the evidence out and let
 * the user judge the page titles for themselves.
 */

export function QuestionDetail({
  node,
  tree,
  onScored,
  verdicts,
  onVerdict,
}: {
  node: Node | null;
  tree: Tree;
  /** Called with the freshly scored node so the tree above can update. */
  onScored?: (result: ScoreResult) => void;
  /** Verdicts already recorded, by question slug. Owned by the screen above. */
  verdicts: Record<string, Verdict>;
  onVerdict?: (labels: Record<string, Verdict>, counts: LabelCounts) => void;
}) {
  const { t } = useI18n();
  const formatDate = useDateFormat();
  const [scoring, setScoring] = useState(false);
  const [scoreError, setScoreError] = useState<ApiError | null>(null);

  /* What the last score run harvested out of the response it paid for.
   *
   * Tagged with the question it belongs to rather than cleared on selection:
   * once a question is scored the "check this" branch disappears, so the note
   * has to survive that, and it must never show up under a DIFFERENT question. */
  const [harvest, setHarvest] = useState<{
    slug: string;
    found: number;
    dropped: number;
  } | null>(null);

  /* The verdict just cast, so the panel can confirm it without a refetch.
   *
   * Tagged with the question, like `harvest` above: the confirmation belongs to
   * one question and must never appear under a different one after a click in
   * the tree. */
  const [voted, setVoted] = useState<{ slug: string; retracted: boolean } | null>(
    null
  );
  const [voting, setVoting] = useState(false);
  const [voteError, setVoteError] = useState<ApiError | null>(null);

  /* Clicking the button already selected withdraws the verdict.
   *
   * Sent as the value "?" rather than as a delete: the store is append-only, so
   * changing your mind writes a new line instead of erasing the old one. The
   * history of a judgement is worth keeping - it is the thing that shows how
   * often the metric and a human disagree. */
  const castVerdict = async (choice: Verdict) => {
    if (!node || voting) return;
    const next = verdicts[node.slug] === choice ? "?" : choice;
    setVoting(true);
    setVoteError(null);
    try {
      const result = await submitLabel(tree.slug, node.slug, next);
      setVoted({ slug: node.slug, retracted: next === "?" });
      onVerdict?.(result.labels, result.counts);
    } catch (e) {
      setVoteError(e instanceof ApiError ? e : new ApiError("http", {}));
    } finally {
      setVoting(false);
    }
  };

  const runScore = async () => {
    if (!node || scoring) return;
    setScoring(true);
    setScoreError(null);
    try {
      const result = await scoreQuestion(tree.slug, node.slug);
      setHarvest({
        slug: node.slug,
        found: result.discovered.length,
        dropped: result.dropped.length,
      });
      onScored?.(result);
    } catch (e) {
      setScoreError(e instanceof ApiError ? e : new ApiError("http", {}));
    } finally {
      setScoring(false);
    }
  };

  if (!node) {
    return (
      <aside className="panel">
        <div className="panel-empty">{t("detail.empty")}</div>
      </aside>
    );
  }

  const hasData = node.results_checked > 0;

  // Scoring costs one SERP request per question, so it is offered only where it
  // can actually run: a live tree with an unscored question. Archived Phase 0
  // trees are fixed evidence and the API refuses to re-score them.
  const canScore = tree.source === "live" && !hasData;

  const verdict = verdicts[node.slug] ?? null;
  /* The metric calls anything below the threshold a gap; `weak` is the same
     claim hedged. So a "gap" verdict contradicts `covered`, and a "covered"
     verdict contradicts `gap` or `weak`. */
  const metricSaysGap = node.status === "gap" || node.status === "weak";
  const disagrees =
    (verdict === "G" && !metricSaysGap) || (verdict === "N" && metricSaysGap);

  return (
    <aside className="panel">
      <h2>{node.question}</h2>
      <div style={{ display: "flex", gap: 8, alignItems: "center", marginTop: 8 }}>
        <Badge status={node.status} />
        <span className="muted" style={{ fontSize: 12 }}>
          {t("detail.depth", { depth: node.depth })}
          {node.repeat_count > 1 &&
            ` · ${t("detail.branches", { count: node.repeat_count })}`}
          {node.discovered_by === "harvest" &&
            ` · ${t("detail.harvestedNode")}`}
        </span>
      </div>

      <p className="note">{t(`status.${node.status}Explained`)}</p>

      {/* Discovery is normally a separate purchase, so it is worth saying out
          loud when a scoring request paid for some as well. The dropped count
          goes with it: a crawl that bounds its own coverage has to say so, or
          it reads as complete when it is not. */}
      {harvest?.slug === node.slug && (harvest.found > 0 || harvest.dropped > 0) && (
        <p className="note">
          {harvest.found > 0 && t("detail.harvestFound", { count: harvest.found })}
          {harvest.found > 0 && harvest.dropped > 0 && " "}
          {harvest.dropped > 0 &&
            t("detail.harvestDropped", { count: harvest.dropped })}
        </p>
      )}

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

          {/* The verdict sits BELOW the evidence, never above it.
              The question is "do these page titles answer it?", so it can only
              be asked once the titles have been read. Asking first would be
              asking the user to rate a number. */}
          <h3>{t("verdict.heading")}</h3>
          <p className="note">{t("verdict.ask")}</p>
          <div className="verdict-row">
            <button
              type="button"
              className="verdict-button gap"
              aria-pressed={verdict === "G"}
              disabled={voting}
              onClick={() => castVerdict("G")}
              title={t("verdict.gapHint")}
            >
              {t("verdict.gap")}
            </button>
            <button
              type="button"
              className="verdict-button covered"
              aria-pressed={verdict === "N"}
              disabled={voting}
              onClick={() => castVerdict("N")}
              title={t("verdict.notGapHint")}
            >
              {t("verdict.notGap")}
            </button>
          </div>
          {voting && <p className="note">{t("verdict.saving")}</p>}
          {!voting && voted?.slug === node.slug && (
            <p className="note">
              {t(voted.retracted ? "verdict.retracted" : "verdict.recorded")}
              {/* A verdict that agrees with the metric confirms it; one that
                  disagrees is the only kind that can move the threshold. Saying
                  so is what makes the disagreement worth the click. */}
              {!voted.retracted && disagrees && ` ${t("verdict.disagrees")}`}
            </p>
          )}
          {voteError && (
            <div className="error" style={{ marginTop: 12 }}>
              <strong>{t(`error.${voteError.kind}`, voteError.values)}</strong>
              {voteError.detail && (
                <div style={{ marginTop: 8 }}>
                  <code>{voteError.detail}</code>
                </div>
              )}
            </div>
          )}
        </>
      ) : (
        <>
          <p className="note">
            <Rich
              html={t(canScore ? "detail.notScoredYet" : "detail.noResults")}
            />
          </p>
          {canScore && (
            <>
              <button
                type="button"
                className="score-button"
                onClick={runScore}
                disabled={scoring}
              >
                {scoring ? t("detail.scoring") : t("detail.scoreButton")}
              </button>
              <p className="note">{t("detail.scoreCost")}</p>
            </>
          )}
          {scoreError && (
            <div className="error" style={{ marginTop: 12 }}>
              <strong>{t(`error.${scoreError.kind}`, scoreError.values)}</strong>
              {scoreError.detail && (
                <div style={{ marginTop: 8 }}>
                  <code>{scoreError.detail}</code>
                </div>
              )}
            </div>
          )}
        </>
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
        {node.reach !== null && (
          <span>{t("detail.relevance", { value: node.reach.toFixed(2) })}</span>
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
