"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { ApiError, resendVerification, signOut } from "@/lib/api";
import Link from "next/link";
import { loadMe, planName, useMe } from "@/lib/me";
import { SignInDialog } from "./SignInDialog";
import { LocalePicker } from "./LocalePicker";
import { ThemeToggle } from "./ThemeToggle";
import { captureTokenFromHash } from "@/lib/auth";
import { onSignInRequest } from "@/lib/signin-request";
import type { Me, Meta, Plan } from "@/lib/types";
import { useDayFormat, useI18n } from "@/i18n";

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
  /* From the shared store (`lib/me.ts`), so this menu, the credit strip under
     the nav and the account pages all show the same balance from one request.
     `known` is the three-state guard this component has always needed: until
     `/api/me` answers, render NOTHING rather than a signed-out guess - drawing
     Sign in first and correcting it made it flash on every page load. */
  const { me, known, plans } = useMe();
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
    void loadMe(true);
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
    //
    // A token found HERE arrived after the page had already fetched as
    // anonymous - this strip only mounts once `meta` exists - so the page is
    // told, exactly as after a dialog sign-in. The landing captures the hash
    // itself before its first request; this covers every other page.
    if (captureTokenFromHash()) onSessionChange?.();

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
     database. The ONE place theme and language still sit in the strip:
     `/account` cannot load without accounts, so removing them here would
     leave no way to change either. Production always has accounts. */
  if (!meta.accounts_enabled) {
    return (
      <div className="account">
        <ThemeToggle />
        <LocalePicker />
      </div>
    );
  }

  /* Nothing until `/api/me` has answered. Drawing the signed-out strip first
     made Sign in, the theme toggle and the language picker flash on every page
     load for anyone signed in.

     AFTER the accounts-disabled branch above, and the order is load-bearing:
     that branch never calls `load()`, so `known` stays false forever there.
     Gating first hid theme and language on every deployment without accounts -
     which is every laptop with no database. Caught by the landing page
     rendering no controls at all. */
  if (!known) return null;

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
        {/* No theme or language controls here, at the operator's request:
            they live only on `/account` under Settings. A signed-out visitor
            gets the system theme and the browser's language instead - see
            `readBrowser` in `i18n/index.ts`. */}
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
      <AccountPanel me={me} plans={plans} />
      {dialogEl}
    </div>
  );
}

/**
 * The avatar and the panel it opens: who you are, what you have left and
 * until when, the account pages, and Sign out.
 *
 * Its own component since 2026-10-08 so every page draws the SAME menu: the
 * app pages through `AccountMenu`, the server-rendered marketing and legal
 * pages through `SessionTools`. Before that the marketing pages had an older
 * avatar link with a loose Sign out button beside it.
 */
export function AccountPanel({ me, plans }: { me: Me; plans: Plan[] }) {
  const { t } = useI18n();
  const formatDay = useDayFormat();
  const [open, setOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  /* The panel closes on a click anywhere else and on Escape, like every
     menu a reader has used before. */
  useEffect(() => {
    if (!open) return;
    const onDown = (e: MouseEvent) => {
      if (!menuRef.current?.contains(e.target as Node)) setOpen(false);
    };
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setOpen(false);
    };
    document.addEventListener("mousedown", onDown);
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("mousedown", onDown);
      document.removeEventListener("keydown", onKey);
    };
  }, [open]);

  /* THE AVATAR OPENS A PANEL, 2026-10-07 (modelled on AlsoAsked's).
     Who you are, what you have left and until when, the four account pages,
     and Sign out at the bottom - one place for all of it rather than an
     avatar link plus a loose Sign out button beside it. Deleting the account
     is still NOT in here: it lives on Settings, under its own heading, a long
     way from anything routine. */
  return (
    <div className="acct-menu" ref={menuRef}>
      <button
        className="account-who acct-menu-trigger"
        onClick={() => setOpen((v) => !v)}
        aria-haspopup="menu"
        aria-expanded={open}
        title={t("auth.signedInAs", { email: me.email })}
        aria-label={t("auth.account")}
      >
        <Avatar me={me} size={30} />
      </button>
      {open && (
        <div className="acct-menu-panel" role="menu">
          <div className="acct-menu-head">
            <Avatar me={me} size={40} />
            <div className="acct-menu-who">
              <b>{me.name || me.email.split("@")[0]}</b>
              <span>{me.email}</span>
            </div>
          </div>
          <Link href="/account/subscription" className="acct-menu-credits" onClick={() => setOpen(false)}>
            <span>
              <b>{me.credits}</b> {t("strip.left")}
            </span>
            <em>
              {me.subscription?.active
                ? planName(plans, me.subscription.plan_id)
                : t("account.noPlan")}
              {me.subscription?.active && me.subscription.current_period_end
                ? ` · ${formatDay(me.subscription.current_period_end)}`
                : ""}
            </em>
            {me.period && (
              <i className="acct-menu-meter">
                <i style={{ width: `${Math.max(0, 1 - me.period.fraction) * 100}%` }} />
              </i>
            )}
          </Link>
          <nav className="acct-menu-links">
            {[
              ["/account", t("account.navOverview")],
              ["/account/profile", t("account.navProfile")],
              ["/account/subscription", t("account.navSubscription")],
              ["/account/settings", t("account.navSettings")],
              ["/", t("account.navSearches")],
            ].map(([href, label]) => (
              <Link key={href} href={href} role="menuitem" onClick={() => setOpen(false)}>
                {label}
                <span aria-hidden>›</span>
              </Link>
            ))}
          </nav>
          <button className="acct-menu-signout" onClick={signOut} role="menuitem">
            {t("auth.signOut")}
          </button>
        </div>
      )}
    </div>
  );
}

/** A picture when Google gave one, initials when it did not. */
export function Avatar({ me, size }: { me: Me; size: number }) {
  const initials = (me.name || me.email)
    .split(/[\s@._-]+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0]!.toUpperCase())
    .join("");
  return me.picture_url ? (
    // eslint-disable-next-line @next/next/no-img-element
    <img
      className="acct-avatar"
      src={me.picture_url}
      alt=""
      style={{ width: size, height: size }}
    />
  ) : (
    <span
      className="acct-avatar acct-avatar-initials"
      style={{ width: size, height: size, fontSize: size * 0.38 }}
      aria-hidden
    >
      {initials}
    </span>
  );
}
