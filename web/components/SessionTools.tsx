"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { fetchMe, signOut } from "@/lib/api";
import { token } from "@/lib/auth";
import type { Me } from "@/lib/types";
import { useI18n } from "@/i18n";

/**
 * The right-hand end of the nav on pages that are SERVER components.
 *
 * `/pricing`, `/solutions`, `/contact` and the legal pages are rendered on the
 * server - that is deliberate, because a review fetcher does not run
 * JavaScript - so they cannot know whether the reader is signed in. The result
 * was a signed-in customer being shown "Sign in" and "Create account" on every
 * marketing page they opened, inviting them to make an account they already
 * have.
 *
 * This is the one client island that fixes it. The page passes what a
 * signed-out reader should see; this swaps it for the account strip when there
 * is a session.
 *
 * THREE STATES, NOT TWO. `me === null` is indistinguishable from "signed out",
 * so rendering from it alone draws the signed-out strip first and corrects it
 * when `/api/me` answers - the flicker that made this component necessary in
 * the first place. While it does not know, it renders NOTHING: a layout that
 * settles is better than one that tells the reader something untrue and takes
 * it back.
 *
 * Not `AccountMenu`, which owns the sign-in dialog and every post-sign-in
 * return path (`#token=`, `?reset=`, `?verified=1`). Those belong on the pages
 * the API actually redirects to, and mounting them here would put four
 * URL-scrubbing branches on a marketing page that never sees one.
 */
export function SessionTools({ children }: { children: React.ReactNode }) {
  const { t } = useI18n();
  const [me, setMe] = useState<Me | null>(null);
  const [known, setKnown] = useState(false);

  /* Read in an EFFECT, never during render. `token()` reads localStorage,
     which does not exist while Next prerenders these pages - so a render-time
     read would disagree with the server's HTML and hydrate wrong. */
  useEffect(() => {
    if (!token()) {
      setKnown(true);
      return;
    }
    fetchMe()
      .then(setMe)
      .catch(() => setMe(null))
      .finally(() => setKnown(true));
  }, []);

  if (!known) return null;
  if (!me) return <>{children}</>;

  return (
    <div className="account">
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
      <button className="account-signout" onClick={signOut}>
        {t("auth.signOut")}
      </button>
    </div>
  );
}

/**
 * Swap a signed-out call to action for something a signed-in reader can use.
 *
 * "Start free" pointing at the sign-up dialog is nonsense for somebody who
 * already has an account, and these pages are server components - they cannot
 * know. Same client island as above, different job.
 *
 * WHILE IT DOES NOT KNOW IT RENDERS THE SIGNED-OUT VERSION, which is the
 * opposite of `SessionTools` and deliberate. That one is a nav strip nobody
 * misses for a moment; this is the main call to action on a marketing page,
 * and it has to be in the first HTML for the crawlers those pages exist for.
 * The signed-out button is also the right default for the majority of readers,
 * so the swap is invisible to almost everyone who sees it.
 */
export function SessionSwap({
  children,
  signedIn,
}: {
  children: React.ReactNode;
  signedIn: React.ReactNode;
}) {
  const [signed, setSigned] = useState(false);

  useEffect(() => {
    if (!token()) return;
    // The TOKEN is enough here, with no call to `/api/me`. The question is
    // "should this reader be invited to create an account", and a token means
    // they already did - even one the server would now reject was issued to
    // somebody who signed up. A round trip on a marketing page to decide the
    // wording of a button would be the wrong price.
    setSigned(true);
  }, []);

  return <>{signed ? signedIn : children}</>;
}
