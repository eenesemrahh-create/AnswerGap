"use client";

import { useMemo } from "react";
import { useI18n } from "@/i18n";
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

export function AiSummary({ nodes }: { nodes: Node[] }) {
  const { t } = useI18n();

  const { checked, withAi, top } = useMemo(() => {
    const checkedNodes = nodes.filter((n) => n.results_checked > 0);
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
    return { checked: checkedNodes.length, withAi, top };
  }, [nodes]);

  return (
    <section className="ai-summary">
      <h3>{t("ai.heading")}</h3>
      {checked === 0 ? (
        <p className="note">{t("ai.noneChecked")}</p>
      ) : (
        <>
          <p className="ai-summary-lead">
            {t("ai.coverage", { withAi, checked })}
          </p>
          {top.length > 0 && (
            <ol className="ai-domains">
              {top.map(([domain, count]) => (
                <li key={domain}>
                  <span className="tag">{domain}</span>
                  <span className="muted">
                    {t("ai.citedIn", { count, checked })}
                  </span>
                </li>
              ))}
            </ol>
          )}
          <p className="note">{t("ai.note")}</p>
        </>
      )}
    </section>
  );
}
