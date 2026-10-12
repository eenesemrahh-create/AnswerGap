"use client";

import { makeT, type Locale } from "@/lib/i18n";

import Link from "next/link";
import { useCallback, useEffect, useRef, useState, useTransition } from "react";
import type { StripeStatus } from "@/lib/types";
import { loadStripe, processEvent, startTestPayment } from "./actions";

/* Server codes to catalogue KEYS, for the same reason as the CI board: this
   map is module scope and `t` is not available there. */
const ERRORS: Record<string, string> = {
  noKey: "panel.errNoKey",
  liveNeedsConfirm: "panel.errNeedsConfirm",
  noReturnUrl: "panel.errNoReturnUrl",
  keyRefused: "panel.errKey",
  rateLimited: "panel.errRate",
  stripeDown: "panel.errServer",
  invalidRequest: "panel.errInvalid",
  stripeError: "panel.errOther",
  unreachable: "panel.errNoAnswer",
};

const money = (cents: number | null, currency: string | null) =>
  cents === null ? "—" : `${(cents / 100).toFixed(2)} ${(currency ?? "").toUpperCase()}`;

const when = (iso: string) => new Date(iso).toLocaleString();

/* The events the webhook endpoint has to be subscribed to. Shown on the page
   because a destination missing `invoice.paid` takes the money and grants
   nothing, and nothing else on screen would say so. */
const WEBHOOK_EVENTS = [
  "checkout.session.completed",
  "customer.subscription.created",
  "customer.subscription.updated",
  "customer.subscription.deleted",
  "invoice.paid",
  "invoice.payment_failed",
  // So a declined card and an abandoned checkout reach the account log.
  "payment_intent.payment_failed",
  "checkout.session.expired",
];

export function StripePanel({
  initial,
  locale,
}: {
  initial: StripeStatus;
  /** Language as a prop: a client component cannot read the cookie. */
  locale: Locale;
}) {
  const t = makeT(locale);
  const [data, setData] = useState(initial);
  const [message, setMessage] = useState<string | null>(null);
  const [asking, setAsking] = useState(false);
  const [pending, startTransition] = useTransition();
  const busy = useRef(false);
  const [processing, setProcessing] = useState<string | null>(null);

  const refresh = useCallback(async () => {
    if (busy.current) return;
    busy.current = true;
    try {
      setData(await loadStripe());
    } catch {
      /* a failed poll leaves the last good panel on screen */
    } finally {
      busy.current = false;
    }
  }, []);

  /* A webhook lands seconds after the payment, and the operator comes back to
     this tab from Stripe's page - so poll briefly rather than asking them to
     hit refresh while waiting, and stop once the tab is idle again. */
  useEffect(() => {
    const id = window.setInterval(() => {
      if (document.visibilityState === "visible") void refresh();
    }, 10_000);
    return () => window.clearInterval(id);
  }, [refresh]);

  const test = (confirmLive: boolean) =>
    startTransition(async () => {
      setMessage(null);
      setAsking(false);
      const result = await startTestPayment(confirmLive);
      if (result.ok && result.url) {
        // A new tab, so this panel stays open behind Stripe's page and the
        // webhook row appears on it without a second navigation.
        window.open(result.url, "_blank", "noopener");
        setMessage(
          result.mode === "live"
            ? "Checkout opened in a new tab. This is a REAL charge on a real card; the row appears below once Stripe's webhook lands."
            : "Checkout opened in a new tab. Card 4242 4242 4242 4242, any future date, any CVC."
        );
      } else {
        setMessage(ERRORS[result.error ?? ""]
            ? t(ERRORS[result.error ?? ""])
            : t("panel.errRefused", { code: String(result.error) }));
      }
    });

  const reprocess = (eventId: string) =>
    startTransition(async () => {
      setMessage(null);
      setProcessing(eventId);
      try {
        const out = await processEvent(eventId);
        setMessage(t("panel.processed", { effect: out.effect ?? "—" }));
        await refresh();
      } catch (err) {
        setMessage(t("panel.processFailed", { code: String(err) }));
      } finally {
        setProcessing(null);
      }
    });

  const account = data.account;
  const live = data.mode === "live";

  return (
    <>
      <div className="cards">
        <div className="card">
          <b>{data.mode}</b>
          <span>{t("panel.keyMode")}</span>
          <em>{live ? "real money" : data.mode === "test" ? "play money" : "no usable key"}</em>
        </div>
        <div className="card">
          <b>{account ? "yes" : "no"}</b>
          <span>{t("panel.keyWorks")}</span>
          <em>{account?.id ?? (data.error ? ERRORS[data.error] ?? data.error : "not checked")}</em>
        </div>
        <div className="card">
          <b>{account?.charges_enabled ? "yes" : "no"}</b>
          <span>{t("panel.chargesEnabled")}</span>
          <em>{account?.country ?? "—"} · {account?.default_currency?.toUpperCase() ?? "—"}</em>
        </div>
        <div className="card">
          <b>{data.webhook_configured ? "yes" : "no"}</b>
          <span>{t("panel.webhookSecret")}</span>
          <em>{data.webhook_configured ? "signatures are checked" : "every webhook is refused"}</em>
        </div>
      </div>

      <div className="ci-bar" style={{ marginTop: 16 }}>
        <button
          className={live ? "act warn" : "act"}
          disabled={pending || !data.can_test_payment}
          title={data.can_test_payment ? undefined : t(ERRORS.noKey)}
          onClick={() => (data.needs_confirm ? setAsking(true) : test(false))}
        >
          {live ? t("panel.startLive") : t("panel.startTest")} (
          {money(data.test_amount_cents, data.test_currency)})
        </button>
        <button className="linkish" onClick={() => void refresh()} disabled={pending}>{t("panel.refresh")}</button>
        <a
          className="ci-right"
          href={`https://dashboard.stripe.com/${live ? "" : "test/"}payments`}
          target="_blank"
          rel="noreferrer"
        >
          {t("panel.openDashboard")}
        </a>
      </div>

      {/* Two deliberate acts for real money. The first click only asks; the
          confirmation names the amount, the fee and where the money lands, so
          the reader is not agreeing to a number they have to go and look up. */}
      {asking && (
        <div className="notice">
          <b>{t("panel.realCard")}</b> These are live keys, so{" "}
          {money(data.test_amount_cents, data.test_currency)} is actually taken — Stripe
          keeps its fee (about $0.33 on $1.00) and the rest lands in your own Stripe
          account. A refund from the Stripe dashboard returns the amount but not the
          fee. Nothing is charged until you complete Stripe&apos;s page.
          <div className="ci-buttons" style={{ marginTop: 10 }}>
            <button className="act warn" disabled={pending} onClick={() => test(true)}>
              Yes, charge {money(data.test_amount_cents, data.test_currency)}
            </button>
            <button className="act" disabled={pending} onClick={() => setAsking(false)}>{t("panel.cancel")}</button>
          </div>
        </div>
      )}

      {live && !asking && (
        <p className="sub">
          Live keys. A payment started here is real money, so the button asks once more
          before anything is created. Test keys (<code>sk_test_</code>) make the same
          button free and work with card 4242 4242 4242 4242.
        </p>
      )}
      {message && <div className="ci-message">{message}</div>}

      <h2>{t("panel.received")}</h2>
      <p className="sub">
        {t("panel.writtenBy")}{" "}
        <code>{data.webhook_url ?? t("panel.noBaseUrl")}</code>.{" "}
        {t("panel.receivedLead")}
      </p>
      <div className="tablewrap">
        <table>
          <thead>
            <tr>
              <th>{t("panel.when")}</th><th>{t("panel.event")}</th><th>{t("panel.mode")}</th><th className="num">{t("panel.amount")}</th>
              <th>{t("panel.status")}</th><th>{t("panel.user")}</th><th>{t("panel.effect")}</th>
              <th>{t("panel.object")}</th><th />
            </tr>
          </thead>
          <tbody>
            {data.events.map((e) => (
              <tr key={e.event_id}>
                <td>{when(e.created_at)}</td>
                <td>{e.kind}</td>
                <td>
                  <span className={`pill ${e.livemode ? "suspended" : "active"}`}>
                    {e.livemode ? "live" : "test"}
                  </span>
                </td>
                <td className="num">{money(e.amount_cents, e.currency)}</td>
                <td>{e.status ?? "—"}</td>
                <td>
                  {e.user_id ? (
                    <Link href={`/users/${e.user_id}`}>
                      {e.user_name || e.user_email || `#${e.user_id}`}
                    </Link>
                  ) : (
                    e.email ?? "—"
                  )}
                </td>
                {/* The handler's own words. Anything but "granted …" or a
                    status on a lifecycle event is the thing to look at. */}
                <td>
                  {e.effect ? (
                    <span className={/^(granted|already granted|status|past_due)/.test(e.effect)
                      ? undefined : "neg"}>
                      {e.effect}
                    </span>
                  ) : "—"}
                </td>
                <td><code>{e.object_id ?? "—"}</code></td>
                <td>
                  {e.processable && !e.redacted && (
                    <button
                      className="linkish"
                      disabled={pending}
                      onClick={() => reprocess(e.event_id)}
                    >
                      {processing === e.event_id ? t("panel.processing") : t("panel.process")}
                    </button>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        {data.events.length === 0 && (
          <p className="empty">{t("panel.emptyEvents")}</p>
        )}
      </div>

      <h2>{t("panel.whatToSet")}</h2>
      <p className="sub">
        {t("panel.onRailway")} <code>STRIPE_SECRET_KEY</code>{" "}
        {t("panel.and")}{" "}
        <code>STRIPE_WEBHOOK_SECRET</code>. The second comes from Stripe →
        Developers → Webhooks → add an endpoint pointing at{" "}
        <code>{data.webhook_url ?? "<api>/api/stripe/webhook"}</code>.{" "}
        {t("panel.eventsToSend")}{" "}
        {WEBHOOK_EVENTS.map((name, i) => (
          <span key={name}>{i > 0 && ", "}<code>{name}</code></span>
        ))}
        . Until it is set, every webhook is
        refused — which is deliberate: an unsigned one would let anyone invent a
        payment on this page. The publishable key is not needed anywhere; Checkout is
        hosted by Stripe, so no card detail ever reaches our servers.
      </p>
    </>
  );
}
