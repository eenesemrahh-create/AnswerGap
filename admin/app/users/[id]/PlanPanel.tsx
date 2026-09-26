import { when } from "@/lib/api";
import type { Locale } from "@/lib/i18n";
import { makeT } from "@/lib/i18n";
import type { Plan, SubscriptionRow } from "@/lib/types";
import { assignPlan, revokePlan } from "../actions";

/**
 * What plan this account is on, and how to put it on another one without
 * taking a payment.
 *
 * WHY THIS EXISTS AT ALL: trials, the people who tested the product before it
 * could charge for anything, an apology, an agency arrangement invoiced
 * somewhere else entirely. All of those are real, and none of them can go
 * through Stripe.
 *
 * TWO KINDS OF ROW, AND THE DIFFERENCE IS LOAD-BEARING. A `stripe` row is a
 * mirror of a real subscription; only Stripe may end it, so no End button is
 * drawn for one. Ending it from here would leave Stripe charging the card and
 * the next renewal webhook reinstating the row - a cancellation that visibly
 * undoes itself, and a charge for a plan the panel said was over. The API
 * refuses it as well (`source = 'admin'` is in its WHERE clause); this is the
 * half that stops the operator reaching for it in the first place.
 *
 * A server component. The two buttons are Server Actions bound to ids, so
 * nothing about this panel reaches the browser as JavaScript.
 */
export function PlanPanel({
  userId,
  subscriptions,
  plans,
  locale,
}: {
  userId: number;
  subscriptions: SubscriptionRow[];
  plans: Plan[];
  locale: Locale;
}) {
  const t = makeT(locale);
  const assign = assignPlan.bind(null, userId);

  // The one that answers "what is this person on right now". `live` is the
  // database's own answer, not `status === "active"`: nothing renews an
  // assigned plan, so one whose period has passed still says `active`.
  // Falling back to the newest row means a lapsed plan still says what it was
  // rather than vanishing and leaving the operator with no history on screen.
  const current = subscriptions.find((s) => s.live) ?? subscriptions[0] ?? null;

  const planName = (id: string | null) =>
    plans.find((p) => p.id === id)?.name ?? id ?? t("common.none");

  return (
    <>
      <h2>{t("plan.heading")}</h2>

      <div className="cards">
        <div className="card">
          <span>{t("plan.current")}</span>
          <b>{current && current.live ? planName(current.plan_id) : t("common.none")}</b>
          <em>{current ? describe(current, t) : t("plan.none")}</em>
        </div>
      </div>

      <h3>{t("plan.assignHeading")}</h3>
      <p className="sub">{t("plan.assignNote")}</p>
      {plans.length === 0 ? (
        <p className="notice">{t("plan.noPricingPlans")}</p>
      ) : (
        <>
          <form className="row" action={assign}>
            <label>
              {t("plan.plan")}{" "}
              <select name="plan_id" required defaultValue="">
                <option value="" disabled>
                  —
                </option>
                {plans.map((p) => (
                  <option key={p.id} value={p.id}>
                    {p.name} · {p.credits}
                    {/* A draft is assignable on purpose - `enabled` governs
                        what the public page SELLS, and refusing it here would
                        mean publishing a plan to the whole internet in order
                        to give it to one person. It is marked so the operator
                        knows which one they picked. */}
                    {p.enabled ? "" : " · draft"}
                  </option>
                ))}
              </select>
            </label>
            <label>
              {t("plan.days")}{" "}
              <input
                name="days"
                type="number"
                min={1}
                max={366}
                defaultValue={30}
                style={{ width: "5rem" }}
              />
            </label>
            <label>
              {t("plan.creditsOverride")}{" "}
              <input
                name="credits"
                type="number"
                min={0}
                placeholder={t("plan.creditsOverrideNote")}
                style={{ width: "9rem" }}
              />
            </label>
            <input name="note" placeholder={t("userDetail.notePlaceholder")} />
            <label>
              <input type="checkbox" name="grant_credits" defaultChecked />{" "}
              {t("plan.grantCredits")}
            </label>
            <button className="act" type="submit">
              {t("plan.assign")}
            </button>
          </form>
          <p className="sub">{t("plan.grantCreditsNote")}</p>
          <p className="sub">{t("plan.supersedes")}</p>
        </>
      )}

      <h3>{t("plan.historyHeading")}</h3>
      <div className="tablewrap">
        <table>
          <thead>
            <tr>
              <th>{t("common.when")}</th>
              <th>{t("plan.plan")}</th>
              <th>{t("plan.source")}</th>
              <th>{t("plan.status")}</th>
              <th className="num">{t("common.credits")}</th>
              <th>{t("plan.periodEnd")}</th>
              <th>{t("plan.grantedBy")}</th>
              <th>{t("userDetail.note")}</th>
              <th />
            </tr>
          </thead>
          <tbody>
            {subscriptions.map((s) => (
              <tr key={s.id}>
                <td>{when(s.created_at)}</td>
                <td>{planName(s.plan_id)}</td>
                <td>{s.source === "admin" ? t("plan.assign") : t("plan.stripeManaged")}</td>
                <td>
                  {s.live ? (
                    <span className="pill active">{s.status}</span>
                  ) : (
                    <span className="pill">{s.status}</span>
                  )}
                </td>
                <td className="num">{s.credits_per_period}</td>
                <td>{when(s.current_period_end)}</td>
                <td>{s.granted_by ?? "—"}</td>
                <td>{s.note ?? "—"}</td>
                <td>
                  {/* Only an assigned, still-live row can be ended here. A
                      paid one is Stripe's; a already-ended one has nothing
                      left to do. */}
                  {s.source === "admin" && s.live ? (
                    <form action={revokePlan.bind(null, userId, s.id)}>
                      <button className="act warn" type="submit">
                        {t("plan.revoke")}
                      </button>
                    </form>
                  ) : (
                    "—"
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        {subscriptions.length === 0 && <p className="empty">{t("plan.noPlans")}</p>}
      </div>
      <p className="sub">{t("plan.creditsKept")}</p>
    </>
  );
}

/**
 * The one line under the current plan. Says where it came from and when it
 * runs out, because those are the two things an operator is looking for when
 * somebody writes in about their plan.
 *
 * A LAPSED ROW SAYS SO rather than repeating its stored status. `status` on an
 * assigned plan that has run out still reads `active` - nothing sweeps them -
 * and printing that word next to a date in the past is how a support reply
 * ends up telling somebody they have a plan they do not have.
 */
function describe(s: SubscriptionRow, t: ReturnType<typeof makeT>): string {
  const origin =
    s.source === "admin"
      ? t("plan.assigned", { actor: s.granted_by ?? "—" })
      : t("plan.paid");
  const credits = t("plan.perPeriod", { credits: s.credits_per_period });
  if (!s.live) return `${origin} · ${t("plan.lapsed")}`;
  const date = when(s.current_period_end);
  const timing = !s.current_period_end
    ? ""
    : s.cancel_at_period_end
      ? ` · ${t("plan.endsOn", { date })}`
      : ` · ${t("plan.renews", { date })}`;
  return `${origin} · ${credits}${timing}`;
}
