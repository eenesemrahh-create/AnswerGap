"use client";

import { useMemo } from "react";
import { useI18n } from "@/i18n";
import { aiKnown, citesSite, isCited } from "@/lib/domains";
import type { Node } from "@/lib/types";

/* Who Google's AI Overview cites across the whole tree.
 *
 * The data is free: `ai_sources` comes out of the same SERP response bought to
 * gap-score a question. It only exists for CHECKED questions, so every number
 * here is "of the questions checked", never of the whole tree - an unchecked
 * question is unknown, not "no AI Overview". */

const TOP_DOMAINS = 5;

/** Distinct cited domains of one node; an overview may cite a domain twice. */
export function citedDomains(node: Node): string[] {
  return Array.from(new Set(node.ai_sources ?? []));
}

export function AiSummary({
  nodes,
  siteInput,
  site,
  onSiteChange,
  onSelect,
}: {
  nodes: Node[];
  /** What the reader typed, kept verbatim so the field does not fight them. */
  siteInput: string;
  /** The same, normalized; null while it is empty or not yet a domain. */
  site: string | null;
  onSiteChange: (value: string) => void;
  onSelect: (id: string) => void;
}) {
  const { t } = useI18n();

  const { checked, unknown, withAi, top, citing } = useMemo(() => {
    /* Only questions whose AI answer could be READ are counted. An unresolved
       block is not "cites nobody" - it is a measurement that did not happen,
       and it is reported separately rather than folded into the denominator. */
    const checkedNodes = nodes.filter(aiKnown);
    const unknown = nodes.filter((n) => n.results_checked > 0 && !aiKnown(n)).length;
    const counts = new Map<string, number>();
    let withAi = 0;
    for (const node of checkedNodes) {
      const domains = citedDomains(node);
      if (domains.length > 0) withAi += 1;
      for (const d of domains) counts.set(d, (counts.get(d) ?? 0) + 1);
    }
    const top = [...counts.entries()]
      .sort((a, b) => b[1] - a[1] || a[0].localeCompare(b[0]))
      .slice(0, TOP_DOMAINS);
    const citing = site
      ? checkedNodes.filter((n) => isCited(n.ai_sources ?? [], site))
      : [];
    return { checked: checkedNodes.length, unknown, withAi, top, citing };
  }, [nodes, site]);

  const invalid = siteInput.trim() !== "" && site === null;

  return (
    <section className="ai-summary">
      <h3>{t("ai.heading")}</h3>
      {checked === 0 ? (
        <p className="note">
          {t("ai.noneChecked")}
          {unknown > 0 && ` ${t("ai.unreadable", { count: unknown })}`}
        </p>
      ) : (
        <>
          <p className="ai-summary-lead">
            {t("ai.coverage", { withAi, checked })}
          </p>
          {top.length > 0 && (
            <ol className="ai-domains">
              {top.map(([domain, count]) => (
                <li key={domain}>
                  <span
                    className={
                      site && citesSite(domain, site) ? "tag tag-you" : "tag"
                    }
                  >
                    {domain}
                  </span>
                  <span className="muted">
                    {t("ai.citedIn", { count, checked })}
                  </span>
                </li>
              ))}
            </ol>
          )}
          <p className="note">
            {t("ai.note")}
            {unknown > 0 && ` ${t("ai.unreadable", { count: unknown })}`}
          </p>
        </>
      )}

      {/* Unchecked questions are unknown, so the answer is always "of the
          questions checked" - never "you are missing from N questions". */}
      <div className="ai-site">
        <label className="ai-site-field">
          <span>{t("ai.siteLabel")}</span>
          <input
            className="search"
            type="text"
            inputMode="url"
            autoComplete="url"
            spellCheck={false}
            value={siteInput}
            onChange={(e) => onSiteChange(e.target.value)}
            placeholder={t("ai.sitePlaceholder")}
            aria-invalid={invalid}
          />
        </label>
        {invalid && <p className="note">{t("ai.siteInvalid")}</p>}
        {site && checked > 0 && (
          <>
            <p className="ai-summary-lead">
              {t("ai.siteCited", { site, count: citing.length, checked })}
            </p>
            {citing.length > 0 && (
              <ul className="ai-site-questions">
                {citing.map((node) => (
                  <li key={node.id}>
                    <button type="button" onClick={() => onSelect(node.id)}>
                      {node.question}
                    </button>
                  </li>
                ))}
              </ul>
            )}
            <p className="note">{t("ai.siteHint")}</p>
          </>
        )}
      </div>
    </section>
  );
}
