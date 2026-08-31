"use client";

import { useI18n } from "@/i18n";
import type { Status } from "@/lib/types";

/**
 * A question's state, with the evidence beside it.
 *
 * The label names what the reader concludes; the count says what was actually
 * observed. Both are shown because only one of them is settled: CLAUDE.md's own
 * measurement puts the best lexical rule at precision 0.20, so the category is
 * still a judgement while "1 of 8 pages" is simply true. Leading with the word
 * alone would assert more than the data supports.
 *
 * `checked` of 0 means nothing was ever fetched. The count is omitted there
 * rather than rendered as "0 of 0", which would read like a finding when it is
 * an absence — the same distinction the dashed outline draws.
 */
export function Badge({
  status,
  matching,
  checked,
}: {
  status: Status;
  matching?: number;
  checked?: number;
}) {
  const { t } = useI18n();
  const hasEvidence = typeof checked === "number" && checked > 0;
  return (
    <span className={`badge ${status}`}>
      {t(`status.${status}`)}
      {hasEvidence && (
        <em className="badge-evidence">
          {t("status.evidence", { matching: matching ?? 0, checked })}
        </em>
      )}
    </span>
  );
}

/**
 * Honesty chips shown on every screen.
 *
 * CLAUDE.md accuracy rules — never claim live data, always show when it was last
 * updated — are part of the product's claim, not polish to add later. Keeping
 * them in the header means you cannot ship a screen that quietly drops them.
 */
export function Notice({
  children,
  title,
}: {
  children: React.ReactNode;
  title?: string;
}) {
  return (
    <span className="notice" title={title}>
      {children}
    </span>
  );
}

/** Renders a message that contains inline <b> markup from the catalogue. */
export function Rich({ html }: { html: string }) {
  return <span dangerouslySetInnerHTML={{ __html: html }} />;
}
