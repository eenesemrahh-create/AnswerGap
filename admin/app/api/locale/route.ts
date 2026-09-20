import { NextResponse } from "next/server";
import { LOCALE_COOKIE, isLocale } from "@/lib/i18n";

/**
 * Remember a language choice.
 *
 * POST, not GET, for the reason sign-out is POST: a link that changes state is
 * one a crawler, a prefetch or a chat preview can pull for you. The cookie is
 * a preference and not a credential, so it is readable by script and carries
 * no `httpOnly` - and `sameSite: lax` because the form posts from this site.
 *
 * Redirects back to wherever the form was submitted from, so switching
 * language on the Reports page leaves you on the Reports page.
 */
export async function POST(request: Request) {
  const form = await request.formData();
  const lang = String(form.get("lang") ?? "");
  const back = String(form.get("back") ?? "/");

  // Only ever a path on this site: `back` comes from a form field, and
  // honouring an absolute URL would turn this into an open redirect.
  const target = back.startsWith("/") && !back.startsWith("//") ? back : "/";
  const response = NextResponse.redirect(new URL(target, request.url), 303);

  if (isLocale(lang)) {
    response.cookies.set(LOCALE_COOKIE, lang, {
      path: "/",
      sameSite: "lax",
      maxAge: 60 * 60 * 24 * 365,
    });
  }
  return response;
}
