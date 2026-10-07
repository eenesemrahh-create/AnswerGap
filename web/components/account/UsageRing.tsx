/**
 * What is LEFT of this period's allowance, as a ring.
 *
 * The denominator is the period's grant, never the balance: credits roll over
 * and can be topped up, so a balance-based ring would routinely pass 100%.
 * Remaining rather than used, because "how much have I got" is the question
 * somebody opens this page with.
 */
export function UsageRing({
  remaining,
  label,
  sub,
}: {
  /** 0..1 */
  remaining: number;
  label: string;
  sub: string;
}) {
  const r = 52;
  const c = 2 * Math.PI * r;
  const clamped = Math.max(0, Math.min(1, remaining));
  return (
    <div className="acct-ring">
      <svg viewBox="0 0 128 128" aria-hidden>
        <defs>
          <linearGradient id="acct-ring-grad" x1="0" y1="0" x2="1" y2="1">
            <stop offset="0%" stopColor="#6d4aff" />
            <stop offset="55%" stopColor="#9333ea" />
            <stop offset="100%" stopColor="#d946ef" />
          </linearGradient>
        </defs>
        <circle className="acct-ring-track" cx="64" cy="64" r={r} />
        <circle
          className="acct-ring-fill"
          cx="64"
          cy="64"
          r={r}
          stroke="url(#acct-ring-grad)"
          strokeDasharray={c}
          strokeDashoffset={c * (1 - clamped)}
        />
      </svg>
      <div className="acct-ring-label">
        <b>{label}</b>
        <span>{sub}</span>
      </div>
    </div>
  );
}
