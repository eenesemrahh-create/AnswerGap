import type { Metadata } from "next";
import { AccountScreen } from "@/components/AccountScreen";

/**
 * `/account` — what you are on, what you have left, and how to change either.
 *
 * NOT INDEXED, and that is not a detail. Everything on this page is one
 * person's own data behind a token in their browser; there is nothing here
 * for a crawler to find, and a search result pointing at it would be a link
 * to a sign-in prompt wearing somebody's name.
 *
 * A thin server wrapper around a client screen. The session token lives in
 * `localStorage` - api and web are separate sites under the Public Suffix
 * List, so a cookie would never come back - which means nothing on this page
 * can be rendered on the server. One route, one locale, whatever the reader
 * picked: the customer app's locale is client-side state, unlike the legal
 * pages which each have their own URL because a review fetcher has to reach
 * them without running JavaScript.
 */
export const metadata: Metadata = {
  title: "Account",
  robots: { index: false, follow: false },
};

export default function AccountRoute() {
  return <AccountScreen />;
}
