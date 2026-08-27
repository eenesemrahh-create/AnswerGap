"use client";

import Link from "next/link";
import { useI18n } from "@/i18n";

/* Related searches: the cheapest surface in the product.
 *
 * Every SERP response already carries eight of these, and until now they were
 * read out of the JSON and thrown away — measured at 71 unseen phrases across
 * the responses bought for one `knight online` tree.
 *
 * They are deliberately NOT part of the question tree. "Knight Online private
 * server" is a query, not a question, and mixing the two would quietly turn a
 * question tree into a keyword list. What they are is the next seed, so each
 * one links back to the search box with the phrase already filled in.
 */

export function RelatedSeeds({ phrases }: { phrases: string[] }) {
  const { t } = useI18n();

  if (phrases.length === 0) {
    return <div className="panel-empty">{t("seeds.empty")}</div>;
  }

  return (
    <div className="seeds">
      <p className="note">{t("seeds.note")}</p>
      <div className="seed-list">
        {phrases.map((phrase) => (
          <Link
            key={phrase}
            className="seed-chip"
            href={`/?seed=${encodeURIComponent(phrase)}`}
          >
            {phrase}
          </Link>
        ))}
      </div>
    </div>
  );
}
