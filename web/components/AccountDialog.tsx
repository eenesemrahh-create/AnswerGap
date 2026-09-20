"use client";

import { useEffect, useRef, useState } from "react";
import { ApiError, clearTokenAndReload, eraseAccount } from "@/lib/api";
import type { Me } from "@/lib/types";
import { useI18n } from "@/i18n";

/**
 * Who you are, what you have left, and the way out.
 *
 * This app has no account page and did not need one until erasure: the whole
 * account surface was a strip in the nav with an email, a balance and a
 * "Sign out" button. A delete control there would have sat one misclick from
 * sign-out, in a strip that has no destructive style at all — so the account
 * gets a dialog instead, on the same native `<dialog>` + `showModal()` that
 * `SignInDialog` already uses.
 *
 * TWO STEPS, AND THE FIRST ONE DELETES NOTHING. The confirmation names what
 * goes, what stays, and why — because "this cannot be undone" is the least
 * useful sentence a delete dialog can show. The person is about to decide
 * whether to lose their searches, and the honest answer is that they lose the
 * searches and keep the balance.
 *
 * RE-AUTHENTICATION, because a session token is fourteen days old by the time
 * most people use it. A password account re-types the password; a Google-only
 * account re-types its own address, which is what GitHub and Stripe ask for
 * and what actually defends against the unattended laptop.
 */
export function AccountDialog({
  open,
  onClose,
  me,
}: {
  open: boolean;
  onClose: () => void;
  me: Me;
}) {
  const { t, locale } = useI18n();
  const ref = useRef<HTMLDialogElement>(null);

  const [confirming, setConfirming] = useState(false);
  const [proof, setProof] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const node = ref.current;
    if (!node) return;
    if (open && !node.open) node.showModal();
    if (!open && node.open) node.close();
  }, [open]);

  // Reset during render when the dialog reopens, the pattern `SignInDialog`
  // documents: an effect would paint the old step first and then correct it.
  // Reopening on the confirmation step, with a typed password still in the
  // box, is exactly the state this must never be in.
  const [wasOpen, setWasOpen] = useState(open);
  if (open !== wasOpen) {
    setWasOpen(open);
    if (open) {
      setConfirming(false);
      setProof("");
      setError(null);
    }
  }

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

  return (
    <dialog
      ref={ref}
      className="dialog"
      onClose={onClose}
      onClick={(e) => {
        if (e.target === ref.current) ref.current?.close();
      }}
    >
      <div className="dialog-body">
        <button
          className="dialog-close"
          onClick={() => ref.current?.close()}
          aria-label={t("auth.close")}
        >
          ×
        </button>

        <div className="dialog-mark" aria-hidden />
        <h2>{t("auth.account")}</h2>

        <dl className="account-facts">
          <dt>{t("auth.accountEmail")}</dt>
          <dd>{me.email}</dd>
          <dt>{t("credits.label")}</dt>
          <dd>{me.credits}</dd>
        </dl>

        {!confirming ? (
          <div className="account-danger">
            <h3>{t("auth.deleteTitle")}</h3>
            <p className="dialog-fine">{t("auth.deleteLead")}</p>
            <button
              className="btn btn-wide account-delete"
              onClick={() => setConfirming(true)}
            >
              {t("auth.deleteAction")}
            </button>
          </div>
        ) : (
          <form className="auth-form account-danger" onSubmit={submit}>
            <h3>{t("auth.deleteConfirmTitle")}</h3>
            {/* What goes, then what stays. In that order, because the thing
                being given up is what the decision is actually about. */}
            <p className="dialog-sub">{t("auth.deleteRemoves")}</p>
            <p className="dialog-sub">{t("auth.deleteKeeps")}</p>
            <p className="dialog-fine">{t("auth.deleteRevives")}</p>

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

            <button className="btn btn-wide account-delete" disabled={busy}>
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
        )}
      </div>
    </dialog>
  );
}
