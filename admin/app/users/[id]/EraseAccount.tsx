"use client";

import { useState, useTransition } from "react";
import { eraseUser } from "../actions";
import { makeT, type Locale } from "@/lib/i18n";

/**
 * Erase an account, in two deliberate acts.
 *
 * A client component rather than one more `<form action={…}>` like its three
 * neighbours, because those are all reversible - a suspension can be lifted, a
 * credit grant can be reversed by granting the other way - and this one is
 * not. The two-step is copied from the Stripe panel, which asks twice before
 * charging a real card: the first click only opens a warning, and the warning
 * names the address so the last click is never a bare "Yes".
 *
 * It sits apart from the Account block on purpose. A control that both
 * suspends and erases is a control somebody eventually misreads.
 */
export function EraseAccount({
  userId,
  email,
  erased,
  locale,
}: {
  userId: number;
  email: string;
  erased: boolean;
  /** The language, as a prop: a client component cannot read the cookie the
   *  server chose from, and `t` is a function so it cannot cross as a prop
   *  either. The catalogue is plain data and imports cleanly on both sides. */
  locale: Locale;
}) {
  const t = makeT(locale);
  const [asking, setAsking] = useState(false);
  const [reason, setReason] = useState("");
  const [message, setMessage] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();

  if (erased) {
    return (
      <p className="sub">{t("erase.already")}</p>
    );
  }

  const run = () => {
    setAsking(false);
    setMessage(null);
    startTransition(async () => {
      try {
        const out = await eraseUser(userId, reason);
        setMessage(
          out.already_erased
            ? t("erase.alreadyDone")
            : t("erase.done", {
                crawls: out.crawls,
                events: out.usage_events,
                payments: out.payments_redacted,
                creds: out.credentials_deleted,
              })
        );
      } catch {
        setMessage(t("erase.failed"));
      }
    });
  };

  return (
    <>
      <div className="row">
        <button
          className="act warn"
          disabled={pending}
          onClick={() => setAsking(true)}
        >
          {t("erase.button")}
        </button>
        <span className="sub" style={{ margin: 0 }}>{t("erase.buttonNote")}</span>
      </div>

      {asking && (
        <div className="notice">
          <p>
            <b>{t("erase.warnTitle")}</b> {t("erase.warnBody", { email })}
          </p>
          <p>{t("erase.warnKeeps")}</p>
          <p>{t("erase.warnPayments")}</p>
          <label className="row" style={{ marginTop: 8 }}>
            <input
              placeholder={t("erase.reasonPlaceholder")}
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              maxLength={200}
            />
          </label>
          <p className="sub" style={{ margin: 0 }}>{t("erase.reasonWarning")}</p>
          <div className="ci-buttons">
            <button className="act warn" disabled={pending} onClick={run}>
              {t("erase.confirm", { email })}
            </button>
            <button className="act" onClick={() => setAsking(false)}>
              {t("common.cancel")}
            </button>
          </div>
        </div>
      )}

      {message && <div className="ci-message">{message}</div>}
    </>
  );
}
