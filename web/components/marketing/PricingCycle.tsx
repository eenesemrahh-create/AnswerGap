"use client";

import { useState } from "react";

/**
 * The monthly / annually switch.
 *
 * THE ONLY CLIENT CODE ON THE PRICING PAGE, and it deliberately owns nothing
 * but one word of state. The plan cards are passed through as `children` and
 * stay server components: a server component handed to a client one as
 * `children` crosses the boundary as already-rendered output, which is the
 * same trick the root layout's `I18nProvider` relies on.
 *
 * So BOTH prices are in the HTML and CSS shows one of them, keyed off
 * `data-cycle` here. That is not a micro-optimisation — a crawler that does
 * not run JavaScript still sees the annual price, and this is a page whose
 * whole job is to be read by crawlers.
 */
export function PricingCycle({
  monthly,
  annually,
  save,
  children,
}: {
  monthly: string;
  annually: string;
  save: string;
  children: React.ReactNode;
}) {
  const [cycle, setCycle] = useState<"monthly" | "annual">("monthly");
  const annual = cycle === "annual";

  return (
    <div className="mkt-cycle" data-cycle={cycle}>
      <div className="mkt-billing">
        {/* One button with `aria-pressed`, not two: it is one setting with two
            values, and a screen reader should hear its state rather than have
            to infer it from which of two labels looks selected. */}
        <button
          type="button"
          className="mkt-billing-switch"
          role="switch"
          aria-checked={annual}
          onClick={() => setCycle(annual ? "monthly" : "annual")}
        >
          <span className={annual ? "" : "is-on"}>{monthly}</span>
          <span className="mkt-billing-track" aria-hidden>
            <span className="mkt-billing-thumb" />
          </span>
          <span className={annual ? "is-on" : ""}>{annually}</span>
        </button>
        <span className="mkt-billing-save">{save}</span>
      </div>
      {children}
    </div>
  );
}
