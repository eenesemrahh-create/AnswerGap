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
      <h1>Not an admin</h1>
      <p className="notice">
        {email ? (
          <>
            Signed in as <b>{email}</b>, which is not in ADMIN_EMAILS.
          </>
        ) : (
          <>This account is not in ADMIN_EMAILS.</>
        )}
      </p>
      <p className="sub">
        ADMIN_EMAILS is a comma-separated list on the <b>api</b> service in
        Railway. It is matched on the address exactly, ignoring case and
        surrounding spaces. There is no role column in the database and no
        endpoint that writes one, so this list is the only way to grant access —
        add the address there and redeploy the api service.
      </p>
      <p className="sub">
        Two things worth checking first: the variable is <b>ADMIN_EMAILS</b>,
        plural, and a change only takes effect once the api service has
        restarted.
      </p>
      <form action="/api/auth/signout" method="post">
        <button className="act" type="submit">Sign out</button>
      </form>
    </div>
  );
}
