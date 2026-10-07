import type { Metadata } from "next";
import { AccountSettings } from "@/components/account/AccountPages";

/* One person's own data behind a token in their browser: nothing for a
   crawler, so not indexed. See `app/account/page.tsx`. */
export const metadata: Metadata = {
  title: "Settings",
  robots: { index: false, follow: false },
};

export default function Route() {
  return <AccountSettings />;
}
