"use client";

import { useState } from "react";
import { ApiError } from "@/lib/api";
import { useI18n } from "@/i18n";

/**
 * Send the browser to Stripe, keeping the button busy until it leaves.
 *
 * Minting a checkout or portal link takes a second, and a button that looks
 * idle in that second gets pressed twice. `busy` names WHICH button, so the
 * others on the page stay usable but cannot start a second redirect.
 */
export function useBilling() {
  const { t } = useI18n();
  const [busy, setBusy] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const goTo = (key: string, call: () => Promise<{ url: string }>) => {
    setBusy(key);
    setError(null);
    call()
      .then(({ url }) => {
        window.location.href = url;
      })
      .catch((err) => {
        setError(
          err instanceof ApiError ? t(`error.${err.kind}`, err.values) : t("auth.failed")
        );
        setBusy(null);
      });
  };

  return { busy, error, goTo };
}
