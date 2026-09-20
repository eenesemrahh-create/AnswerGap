import { translator } from "@/lib/locale";
import { apiUrl, sessionToken } from "@/lib/api";

export const dynamic = "force-dynamic";

/**
 * Signed in, but not an admin.
 *
 * Its own page rather than a bounce back to sign-in: signing in again is
 * exactly what cannot fix this, and looping somebody through Google forever is
 * how a configuration problem gets mistaken for a broken app.
 *
 * The address is fetched directly rather than through `lib/api`'s `get`, which
 * would redirect a 403 straight back here. `/api/me` answers for any signed-in
 * user, admin or not - and which address is actually signed in is the single
 * fact that resolves this, because ADMIN_EMAILS is matched on exactly that.
 */
export default async function NoAccess() {
  const t = await translator();
  let email: string | null = null;
  const token = await sessionToken();
  if (token) {
    try {
      const response = await fetch(`${apiUrl()}/api/me`, {
        headers: { Authorization: `Bearer ${token}` },
        cache: "no-store",
      });
      if (response.ok) email = ((await response.json()) as { email: string }).email;
    } catch {
      /* The address is helpful, not required. */
    }
  }

  return (
    <div className="signin">
      <h1>{t("noAccess.title")}</h1>
      <p className="notice">
        {email
          ? t("noAccess.signedInAs", { email })
          : t("noAccess.unknown")}
      </p>
      <p className="sub">{t("noAccessDetail.listIsTheOnlyWay")}</p>
      <p className="sub">{t("noAccessDetail.twoChecks")}</p>
      <form action="/api/auth/signout" method="post">
        <button className="act" type="submit">{t("nav.signOut")}</button>
      </form>
    </div>
  );
}
