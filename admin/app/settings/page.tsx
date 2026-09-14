import Link from "next/link";
import { get } from "@/lib/api";
import type { Settings } from "@/lib/types";
import { saveSettings } from "./actions";

export const dynamic = "force-dynamic";

export default async function SettingsPage() {
  const s = await get<Settings>("/api/admin/settings");

  return (
    <>
      <h1>Settings</h1>
      <p className="sub">
        Changed here, not in a deploy. Every change appends a row rather than
        overwriting one, so &ldquo;what was the limit last Tuesday&rdquo; stays
        answerable once somebody disputes a bill.
      </p>

      <form className="row" action={saveSettings}>
        <label>
          Free searches per day, signed out
          <br />
          <input
            name="anonymous_daily_searches"
            type="number"
            min={0}
            max={100}
            defaultValue={s.anonymous_daily_searches}
          />
        </label>
        <label>
          Credits for a new account
          <br />
          <input
            name="signup_credits"
            type="number"
            min={0}
            max={100000}
            defaultValue={s.signup_credits}
          />
        </label>
        <button className="act" type="submit">Save</button>
      </form>

      <h2>What these actually do</h2>
      <p className="sub">
        <b>Free searches per day</b> applies only to visitors who are not signed
        in. It is counted against both a browser id and a hashed IP, and either
        one reaching the limit refuses — because clearing site data resets the
        first and a new network resets the second. It is best-effort in both
        directions: a VPN defeats it, and an office behind one NAT shares a
        single counter. It stops accidents and cheap abuse, not a determined
        person. The real backstop is that a search costs $0.0026.
      </p>
      <p className="sub">
        <b>Credits for a new account</b> is granted once, by the same statement
        that creates the account. Existing accounts are unaffected. A search
        costs one credit; a cached result costs nothing, so re-running the same
        search is free.
      </p>
      <p className="sub">
        There is no checkout yet — credits are added by hand from a user&apos;s
        page.
      </p>

      <h2>Marketing landing</h2>
      <p className="sub">
        The pricing section on the marketing landing reads from a separate
        setting — plan cards with name, price and features.
      </p>
      <p>
        <Link href="/settings/pricing" className="linkish">
          Edit pricing plans &rarr;
        </Link>
      </p>
    </>
  );
}
