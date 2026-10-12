"use client";

import { useEffect } from "react";
import { useI18n, useDateFormat } from "@/i18n";

/**
 * The question asked when somebody searches a seed they already have
 * (operator's rule, 2026-10-12): open the saved result for free and at once,
 * or update it with the newest data for one credit.
 *
 * Both choices carry equal weight - neither is the "right" answer, and
 * nudging toward the paid one would be selling, not asking.
 */
export function RepeatSearchDialog({
  seed,
  savedAt,
  onOpen,
  onUpdate,
  onCancel,
}: {
  seed: string;
  /** When the saved result was last updated, if known. */
  savedAt: string | null;
  onOpen: () => void;
  onUpdate: () => void;
  onCancel: () => void;
}) {
  const { t } = useI18n();
  const formatDate = useDateFormat();
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onCancel();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [onCancel]);
  return (
    <div className="repeat-backdrop" role="presentation" onClick={onCancel}>
      <div
        className="repeat-dialog"
        role="dialog"
        aria-modal="true"
        aria-labelledby="repeat-title"
        onClick={(e) => e.stopPropagation()}
      >
        <h2 id="repeat-title">{t("repeat.title", { seed })}</h2>
        <p>
          {savedAt
            ? t("repeat.leadDated", { date: formatDate(savedAt) })
            : t("repeat.lead")}
        </p>
        <div className="repeat-choices">
          <button type="button" className="repeat-choice" onClick={onOpen} autoFocus>
            <b>{t("repeat.open")}</b>
            <span>{t("repeat.openNote")}</span>
          </button>
          <button type="button" className="repeat-choice" onClick={onUpdate}>
            <b>{t("repeat.update")}</b>
            <span>{t("repeat.updateNote")}</span>
          </button>
        </div>
        <button type="button" className="repeat-cancel" onClick={onCancel}>
          {t("repeat.cancel")}
        </button>
      </div>
    </div>
  );
}
