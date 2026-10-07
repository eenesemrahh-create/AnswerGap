import type { Metadata } from "next";
import { AccountProfile } from "@/components/account/AccountPages";

/* One person's own data behind a token in their browser: nothing for a
   crawler, so not indexed. See `app/account/page.tsx`. */
export const metadata: Metadata = {
  title: "Profile",
  robots: { index: false, follow: false },
};

export default function Route() {
  return <AccountProfile />;
}
