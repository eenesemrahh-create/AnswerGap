import { NextResponse } from "next/server";
import { SESSION_COOKIE, apiUrl, configured } from "@/lib/api";

/**
 * Redeem the one-time code and store the session where scripts cannot read it.
 *
 * This is the reason the admin panel is its own service. The cookie is set on
 * the ADMIN's domain, so it is first-party and no browser downgrades it, and it
 * is httpOnly, so the admin's token is never exposed to page JavaScript the way
 * the customer web's necessarily is.
 */
export async function GET(request: Request) {
  if (!configured()) {
    return NextResponse.json({ error: "not configured" }, { status: 503 });
  }
  const home = process.env.PUBLIC_ADMIN_URL!.replace(/\/$/, "");
  const code = new URL(request.url).searchParams.get("code");
  if (!code) return NextResponse.redirect(`${home}/signin?failed=1`);

  const response = await fetch(`${apiUrl()}/api/auth/exchange`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ code }),
    cache: "no-store",
  });
  if (!response.ok) return NextResponse.redirect(`${home}/signin?failed=1`);

  const { token } = (await response.json()) as { token: string };
  const out = NextResponse.redirect(home);
  out.cookies.set(SESSION_COOKIE, token, {
    httpOnly: true,
    // Lax, not Strict: the arrival here IS a cross-site redirect from Google
    // via the API, and Strict would withhold the cookie on exactly that
    // navigation - so the admin would land signed in and immediately look
    // signed out.
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: 60 * 60 * 24 * 14,
  });
  return out;
}
