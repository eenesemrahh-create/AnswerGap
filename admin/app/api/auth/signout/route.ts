import { NextResponse } from "next/server";
import { SESSION_COOKIE } from "@/lib/api";

/**
 * Drop the cookie. POST, not GET: a GET sign-out can be triggered by any
 * image tag on any page the admin happens to visit.
 *
 * This clears the session here only. The API token stays technically valid
 * until it expires - killing it everywhere is the "revoke tokens" button on the
 * user page, which bumps the row's token epoch.
 */
export async function POST() {
  const home = process.env.PUBLIC_ADMIN_URL?.replace(/\/$/, "") ?? "/";
  const out = NextResponse.redirect(`${home}/signin`, { status: 303 });
  out.cookies.delete(SESSION_COOKIE);
  return out;
}
