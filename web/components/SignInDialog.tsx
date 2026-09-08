"use client";

import { useEffect, useRef } from "react";
import { signIn } from "@/lib/api";
import { useI18n } from "@/i18n";

/**
 * Sign-in, in a dialog rather than a bare button.
 *
 * Built on the native `<dialog>` element with `showModal()`, which brings the
 * focus trap, the Esc key, the inert background and the top-layer stacking for
 * free — all of which a div-with-a-backdrop has to reimplement, and usually
 * reimplements badly. The only thing added by hand is the click-outside close.
 *
 * It exists because a lone "Sign in with Google" button never says what you
 * get. The dialog answers the question the reader actually has — why hand over
 * an identity at all — with the three concrete things: credits, a private list
 * of your own searches, and the ability to check individual questions.
 *
 * It is also where a refusal lands. When the API says the free daily search is
 * spent, the honest next step is signing in, so the message that explains the
 * refusal and the button that resolves it are in one place.
 */
export function SignInDialog({
  open,
  onClose,
  reason,
}: {
  open: boolean;
  onClose: () => void;
  /** Set when the dialog was opened BY a refusal, so it can say which one. */
  reason?: string;
}) {
  const { t } = useI18n();
  const ref = useRef<HTMLDialogElement>(null);

  useEffect(() => {
    const node = ref.current;
    if (!node) return;
    if (open && !node.open) node.showModal();
    if (!open && node.open) node.close();
  }, [open]);

  return (
    <dialog
      ref={ref}
      className="dialog"
      // Fires for Esc and for the close button alike, so the parent's state
      // cannot drift out of sync with the element's own.
      onClose={onClose}
      onClick={(e) => {
        // ::backdrop clicks land on the dialog itself, so compare the target.
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
        <h2>{t("auth.dialogTitle")}</h2>
        {reason ? (
          <p className="dialog-reason">{reason}</p>
        ) : (
          <p className="dialog-sub">{t("auth.why")}</p>
        )}

        <ul className="dialog-list">
          <li>{t("auth.benefitCredits")}</li>
          <li>{t("auth.benefitPrivate")}</li>
          <li>{t("auth.benefitScore")}</li>
        </ul>

        <button className="btn btn-primary btn-wide" onClick={signIn}>
          <span className="g-mark" aria-hidden>
            G
          </span>
          {t("auth.signIn")}
        </button>

        <p className="dialog-fine">{t("auth.noCard")}</p>
      </div>
    </dialog>
  );
}
