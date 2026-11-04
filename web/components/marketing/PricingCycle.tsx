/**
 * The billing bar above the plan cards.
 *
 * MONTHLY ONLY since 2026-11-04 (operator). The monthly / annually switch is
 * gone until annual billing is built and tested: an annual invoice would
 * grant one period's credits for the whole year, and checkout refuses
 * `cycle: "annual"`. The cards still carry both prices; `data-cycle` is fixed
 * to "monthly" so CSS keeps showing the monthly one. Bring the switch back
 * from git history together with the annual grant, never on its own.
 */
export function PricingCycle({ children }: { children: React.ReactNode }) {
  return (
    <div className="mkt-cycle" data-cycle="monthly">
      <div className="mkt-billing">
        <span className="mkt-billing-currency">USD ($)</span>
      </div>
      {children}
    </div>
  );
}
