"use client";

import { useI18n } from "@/i18n";
import { WRITE_FIRST_LIMIT, writeFirst } from "@/lib/write-first";
import type { Node } from "@/lib/types";

/* The answer to "what should I write?", above the table. Reads the whole tree,
 * so a filter does not change it. Says nothing until a question is checked:
 * "no gaps" would then be a claim about questions nobody has looked at. */
export function WriteFirst({
  nodes,
  onSelect,
}: {
  nodes: Node[];
  onSelect: (id: string) => void;
}) {
  const { t } = useI18n();
  if (!nodes.some((n) => n.depth > 0 && n.results_checked > 0)) return null;
  const list = writeFirst(nodes).slice(0, WRITE_FIRST_LIMIT);

  return (
    <section className="write-first">
      <h3>{t("writeFirst.title")}</h3>
      {list.length === 0 ? (
        <p className="write-first-lead">{t("writeFirst.none")}</p>
      ) : (
        <>
          <p className="write-first-lead">{t("writeFirst.lead")}</p>
          <ol>
            {list.map((node) => (
              <li key={node.id}>
                <button type="button" onClick={() => onSelect(node.id)}>
                  <b>{node.question}</b>
                  <span>
                    {t("writeFirst.pages", {
                      matching: node.matching_pages,
                      checked: node.results_checked,
                    })}
                    {node.repeat_count > 1 && ` · ×${node.repeat_count}`}
                  </span>
                </button>
              </li>
            ))}
          </ol>
          <p className="write-first-note">{t("writeFirst.order")}</p>
        </>
      )}
    </section>
  );
}
