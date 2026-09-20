import { translator } from "@/lib/locale";
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
  const t = await translator();

  const hint =
    status === "503"
      ? t("apiError.hint503")
      : status === "500"
        ? t("apiError.hint500")
        : t("apiError.hintOther");

  return (
    <div className="signin">
      <h1>{t("apiError.title", { status })}</h1>
      {path && (
        <p className="notice">
          <code>{path}</code>
        </p>
      )}
      <p className="sub">{hint}</p>
      <p className="sub">
        {t("apiError.bodyInLog")} <code>[admin]</code>
      </p>
    </div>
  );
}
