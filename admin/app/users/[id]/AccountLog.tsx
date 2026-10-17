import Link from "next/link";
import { when } from "@/lib/api";
import { makeT, type Locale } from "@/lib/i18n";
import type { UserLogEntry } from "@/lib/types";

/**
 * Everything that happened to one account, newest first: checkouts opened
 * and refused, every Stripe event with what it did (a declined card names
 * its decline code), searches, credit movements and every admin act.
 *
 * A server component. The source filter is a plain GET link, so a filtered
 * log is a URL that can be sent to whoever asked.
 */
export function AccountLog({
  userId,
  entries,
  sources,
  source,
  months,
  locale,
}: {
  userId: number;
  entries: UserLogEntry[];
  sources: string[];
  source: string;
  months: number;
  locale: Locale;
}) {
  const t = makeT(locale);
  const link = (s: string) => {
    const p = new URLSearchParams({ months: String(months) });
    if (s) p.set("log", s);
    return `/users/${userId}?${p.toString()}#log`;
  };

  return (
    <>
      <h2 id="log">{t("log.heading")}</h2>
      <p className="sub">{t("log.lead")}</p>
      <p className="row">
        {["", ...sources].map((s) =>
          s === source ? (
            <b key={s || "all"}>{s ? t(`log.source.${s}`) : t("log.all")}</b>
          ) : (
            <Link key={s || "all"} href={link(s)}>
              {s ? t(`log.source.${s}`) : t("log.all")}
            </Link>
          )
        )}
      </p>
      <div className="tablewrap">
        <table>
          <thead>
            <tr>
              <th>{t("common.when")}</th>
              <th>{t("log.where")}</th>
              <th>{t("log.what")}</th>
              <th>{t("common.detail")}</th>
            </tr>
          </thead>
          <tbody>
            {entries.map((e, i) => (
              <tr key={`${e.created_at}-${i}`}>
                <td>{when(e.created_at)}</td>
                <td><span className="pill">{t(`log.source.${e.source}`)}</span></td>
                <td>
                  {KINDS.has(e.kind) && <b>{t(`log.kinds.${e.kind}`)} </b>}
                  <code>{e.kind}</code>
                  {e.source === "payment" && typeof e.detail.livemode === "boolean" && (
                    <>
                      {" "}
                      <span className={`pill ${e.detail.livemode ? "active" : "ci-run"}`}>
                        {e.detail.livemode ? t("common.live") : t("common.test")}
                      </span>
                    </>
                  )}
                </td>
                <td>
                  <span className={failed(e) ? "neg" : undefined}>{summary(e, t)}</span>
                  {/* Every field, for the case the summary does not cover. */}
                  <details>
                    <summary>{t("log.raw")}</summary>
                    <pre style={{ whiteSpace: "pre-wrap", margin: 0 }}>
                      {JSON.stringify(e.detail, null, 2)}
                    </pre>
                  </details>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        {entries.length === 0 && <p className="empty">{t("log.empty")}</p>}
      </div>
    </>
  );
}

const str = (v: unknown) => (v === null || v === undefined || v === "" ? "" : String(v));

/** Kinds with a sentence of their own in the catalogue (`log.kinds`). The
 *  ending of a plan and what it did to the balance is the part of this log
 *  an operator reads aloud to a customer, so it is not left as a code. */
const KINDS = new Set(["cancel_subscription", "subscription_clawback", "cancel_withdrawn"]);

/** One line in plain words, built from the fields each source carries. */
function summary(e: UserLogEntry, t: ReturnType<typeof makeT>): string {
  const d = e.detail;
  switch (e.source) {
    case "account":
      return [str(d.plan_id), str(d.cycle), str(d.error) && `error: ${str(d.error)}`]
        .filter(Boolean)
        .join(" · ");
    case "payment": {
      const amount =
        typeof d.amount_cents === "number"
          ? `${(d.amount_cents / 100).toFixed(2)} ${str(d.currency).toUpperCase()}`
          : "";
      return [amount, str(d.status), str(d.effect)].filter(Boolean).join(" · ");
    }
    case "usage":
      return [str(d.outcome), d.credits ? `${str(d.credits)} cr` : "",
              str(d.tree_slug), str(d.question_slug)]
        .filter(Boolean)
        .join(" · ");
    case "credit": {
      const delta = Number(d.delta ?? 0);
      return [`${delta > 0 ? "+" : ""}${delta}`, str(d.note), str(d.ref)]
        .filter(Boolean)
        .join(" · ");
    }
    case "admin":
      if (e.kind === "cancel_subscription") {
        return [str(d.actor), d.at_period_end ? t("log.whenPeriodEnd") : t("log.whenNow"),
                d.clawback ? t("log.clawbackYes") : t("log.clawbackNo"),
                str(d.stripe_subscription_id)]
          .filter(Boolean)
          .join(" · ");
      }
      if (e.kind === "subscription_clawback") {
        return [str(d.actor), t("log.clawed", { credits: str(d.credits), granted: str(d.granted) })]
          .filter(Boolean)
          .join(" · ");
      }
      if (e.kind === "cancel_withdrawn") {
        return [str(d.actor), t("log.withdrawn"), str(d.stripe_subscription_id)]
          .filter(Boolean)
          .join(" · ");
      }
      return [str(d.actor), str(d.plan_id), str(d.note) || str(d.reason)]
        .filter(Boolean)
        .join(" · ");
    default:
      return "";
  }
}

/** What deserves to stand out: a refusal, a decline, a handler that failed. */
function failed(e: UserLogEntry): boolean {
  const d = e.detail;
  if (e.source === "account") return e.kind.endsWith("_failed");
  if (e.source === "payment") {
    const effect = str(d.effect);
    return e.kind.includes("failed") || /^(card declined|UNATTRIBUTED|ERROR|not a)/.test(effect);
  }
  if (e.source === "usage") return str(d.outcome) !== "" && str(d.outcome) !== "allowed";
  return false;
}
