"use client";

import { useEffect, useRef, useState } from "react";
import {
  ApiError,
  forgotPassword,
  logIn,
  resendVerification,
  resetPassword,
  signIn,
  signUp,
} from "@/lib/api";
import { useI18n } from "@/i18n";

/**
 * Sign-in and sign-up, in a dialog rather than a bare button.
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
 *
 * SIX MODES, ONE DIALOG. Signing in, signing up, "check your inbox", "I
 * forgot", "choose a new password" and "that link expired" are six steps of
 * ONE errand, and a reader who lands on any of them may need to be on another.
 * Splitting them across routes would mean a full navigation — and a lost
 * password field — every time somebody guessed wrong about which one they
 * wanted.
 *
 * `resend` is the one step nobody asks for: it is where a DEAD verification
 * link lands. It needs its own email field because the reader arriving there
 * has no session and never typed an address into this dialog — which is
 * exactly why the `sent` step, whose resend button is disabled without one,
 * could not serve as the destination.
 *
 * EMAIL FIRST, GOOGLE SECOND, AND THAT ORDERING IS A DECISION. Google is one
 * click and will stay the most-used door, but putting it on top makes the
 * email form read as the fallback for people who could not manage the easy
 * option. They are two equal doors; the form is simply the one that needs the
 * room.
 */

type Mode = "signin" | "signup" | "sent" | "forgot" | "reset" | "resend";

export function SignInDialog({
  open,
  onClose,
  reason,
  googleEnabled = true,
  initialMode = "signin",
  resetToken,
  onSignedIn,
}: {
  open: boolean;
  onClose: () => void;
  /** Set when the dialog was opened BY a refusal, so it can say which one. */
  reason?: string;
  /** False hides the Google button entirely — see `Meta.google_enabled`. */
  googleEnabled?: boolean;
  /** Which step to land on. `reset` is what a mailed link opens. */
  initialMode?: Mode;
  /** The one-time token from `?reset=…`, present only in `reset` mode. */
  resetToken?: string;
  /** Called once a session actually exists, so the page can refetch `/api/me`. */
  onSignedIn?: () => void;
}) {
  const { t, locale } = useI18n();
  const ref = useRef<HTMLDialogElement>(null);

  const [mode, setMode] = useState<Mode>(initialMode);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [name, setName] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [resent, setResent] = useState(false);

  useEffect(() => {
    const node = ref.current;
    if (!node) return;
    if (open && !node.open) node.showModal();
    if (!open && node.open) node.close();
  }, [open]);

  // A reopened dialog starts where the caller asked, not where the reader left
  // off. Without this, being refused for `emailUnverified` would reopen on the
  // "check your inbox" step from an unrelated earlier visit.
  //
  // Adjusted DURING RENDER rather than in an effect, which is React's
  // documented pattern for "reset state when a prop changes": React re-runs
  // this component immediately without committing the first pass, so the
  // reader never sees a frame of the stale step. An effect would paint the old
  // mode first and then correct it, and `react-hooks/set-state-in-effect`
  // flags exactly that.
  const [wasOpen, setWasOpen] = useState(open);
  if (open !== wasOpen) {
    setWasOpen(open);
    if (open) {
      setMode(initialMode);
      setError(null);
      setResent(false);
      setPassword("");
    }
  }

  /** Translate an ApiError the same way the rest of the app does.
   *
   * `t()` falls back to the raw key when a translation is missing, so an
   * unknown kind still renders something — but every member of `ErrorKind`
   * has a key in all five locales, and the build does not check that link.
   */
  const explain = (e: unknown): string => {
    if (e instanceof ApiError) return t(`error.${e.kind}`, e.values);
    return t("auth.failed");
  };

  const run = async (action: () => Promise<void>) => {
    setBusy(true);
    setError(null);
    try {
      await action();
    } catch (e) {
      setError(explain(e));
      // An unverified account that tried to sign in is not a failure the
      // reader can fix in this form — the next step is in their inbox, so the
      // dialog moves there rather than leaving them re-typing a password that
      // was already correct.
      if (e instanceof ApiError && e.kind === "emailUnverified") setMode("sent");
    } finally {
      setBusy(false);
    }
  };

  const submitSignIn = (e: React.FormEvent) => {
    e.preventDefault();
    run(async () => {
      await logIn(email, password);
      onSignedIn?.();
      ref.current?.close();
    });
  };

  const submitSignUp = (e: React.FormEvent) => {
    e.preventDefault();
    run(async () => {
      await signUp({ email, password, name: name || undefined, locale });
      // No token comes back and none is expected: the account cannot hold a
      // session until the mailed link is clicked.
      setMode("sent");
    });
  };

  const submitForgot = (e: React.FormEvent) => {
    e.preventDefault();
    run(async () => {
      await forgotPassword(email, locale);
      setMode("sent");
      setResent(true);
    });
  };

  const submitReset = (e: React.FormEvent) => {
    e.preventDefault();
    run(async () => {
      await resetPassword(resetToken ?? "", password);
      onSignedIn?.();
      ref.current?.close();
    });
  };

  const doResend = () =>
    run(async () => {
      await resendVerification(email, locale);
      setResent(true);
    });

  // Same call, but from the step that had to ask for the address first, so it
  // ends on the inbox step rather than leaving the reader on a form they have
  // already finished with.
  const submitResend = (e: React.FormEvent) => {
    e.preventDefault();
    run(async () => {
      await resendVerification(email, locale);
      setMode("sent");
      setResent(true);
    });
  };

  const title =
    mode === "signup"
      ? t("auth.signUpTitle")
      : mode === "forgot"
        ? t("auth.forgotTitle")
        : mode === "reset"
          ? t("auth.resetTitle")
          : mode === "resend"
            ? t("auth.verifyExpiredTitle")
            : mode === "sent"
              ? t("auth.sentTitle")
              : t("auth.dialogTitle");

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
        <h2>{title}</h2>

        {reason && mode !== "sent" ? (
          <p className="dialog-reason">{reason}</p>
        ) : null}

        {/* ---------------------------------------------------- inbox step */}
        {mode === "sent" ? (
          <>
            <p className="dialog-sub">
              {t("auth.sentBody", { email: email || t("auth.yourAddress") })}
            </p>
            <p className="dialog-fine">{t("auth.sentSpam")}</p>
            {resent ? (
              <p className="auth-ok" role="status">
                {t("auth.sentAgain")}
              </p>
            ) : null}
            {error ? (
              <p className="auth-error" role="alert">
                {error}
              </p>
            ) : null}
            <button
              className="btn btn-primary btn-wide"
              onClick={doResend}
              disabled={busy || !email}
            >
              {busy ? t("auth.working") : t("auth.sentResend")}
            </button>
            <button
              className="auth-link"
              onClick={() => {
                setMode("signin");
                setError(null);
              }}
            >
              {t("auth.backToSignIn")}
            </button>
          </>
        ) : null}

        {/* ------------------------------------------ the link was no good */}
        {mode === "resend" ? (
          <form className="auth-form" onSubmit={submitResend}>
            <p className="dialog-sub">{t("auth.verifyExpiredSub")}</p>
            <label className="auth-field">
              <span>{t("auth.emailLabel")}</span>
              <input
                type="email"
                autoComplete="email"
                required
                autoFocus
                value={email}
                onChange={(e) => setEmail(e.target.value)}
              />
            </label>
            {error ? (
              <p className="auth-error" role="alert">
                {error}
              </p>
            ) : null}
            <button className="btn btn-primary btn-wide" disabled={busy}>
              {busy ? t("auth.working") : t("auth.verifyExpiredSubmit")}
            </button>
            <button
              className="auth-link"
              type="button"
              onClick={() => {
                setMode("signin");
                setError(null);
              }}
            >
              {t("auth.backToSignIn")}
            </button>
          </form>
        ) : null}

        {/* --------------------------------------------- choose a password */}
        {mode === "reset" ? (
          <form className="auth-form" onSubmit={submitReset}>
            <p className="dialog-sub">{t("auth.resetSub")}</p>
            <label className="auth-field">
              <span>{t("auth.newPassword")}</span>
              <input
                type="password"
                autoComplete="new-password"
                required
                minLength={10}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
              />
            </label>
            <p className="dialog-fine">{t("auth.passwordHint")}</p>
            {error ? (
              <p className="auth-error" role="alert">
                {error}
              </p>
            ) : null}
            <button className="btn btn-primary btn-wide" disabled={busy}>
              {busy ? t("auth.working") : t("auth.resetSubmit")}
            </button>
          </form>
        ) : null}

        {/* --------------------------------------------------- forgot step */}
        {mode === "forgot" ? (
          <form className="auth-form" onSubmit={submitForgot}>
            <p className="dialog-sub">{t("auth.forgotSub")}</p>
            <label className="auth-field">
              <span>{t("auth.emailLabel")}</span>
              <input
                type="email"
                autoComplete="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
              />
            </label>
            {error ? (
              <p className="auth-error" role="alert">
                {error}
              </p>
            ) : null}
            <button className="btn btn-primary btn-wide" disabled={busy}>
              {busy ? t("auth.working") : t("auth.forgotSubmit")}
            </button>
            <button
              className="auth-link"
              type="button"
              onClick={() => {
                setMode("signin");
                setError(null);
              }}
            >
              {t("auth.backToSignIn")}
            </button>
          </form>
        ) : null}

        {/* ------------------------------------------- sign in  /  sign up */}
        {mode === "signin" || mode === "signup" ? (
          <>
            {/* Two buttons, equal weight, current one pressed. A tab strip
                rather than a link, because both destinations are peers. */}
            <div className="auth-tabs" role="tablist">
              <button
                role="tab"
                aria-selected={mode === "signin"}
                className={mode === "signin" ? "is-on" : ""}
                onClick={() => {
                  setMode("signin");
                  setError(null);
                }}
              >
                {t("auth.tabSignIn")}
              </button>
              <button
                role="tab"
                aria-selected={mode === "signup"}
                className={mode === "signup" ? "is-on" : ""}
                onClick={() => {
                  setMode("signup");
                  setError(null);
                }}
              >
                {t("auth.tabSignUp")}
              </button>
            </div>

            {mode === "signup" && !reason ? (
              <ul className="dialog-list">
                <li>{t("auth.benefitCredits")}</li>
                <li>{t("auth.benefitPrivate")}</li>
                <li>{t("auth.benefitScore")}</li>
              </ul>
            ) : null}

            <form
              className="auth-form"
              onSubmit={mode === "signin" ? submitSignIn : submitSignUp}
            >
              {mode === "signup" ? (
                <label className="auth-field">
                  <span>{t("auth.nameLabel")}</span>
                  <input
                    type="text"
                    autoComplete="name"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                  />
                </label>
              ) : null}

              <label className="auth-field">
                <span>{t("auth.emailLabel")}</span>
                <input
                  type="email"
                  autoComplete="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                />
              </label>

              <label className="auth-field">
                <span>{t("auth.passwordLabel")}</span>
                <input
                  type="password"
                  // `current-password` vs `new-password` is what tells a
                  // password manager whether to offer the saved one or to
                  // generate a fresh one. Getting it wrong is the single most
                  // common reason a signup form fights the browser.
                  autoComplete={
                    mode === "signin" ? "current-password" : "new-password"
                  }
                  required
                  minLength={mode === "signup" ? 10 : undefined}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                />
              </label>

              {mode === "signup" ? (
                <p className="dialog-fine">{t("auth.passwordHint")}</p>
              ) : null}

              {error ? (
                <p className="auth-error" role="alert">
                  {error}
                </p>
              ) : null}

              <button className="btn btn-primary btn-wide" disabled={busy}>
                {busy
                  ? t("auth.working")
                  : mode === "signin"
                    ? t("auth.tabSignIn")
                    : t("auth.tabSignUp")}
              </button>
            </form>

            {mode === "signin" ? (
              <button
                className="auth-link"
                onClick={() => {
                  setMode("forgot");
                  setError(null);
                }}
              >
                {t("auth.forgot")}
              </button>
            ) : null}

            {googleEnabled ? (
              <>
                <div className="auth-or">
                  <span>{t("auth.or")}</span>
                </div>
                <button className="btn btn-wide" onClick={signIn}>
                  <span className="g-mark" aria-hidden>
                    G
                  </span>
                  {t("auth.signIn")}
                </button>
              </>
            ) : null}

            <p className="dialog-fine">{t("auth.noCard")}</p>
          </>
        ) : null}
      </div>
    </dialog>
  );
}
