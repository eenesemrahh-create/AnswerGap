export default async function SignIn({
  searchParams,
}: {
  searchParams: Promise<{ failed?: string; expired?: string }>;
}) {
  const { failed, expired } = await searchParams;
  return (
    <div className="signin">
      <h1>AnswerGap admin</h1>
      {failed && <p className="notice">Sign-in did not finish. Try again.</p>}
      {expired && <p className="notice">That session has ended. Sign in again.</p>}
      <p className="sub">
        Only addresses listed in ADMIN_EMAILS on the api service can open this
        panel. That list lives in Railway, not in the database — nothing in the
        product can grant it.
      </p>
      <a href="/api/auth/start">
        <button className="act">Sign in with Google</button>
      </a>
    </div>
  );
}
