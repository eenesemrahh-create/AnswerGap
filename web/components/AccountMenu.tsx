"use client";

import { useCallback, useEffect, useState } from "react";
import { ApiError, fetchMe, resendVerification } from "@/lib/api";
import Link from "next/link";
import { SignInDialog } from "./SignInDialog";
import { LocalePicker } from "./LocalePicker";
import { ThemeToggle } from "./ThemeToggle";
import { captureTokenFromHash, token } from "@/lib/auth";
import { onSignInRequest } from "@/lib/signin-request";
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
 *
 * IT ALSO OWNS THE RETURN PATHS, and that is why they all live here rather
 * than on the landing page: every one of them ends in the same two actions —
 * take a token out of the URL, then refetch `/api/me`. Spread across the pages
 * that happen to be mounted, they would each need their own copy of that, and
 * `/tree/[slug]` would quietly lack one.
 *
 *   #token=…            a finished sign-in, from Google OR from a verification
 *                       link. Indistinguishable here, by design.
 *   ?verified=1         the address was just confirmed; say so and the credits
 *                       are live.
 *   ?reset=<token>      a password-reset link. Opens the dialog on its last
 *                       step with the token in hand.
 *   ?auth=…             something did not finish: denied, failed, expired.
 *                       `verifyExpired` opens the dialog on the step that
 *                       mails a fresh link; the rest are a sentence.
 */
export function AccountMenu({
  meta,
  onSessionChange,
}: {
  meta: Meta;
  /** Called after a sign-in completes here, so the page around this strip can
   *  refetch anything keyed on who is asking - `/api/meta`'s `role`, and the
   *  tree list, which is per-account. Optional: the tree screen has nothing
   *  that changes shape on sign-in. */
  onSessionChange?: () => void;
}) {
  const { t, locale } = useI18n();
  const [me, setMe] = useState<Me | null>(null);
  const [notice, setNotice] = useState<string | null>(null);
  const [dialog, setDialog] = useState(false);
  const [dialogMode, setDialogMode] = useState<
    "signin" | "signup" | "reset" | "resend"
  >("signin");
  /* Why the dialog opened, when something other than the sign-in button opened
     it. `SignInDialog` has always had the prop and nothing ever passed it. */
  const [dialogReason, setDialogReason] = useState<string | undefined>();
  const [resetToken, setResetToken] = useState<string | undefined>();
  const [resent, setResent] = useState(false);
  const [resending, setResending] = useState(false);

  const load = useCallback(() => {
    if (!token()) {
      setMe(null);
      return;
    }
    fetchMe()
      .then(setMe)
      .catch(() => setMe(null));
  }, []);

  /* Something elsewhere on the page hit a wall that only signing in clears —
     today the search box, which refuses to spend a request it knows will be
     refused. The dialog is mounted here, so the request is answered here. */
  useEffect(() => {
    if (!meta.accounts_enabled) return;
    return onSignInRequest(({ mode, reason }) => {
      setDialogReason(reason);
      setDialogMode(mode);
      setDialog(true);
    });
  }, [meta.accounts_enabled]);

  useEffect(() => {
    if (!meta.accounts_enabled) return;
    // The API redirects back with the token in a URL fragment. Take it out of
    // the address bar before anything else, so a copied link cannot carry a
    // session and a refresh does not re-read a stale one.
    captureTokenFromHash();

    if (typeof window !== "undefined") {
      const params = new URLSearchParams(window.location.search);
      const reason = params.get("auth");
      const reset = params.get("reset");

      if (params.get("verified") === "1") setNotice(t("auth.verifiedToast"));
      // One message per outcome the API can redirect with. `denied` is the
      // consent screen being dismissed, which is a decision rather than a
      // fault, so it says nothing at all.
      //
      // A dead verification link is the one outcome that gets a DIALOG rather
      // than a sentence. The person holding it has no session, so the resend
      // button in the strip below is not reachable for them - and a notice
      // reading "ask for a new one" with nothing to ask with is a dead end.
      else if (reason === "verifyExpired") {
        setDialogMode("resend");
        setDialog(true);
      }
      // A link clicked twice, or one a mail scanner opened first. Nothing is
      // wrong and nothing needs doing, so it is a sentence rather than a
      // dialog - and pointedly NOT the expired copy, which would send
      // somebody chasing a replacement they do not need.
      /* The marketing pages are server components and cannot open a dialog
         that lives here, so their Sign in / Sign up buttons link to
         `/?auth=signin|signup` instead. Added 2026-09-24 with those pages;
         until now the links landed on the home page and did nothing at all,
         which is the most confusing thing a button can do. */
      else if (reason === "signin" || reason === "signup") {
        setDialogMode(reason);
        setDialog(true);
      }
      else if (reason === "alreadyVerified")
        setNotice(t("auth.alreadyVerified"));
      else if (reason === "failed" || reason === "verifyFailed")
        setNotice(t("auth.failed"));
      else if (reason === "suspended") setNotice(t("error.suspended"));

      if (reset) {
        setResetToken(reset);
        setDialogMode("reset");
        setDialog(true);
      }

      // Scrub every one of them from the address bar. A reset token left in
      // the URL survives in history and in anything the reader copies, and
      // the notices would otherwise reappear on refresh long after they were
      // true.
      if (reason || reset || params.get("verified")) {
        params.delete("auth");
        params.delete("reset");
        params.delete("verified");
        const query = params.toString();
        window.history.replaceState(
          null,
          "",
          window.location.pathname + (query ? `?${query}` : "")
        );
      }
    }
    load();
    // `t` is stable per locale and `load` is a stable callback; re-running on
    // either would re-read query parameters this effect has already scrubbed.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [meta.accounts_enabled]);

  const resend = () => {
    if (!me?.email) return;
    setResending(true);
    resendVerification(me.email, locale)
      .then(() => setResent(true))
      .catch((e) =>
        setNotice(e instanceof ApiError ? t(`error.${e.kind}`, e.values) : null)
      )
      .finally(() => setResending(false));
  };

  /* No accounts on this deployment - a laptop with no SESSION_SECRET or no
     database. There is no sign-in to offer, but theme and language are not
     account features and must not disappear with the account strip. This used
     to `return null` and would have taken both controls off every screen the
     moment accounts were switched off. */
  if (!meta.accounts_enabled) {
    return (
      <div className="account">
        <ThemeToggle />
        <LocalePicker />
      </div>
    );
  }

  const dialogEl = (
    <SignInDialog
      open={dialog}
      onClose={() => {
        setDialog(false);
        setDialogMode("signin");
        setDialogReason(undefined);
        setResetToken(undefined);
      }}
      googleEnabled={meta.google_enabled !== false}
      initialMode={dialogMode}
      reason={dialogReason}
      resetToken={resetToken}
      /* Reload this strip AND tell the page.
       *
       * `/api/meta` carries `role`, and the landing decides between the
       * marketing hero and the search box from it - but meta is fetched once
       * on mount and signing in does not remount anything. So a reader who
       * signed in from this dialog got an account strip with their credits in
       * it above a hero still inviting them to create an account. Signing OUT
       * never had the bug: it reloads the page. */
      onSignedIn={() => {
        load();
        onSessionChange?.();
      }}
    />
  );

  if (!me) {
    return (
      <div className="account">
        {notice && <span className="account-failed">{notice}</span>}
        {/* Opens the dialog rather than jumping straight to Google. A bare
            button never says what signing in gets you, and the redirect is a
            full page navigation - a heavy thing to trigger from a click whose
            consequences the reader has not been told. */}
        <button
          className="btn btn-primary account-signin"
          onClick={() => {
            setDialogMode("signin");
            setDialog(true);
          }}
        >
          {t("auth.tabSignIn")}
        </button>
        {/* Theme and language stay HERE for a signed-out visitor, and only
            here. Signed in they live on `/account` under Settings, but
            somebody who has not signed in cannot reach that page - and a
            five-locale product whose Turkish visitor lands on English with no
            way to switch has lost them before the first search. */}
        <ThemeToggle />
        <LocalePicker />
        {dialogEl}
      </div>
    );
  }

  return (
    <div className="account">
      {/* The unverified state is a STRIP, not a disabled button somewhere.
          Every spending action will refuse with `emailUnverified` until the
          link is clicked, so the reason has to be visible before the reader
          tries - and the thing that fixes it has to be one click away from
          the explanation. */}
      {me.email_verified === false && (
        <span className="account-unverified" role="status">
          {resent ? t("auth.sentAgain") : t("auth.verifyBanner")}
          {!resent && (
            <button onClick={resend} disabled={resending}>
              {resending ? t("auth.working") : t("auth.verifyBannerAction")}
            </button>
          )}
        </span>
      )}
      {notice && <span className="account-failed">{notice}</span>}
      {/* A LINK TO A PAGE, and it used to open a dialog.
          The dialog was the right shape for what it held - an address, a
          balance and a delete button - and the wrong shape the moment there
          was a plan to describe. A plan has a status, a renewal date, a
          history and alternatives to move to, and none of that belongs in
          something the reader has to dismiss before looking at anything else.
          The argument that put erasure behind this control rather than beside
          "Sign out" is unchanged; `/account` keeps it at the bottom of the
          page, under its own heading. */}
      {/* THE AVATAR ALONE, once signed in.
          The address, the balance, the theme toggle, the language picker and
          "Sign out" all used to sit in this strip. Five controls, on every
          screen, for things somebody adjusts once - and the address in
          particular is a fact the reader already knows, printed in the corner
          of every page they own.
          They are all on `/account` now: the balance under Credits, the rest
          under Settings. What stays here is the one thing this strip is for -
          who you are, and the way to the page about it. The address survives
          as the link's `title`, so hovering still answers "which account am I
          in?" without the screen having to say it out loud. */}
      <Link
        className="account-who"
        href="/account"
        title={t("auth.signedInAs", { email: me.email })}
        aria-label={t("auth.account")}
      >
        {me.picture_url ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img className="account-avatar" src={me.picture_url} alt="" />
        ) : (
          <i className="account-avatar account-avatar-blank" />
        )}
      </Link>
      {dialogEl}
    </div>
  );
}
