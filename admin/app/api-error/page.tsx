export const dynamic = "force-dynamic";

/**
 * The API answered, but not with data. Say which status and where.
 *
 * This page exists because Next replaces error messages with a digest in
 * production, so an uncaught throw in a server component renders "A server
 * error occurred" and nothing else — no status, no path, no way to tell a
 * permissions problem from a broken query. The status alone separates the two
 * cases that actually happen, and the response body is written to the server
 * log where being specific costs nothing.
 */
export default async function ApiErrorPage({
  searchParams,
}: {
  searchParams: Promise<{ status?: string; path?: string }>;
}) {
  const { status = "?", path = "" } = await searchParams;

  const hint =
    status === "503"
      ? "The api service says accounts are switched off. That means one of SESSION_SECRET, GOOGLE_CLIENT_ID, GOOGLE_CLIENT_SECRET, PUBLIC_BASE_URL or DATABASE_URL is missing there."
      : status === "500"
        ? "The api service failed while handling this. Its own log has the traceback — the admin service only sees the status."
        : "Check the api service's log for the matching request.";

  return (
    <div className="signin">
      <h1>The api returned {status}</h1>
      {path && (
        <p className="notice">
          <code>{path}</code>
        </p>
      )}
      <p className="sub">{hint}</p>
      <p className="sub">
        The full response body is in this service&apos;s log, prefixed{" "}
        <code>[admin]</code>.
      </p>
    </div>
  );
}
