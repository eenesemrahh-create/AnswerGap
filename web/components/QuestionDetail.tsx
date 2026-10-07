"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Rich } from "./Badge";
import { ApiError, checkQuestion, submitLabel } from "@/lib/api";
import { useDateFormat, useI18n } from "@/i18n";
import { aiKnown, citesSite } from "@/lib/domains";
import type {
  CheckResult,
  LabelCounts,
  Node,
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
  site,
  onVerdict,
  onClose,
  overlay,
}: {
  node: Node | null;
  tree: Tree;
  /** Called with the checked question so the tree above can redraw it
   *  before the reader is sent on to the question's own tree. */
  onScored?: (result: CheckResult) => void;
  /** Verdicts already recorded, by question slug. Owned by the screen above. */
  verdicts: Record<string, Verdict>;
  /** The reader's own normalized domain, to mark among the cited sources. */
  site: string | null;
  onVerdict?: (labels: Record<string, Verdict>, counts: LabelCounts) => void;
  /** Clears the selection. The panel overlays the canvas, so it needs a way out. */
  onClose?: () => void;
  /* Over the canvas, or beside the content?
   *
   * The tree is pannable, so anything the panel covers can be moved out from
   * under it — and there the overlay buys the canvas 400px back. A table
   * cannot be panned: the same overlay would simply hide the right-hand
   * columns, and a hidden column reads as a column that does not exist. */
  overlay?: boolean;
}) {
  const { t } = useI18n();
  const router = useRouter();
  const formatDate = useDateFormat();
  const [scoring, setScoring] = useState(false);
  const [scoreError, setScoreError] = useState<ApiError | null>(null);

  /* The verdict just cast, so the panel can confirm it without a refetch.
   *
   * Tagged with the question rather than cleared on selection: the confirmation belongs to
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

  /* "Check this question" searches the question as its own seed: one
     credit buys its verdict AND its own question tree. The verdict is drawn
     here first, so Back lands on a coloured box, then the reader is taken to
     the new tree. On a question already checked the same call is free from
     the cache, and simply opens that tree. */
  const runScore = async () => {
    if (!node || scoring) return;
    setScoring(true);
    setScoreError(null);
    try {
      const result = await checkQuestion(tree.slug, node.slug);
      onScored?.(result);
      router.push(`/tree/${encodeURIComponent(result.slug)}`);
    } catch (e) {
      setScoreError(e instanceof ApiError ? e : new ApiError("http", {}));
      setScoring(false);
    }
  };

  /* Nothing selected renders NOTHING, rather than a panel explaining that
     nothing is selected. The panel is 400px of a 1280px screen and the canvas
     beside it is the screen's whole point; a sentence is not worth a third of
     the tree. It slides over the canvas when there is something to say. */
  if (!node) return null;

  const hasData = node.results_checked > 0;

  // Scoring costs one SERP request per question, so it is offered only where it
  // can actually run: a live tree with an unscored question. Archived Phase 0
  // trees are fixed evidence and the API refuses to re-score them.
  const canScore = tree.source === "live" && !hasData;
  /* A question already checked still has a tree of its own to open. The same
     call: free when that search is cached, one credit if it was scored by the
     old in-place route and so has no tree yet. Not offered on the seed - its
     tree is the one on screen. */
  const canOpenTree = tree.source === "live" && hasData && node.depth > 0;

  const verdict = verdicts[node.slug] ?? null;
  /* The metric calls anything below the threshold a gap; `weak` is the same
     claim hedged. So a "gap" verdict contradicts `covered`, and a "covered"
     verdict contradicts `gap` or `weak`. */
  const metricSaysGap = node.status === "gap" || node.status === "weak";
  const disagrees =
    (verdict === "G" && !metricSaysGap) || (verdict === "N" && metricSaysGap);

  /* Which of the checked pages clear the threshold - one dot each, filled
     when that page counts as answering. The verdict in one glance, drawn from
     the same overlaps the list below prints as numbers. */
  const passed = node.results.map((r) => r.overlap >= tree.threshold);

  /* REORDERED 2026-10-07, same content and the same rules. Most important
     first: the verdict and its evidence count, then the one action, then the
     pages the verdict was made from, then the reader's own verdict BELOW them
     (it can only be asked once the titles have been read), then AI Overview,
     and the method last, folded away - except the fetch time and the
     unvalidated threshold, which CLAUDE.md requires on screen. */
  return (
    <aside className={`panel qd${overlay ? " panel-overlay" : ""}`} aria-label={node.question}>
      <header className="qd-head">
        <h2>{node.question}</h2>
        {onClose && (
          <button className="panel-close" onClick={onClose} aria-label={t("detail.close")}
                  title={t("detail.close")}>
            ×
          </button>
        )}
      </header>
      <div className="qd-chips">
        <span>{t("detail.depth", { depth: node.depth })}</span>
        {node.repeat_count > 1 && <span>{t("detail.branches", { count: node.repeat_count })}</span>}
        {node.discovered_by === "harvest" && <span>{t("detail.harvestedNode")}</span>}
        <span title={t("table.volumeHint")}>
          {t("detail.volume")}: {t("table.noVolume")}
        </span>
      </div>

      {/* --- the verdict ---------------------------------------------- */}
      <section className={`qd-verdict ${node.status}`}>
        <span className="qd-verdict-label">{t(`status.${node.status}`)}</span>
        {hasData ? (
          <>
            <b className="qd-verdict-big">
              {t("status.evidence", { matching: node.matching_pages, checked: node.results_checked })}
            </b>
            <span className="qd-dots" aria-hidden>
              {passed.map((ok, i) => (
                <i key={i} className={ok ? "on" : undefined} />
              ))}
            </span>
          </>
        ) : null}
        <p>{t(`status.${node.status}Explained`)}</p>
      </section>

      {/* --- the one action ------------------------------------------- */}
      {(canScore || canOpenTree) && (
        <div className="qd-action">
          <button type="button" className="qd-primary" onClick={runScore} disabled={scoring}>
            {scoring
              ? t("detail.scoring")
              : canScore
                ? t("detail.scoreButton")
                : t("detail.openTree")}
          </button>
          {canScore && <p className="qd-fine">{t("detail.scoreCost")}</p>}
          {scoreError && (
            <div className="error" style={{ marginTop: 10 }}>
              <strong>{t(`error.${scoreError.kind}`, scoreError.values)}</strong>
              {scoreError.detail && (
                <div style={{ marginTop: 8 }}>
                  <code>{scoreError.detail}</code>
                </div>
              )}
            </div>
          )}
        </div>
      )}
      {!hasData && !canScore && (
        <p className="qd-note">
          <Rich html={t("detail.noResults")} />
        </p>
      )}

      {/* --- the evidence --------------------------------------------- */}
      {hasData && (
        <section className="qd-section">
          <h3>{t("detail.resultsHeading", { threshold: tree.threshold.toFixed(2) })}</h3>
          <ol className="qd-results">
            {node.results.map((result, i) => (
              <li key={`${result.url}-${i}`} className={passed[i] ? "is-passed" : undefined}>
                <span className="qd-score">{result.overlap.toFixed(2)}</span>
                <span className="qd-site" aria-hidden>
                  {(result.domain || "?").replace(/^www\./, "").charAt(0).toUpperCase()}
                </span>
                <span className="qd-result-body">
                  <a href={result.url} target="_blank" rel="noopener noreferrer">
                    {result.title || t("detail.untitled")}
                  </a>
                  <span className="qd-domain">{result.domain}</span>
                </span>
              </li>
            ))}
          </ol>
        </section>
      )}

      {/* --- the reader's verdict ------------------------------------- */}
      {/* BELOW the evidence, never above it: "do these page titles answer
          it?" can only be asked once the titles have been read. Both buttons
          carry equal weight - nudging either way biases the labels this
          exists to collect. */}
      {hasData && (
        <section className="qd-section qd-ask">
          <h3>{t("verdict.heading")}</h3>
          <p className="qd-note">{t("verdict.ask")}</p>
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
          {voting && <p className="qd-note">{t("verdict.saving")}</p>}
          {!voting && voted?.slug === node.slug && (
            <p className="qd-note">
              {t(voted.retracted ? "verdict.retracted" : "verdict.recorded")}
              {/* Only a disagreement can move the threshold; say so. */}
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
        </section>
      )}

      {/* --- AI Overview ---------------------------------------------- */}
      {node.results_checked > 0 && !aiKnown(node) && (
        <section className="qd-section">
          <h3>{t("detail.aiHeading")}</h3>
          <p className="qd-note">{t("detail.aiUnreadable")}</p>
        </section>
      )}
      {node.ai_sources.length > 0 && (
        <section className="qd-section qd-ai">
          <h3>
            {t("detail.aiHeading")}
            <span className="qd-count">{node.ai_sources.length}</span>
          </h3>
          <div className="qd-ai-list">
            {node.ai_sources.map((domain) => (
              <span className={site && citesSite(domain, site) ? "qd-ai-site is-you" : "qd-ai-site"} key={domain}>
                <i aria-hidden>{domain.replace(/^www\./, "").charAt(0).toUpperCase()}</i>
                {domain.replace(/^www\./, "")}
              </span>
            ))}
          </div>
          {site && (
            <p className="qd-note">
              {node.ai_sources.some((d) => citesSite(d, site))
                ? t("detail.aiYou", { site })
                : t("detail.aiNotYou", { site })}
            </p>
          )}
          <p className="qd-note">{t("detail.aiNote")}</p>
        </section>
      )}

      {/* --- when, and how -------------------------------------------- */}
      {/* When THIS question's results were fetched. A question that was never
          checked has no such moment, and "Updated: -" would be a field
          pretending to be a fact. */}
      {hasData && (
        <p className="qd-updated">
          {t("detail.updated", { date: formatDate(node.updated_at) })}
          {!tree.threshold_validated &&
            ` · ${t("notice.provisionalThreshold")} ${tree.threshold.toFixed(2)}`}
        </p>
      )}
      <details className="qd-tech">
        <summary>{t("detail.sourceHeading")}</summary>
        {node.source_file && <span className="qd-domain">{node.source_file}</span>}
        {/* Archive trees predate the relevance gate and omit the field. */}
        {node.reach != null && <span>{t("detail.relevance", { value: node.reach.toFixed(2) })}</span>}
        <span>
          {t("detail.matching", { strategy: tree.strategy, threshold: tree.threshold.toFixed(2) })}
          {!tree.threshold_validated && ` ${t("detail.unvalidated")}`}
        </span>
      </details>
    </aside>
  );
}
