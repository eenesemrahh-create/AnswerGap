import { get } from "@/lib/api";
import type { StripeStatus } from "@/lib/types";
import { StripePanel } from "./panel";

export const dynamic = "force-dynamic";

export default async function StripePage() {
  const initial = await get<StripeStatus>("/api/admin/stripe");

  return (
    <>
      <h1>Payments</h1>
      <p className="sub">
        The smallest slice that proves the pipe: the secret key can read the
        account, Checkout opens a session, and the signed webhook comes back with
        the money. Plans and credit grants are not wired to any of this yet — a
        successful payment is recorded, and nothing else happens.
      </p>
      <StripePanel initial={initial} />
    </>
  );
}
