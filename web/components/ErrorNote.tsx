"use client";

import type { ApiError } from "@/lib/api";
import { useI18n } from "@/i18n";

/**
 * What went wrong, and the backend hint only where it is true advice.
 *
 * THE HINT USED TO RENDER UNDER EVERY ERROR. A deployed customer who opened a
 * tree that no longer exists was shown `404 — /api/tree/king-arthur-en-2840`
 * and then told to run `python -m uvicorn` from a project root they do not
 * have. Two faults in one box: our route name standing in for their problem,
 * and developer instructions on a production screen.
 *
 * So the hint is gated twice, and both gates are needed. The DEVELOPMENT build,
 * because nobody reading a deployed page can act on it; and `unreachable`,
 * because that is the only kind that actually means "nothing answered" - every
 * other kind arrives as an HTTP reply, which proves the backend is up.
 */
export function ErrorNote({ error }: { error: ApiError }) {
  const { t } = useI18n();
  const showHint =
    process.env.NODE_ENV !== "production" && error.kind === "unreachable";

  return (
    <>
      <strong>{t(`error.${error.kind}`, error.values)}</strong>
      {showHint && (
        <div style={{ marginTop: 8 }}>
          {t("error.startBackend")}
          <br />
          <code>python -m uvicorn api.main:app --reload --port 8000</code>
        </div>
      )}
    </>
  );
}
