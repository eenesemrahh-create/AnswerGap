"use client";

import { useEffect, useState } from "react";
import { fetchMe, signOut } from "@/lib/api";
import { SignInDialog } from "./SignInDialog";
import { captureTokenFromHash, token } from "@/lib/auth";
import type { Me, Meta } from "@/lib/types";
import { useI18n } from "@/i18n";

/**
 * Sign in, or who you are and what you have left.
 *
 * Renders NOTHING when `accounts_enabled` is false — a laptop with no
 * SESSION_SECRET or no database has no accounts, and offering a button that
 * cannot work is worse than offering none.
 *
 * The balance comes from `/api/me`, never from `/api/meta`: that endpoint is
 * the deployment healthcheck and must not query. The trade is one extra request
 * on load, and only for visitors who actually hold a token.
 */
export function AccountMenu({ meta }: { meta: Meta }) {
  const { t } = useI18n();
  const [me, setMe] = useState<Me | null>(null);
  const [failed, setFailed] = useState(false);
  const [dialog, setDialog] = useState(false);

  useEffect(() => {
    if (!meta.accounts_enabled) return;
    // The API redirects back with the token in a URL fragment. Take it out of
    // the address bar before anything else, so a copied link cannot carry a
    // session and a refresh does not re-read a stale one.
    captureTokenFromHash();
    if (typeof window !== "undefined") {
      // `?auth=failed` / `?auth=denied` come back on the paths where there is
      // no token to hand over - a refused consent screen, or Google erroring.
      const reason = new URLSearchParams(window.location.search).get("auth");
      if (reason) setFailed(reason === "failed");
    }
    if (!token()) return;
    fetchMe()
      .then(setMe)
      .catch(() => setMe(null));
  }, [meta.accounts_enabled]);

  if (!meta.accounts_enabled) return null;

  if (!me) {
    return (
      <div className="account">
        {failed && <span className="account-failed">{t("auth.failed")}</span>}
        {/* Opens the dialog rather than jumping straight to Google. A bare
            button never says what signing in gets you, and the redirect is a
            full page navigation - a heavy thing to trigger from a click whose
            consequences the reader has not been told. */}
        <button className="btn btn-primary account-signin" onClick={() => setDialog(true)}>
          {t("auth.signIn")}
        </button>
        <SignInDialog open={dialog} onClose={() => setDialog(false)} />
      </div>
    );
  }

  return (
    <div className="account">
      <span className="account-who" title={t("auth.signedInAs", { email: me.email })}>
        {me.picture_url ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img className="account-avatar" src={me.picture_url} alt="" />
        ) : (
          <i className="account-avatar account-avatar-blank" />
        )}
        {me.email}
      </span>
      {/* Zero is shown as "no credits left" rather than as "0 credits", and a
          negative balance is shown as it stands. A debit is unconditional
          because the money was already spent upstream; hiding an overspend
          would make the number disagree with the ledger behind it. */}
      <b className={`account-credits${me.credits <= 0 ? " empty" : ""}`}>
        {me.credits <= 0
          ? t("credits.empty")
          : t("credits.balance", { count: me.credits })}
      </b>
      <button className="account-signout" onClick={signOut}>
        {t("auth.signOut")}
      </button>
    </div>
  );
}
