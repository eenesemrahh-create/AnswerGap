"use client";

import { useI18n } from "@/i18n";
import type { Status } from "@/lib/types";

export function Badge({ status }: { status: Status }) {
  const { t } = useI18n();
  return <span className={`badge ${status}`}>{t(`status.${status}`)}</span>;
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
