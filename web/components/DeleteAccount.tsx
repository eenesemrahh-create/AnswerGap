"use client";

import { useState } from "react";
import { ApiError, clearTokenAndReload, eraseAccount } from "@/lib/api";
import type { Me } from "@/lib/types";
import { useI18n } from "@/i18n";

/**
 * The Privacy Policy's section 7, as a control. Lifted out of the account
 * dialog when that dialog became a page; the copy and both guards are
 * unchanged, because neither of them was about being in a dialog.
 *
 * TWO STEPS, AND THE FIRST ONE DELETES NOTHING. The confirmation names what
 * goes, what stays, and why - because "this cannot be undone" is the least
 * useful sentence a delete control can show. The person is about to decide
 * whether to lose their searches, and the honest answer is that they lose the
 * searches and keep the balance.
 *
 * RE-AUTHENTICATION, because a session token is fourteen days old by the time
 * most people use it. A password account re-types the password; a Google-only
 * account re-types its own address, which is what GitHub and Stripe ask for
 * and what actually defends against the unattended laptop.
 */
export function DeleteAccount({ me }: { me: Me }) {
  const { t, locale } = useI18n();
  const [confirming, setConfirming] = useState(false);
  const [proof, setProof] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Which proof to ask for. `has_password` is false for an account that only
  // ever came through Google, and there is no secret of ours to check for it.
  const byPassword = me.has_password !== false;

  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    setBusy(true);
    setError(null);
    eraseAccount(proof, locale)
      .then(() => {
        // The token is already dead server-side; this drops the copy in the
        // browser and returns to a signed-out landing.
        clearTokenAndReload();
      })
      .catch((err) => {
        setError(
          err instanceof ApiError ? t(`error.${err.kind}`, err.values) : t("auth.failed")
        );
        setBusy(false);
      });
  };

  if (!confirming) {
    return (
      <div className="account-danger">
        <p className="account-fine">{t("auth.deleteLead")}</p>
        <button className="btn account-delete" onClick={() => setConfirming(true)}>
          {t("auth.deleteAction")}
        </button>
      </div>
    );
  }

  return (
    <form className="auth-form account-danger" onSubmit={submit}>
      <h3>{t("auth.deleteConfirmTitle")}</h3>
      {/* What goes, then what stays. In that order, because the thing being
          given up is what the decision is actually about. */}
      <p className="account-muted">{t("auth.deleteRemoves")}</p>
      <p className="account-muted">{t("auth.deleteKeeps")}</p>
      <p className="account-fine">{t("auth.deleteRevives")}</p>

      <label className="auth-field">
        <span>
          {byPassword
            ? t("auth.deleteConfirmPassword")
            : t("auth.deleteConfirmEmail", { email: me.email ?? "" })}
        </span>
        <input
          type={byPassword ? "password" : "email"}
          autoComplete={byPassword ? "current-password" : "off"}
          required
          value={proof}
          onChange={(e) => setProof(e.target.value)}
        />
      </label>

      {error ? (
        <p className="auth-error" role="alert">
          {error}
        </p>
      ) : null}

      <button className="btn account-delete" disabled={busy}>
        {busy ? t("auth.working") : t("auth.deleteSubmit")}
      </button>
      <button
        className="auth-link"
        type="button"
        onClick={() => {
          setConfirming(false);
          setProof("");
          setError(null);
        }}
      >
        {t("auth.deleteCancel")}
      </button>
    </form>
  );
}
