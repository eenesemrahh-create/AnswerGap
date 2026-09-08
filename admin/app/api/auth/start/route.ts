import { NextResponse } from "next/server";
import { apiUrl, configured, schemeProblem } from "@/lib/api";

/**
 * Begin sign-in. Hands off to the API, which owns the Google credentials.
 *
 * `mode=code` is what separates this from the customer flow: the API comes back
 * with a ONE-TIME CODE in the query string rather than a token in a fragment.
 * A server route handler cannot read a fragment, and putting a session token in
 * a query parameter would write it into Railway's access log. The code is
 * single-use, expires in 60 seconds, and is exchanged server-to-server below.
 */
export async function GET() {
  if (!configured()) {
    return NextResponse.json({ error: "not configured" }, { status: 503 });
  }
  // Caught here rather than three redirects later as someone else's 400.
  const problem = schemeProblem();
  if (problem) return NextResponse.json({ error: problem }, { status: 503 });

  const back = `${process.env.PUBLIC_ADMIN_URL!.replace(/\/$/, "")}/api/auth/land`;
  return NextResponse.redirect(
    `${apiUrl()}/api/auth/google/start?mode=code&return_to=${encodeURIComponent(back)}`
  );
}
