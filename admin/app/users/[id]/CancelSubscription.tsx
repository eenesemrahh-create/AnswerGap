"use client";

import { useState, useTransition } from "react";
import { cancelSubscription } from "../actions";
import { makeT, type Locale } from "@/lib/i18n";

/**
 * Cancel a paid subscription, in two deliberate acts.
 *
 * The first click only picks WHEN - now, or at the end of the paid period -
 * and opens a confirmation that says which, and whether it is a live
 * subscription. The second click is what reaches Stripe. Same shape as
 * EraseAccount and the Stripe panel's live charge.
 */
export function CancelSubscription({
  userId,
  subscriptionId,
  endsAtPeriodEnd,
  livemode,
  locale,
}: {
  userId: number;
  subscriptionId: number;
  endsAtPeriodEnd: boolean;
  livemode: boolean | null;
  locale: Locale;
}) {
  const t = makeT(locale);
  const [asking, setAsking] = useState<"now" | "period_end" | null>(null);
  const [message, setMessage] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();

  const run = (when: "now" | "period_end") =>
    startTransition(async () => {
      setAsking(null);
      setMessage(null);
      try {
        await cancelSubscription(userId, subscriptionId, when);
      } catch {
        // The api answers 502 with Stripe's code when Stripe refuses; the
        // admin client turns that into the error page, so reaching here
        // means the page itself could not finish the request.
        setMessage(t("cancel.failed"));
      }
    });

  if (asking) {
    return (
      <div className="notice">
        <b>{asking === "now" ? t("cancel.confirmNow") : t("cancel.confirmPeriodEnd")}</b>
        {livemode && <p>{t("cancel.liveWarning")}</p>}
        <div className="ci-buttons" style={{ marginTop: 8 }}>
          <button className="act warn" disabled={pending} onClick={() => run(asking)}>
            {t("cancel.yes")}
          </button>
          <button className="act" disabled={pending} onClick={() => setAsking(null)}>
            {t("common.cancel")}
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="ci-buttons">
      <button className="act warn" disabled={pending} onClick={() => setAsking("now")}>
        {pending ? t("cancel.working") : t("cancel.now")}
      </button>
      {!endsAtPeriodEnd && (
        <button className="act" disabled={pending} onClick={() => setAsking("period_end")}>
          {t("cancel.periodEnd")}
        </button>
      )}
      {endsAtPeriodEnd && <span className="pill ci-idle">{t("cancel.scheduled")}</span>}
      {message && <span className="neg">{message}</span>}
    </div>
  );
}
