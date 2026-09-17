"use client";

import { useCallback, useEffect, useRef, useState, useTransition } from "react";
import type { StripeStatus } from "@/lib/types";
import { loadStripe, startTestPayment } from "./actions";

const ERRORS: Record<string, string> = {
  noKey: "STRIPE_SECRET_KEY is not set on the api service.",
  liveKeyRefused:
    "These are live keys. A payment made with them charges a real card and pays a real fee, which is a purchase rather than a test. Switch the Stripe dashboard to test mode, take the sk_test_ key, and this button works with card 4242 4242 4242 4242.",
  noReturnUrl: "WEB_BASE_URL is not set on the api service, so Checkout has nowhere to return to.",
  keyRefused: "Stripe refused the key. It may be revoked, or from a different account.",
  rateLimited: "Stripe is rate limiting us right now.",
  stripeDown: "Stripe answered with a server error.",
  invalidRequest: "Stripe rejected the request as invalid — see the api log for its own message.",
  stripeError: "Stripe answered with an error.",
  unreachable: "Stripe did not answer.",
};

const money = (cents: number | null, currency: string | null) =>
  cents === null ? "—" : `${(cents / 100).toFixed(2)} ${(currency ?? "").toUpperCase()}`;

const when = (iso: string) => new Date(iso).toLocaleString();

export function StripePanel({ initial }: { initial: StripeStatus }) {
  const [data, setData] = useState(initial);
  const [message, setMessage] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();
  const busy = useRef(false);

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

  const test = () =>
    startTransition(async () => {
      setMessage(null);
      const result = await startTestPayment();
      if (result.ok && result.url) {
        // A new tab, so this panel stays open behind Stripe's page and the
        // webhook row appears on it without a second navigation.
        window.open(result.url, "_blank", "noopener");
        setMessage("Checkout opened in a new tab. Card 4242 4242 4242 4242, any future date, any CVC.");
      } else {
        setMessage(ERRORS[result.error ?? ""] ?? `Stripe refused (${result.error}).`);
      }
    });

  const account = data.account;
  const live = data.mode === "live";

  return (
    <>
      <div className="cards">
        <div className="card">
          <b>{data.mode}</b>
          <span>Key mode</span>
          <em>{live ? "real money" : data.mode === "test" ? "play money" : "no usable key"}</em>
        </div>
        <div className="card">
          <b>{account ? "yes" : "no"}</b>
          <span>Key works</span>
          <em>{account?.id ?? (data.error ? ERRORS[data.error] ?? data.error : "not checked")}</em>
        </div>
        <div className="card">
          <b>{account?.charges_enabled ? "yes" : "no"}</b>
          <span>Charges enabled</span>
          <em>{account?.country ?? "—"} · {account?.default_currency?.toUpperCase() ?? "—"}</em>
        </div>
        <div className="card">
          <b>{data.webhook_configured ? "yes" : "no"}</b>
          <span>Webhook secret</span>
          <em>{data.webhook_configured ? "signatures are checked" : "every webhook is refused"}</em>
        </div>
      </div>

      <div className="ci-bar" style={{ marginTop: 16 }}>
        <button
          className="act"
          disabled={pending || !data.can_test_payment}
          title={data.can_test_payment ? undefined : ERRORS[live ? "liveKeyRefused" : "noKey"]}
          onClick={test}
        >
          Start a test payment ({money(data.test_amount_cents, data.test_currency)})
        </button>
        <button className="linkish" onClick={() => void refresh()} disabled={pending}>
          Refresh
        </button>
        <a
          className="ci-right"
          href={`https://dashboard.stripe.com/${live ? "" : "test/"}payments`}
          target="_blank"
          rel="noreferrer"
        >
          Open Stripe dashboard
        </a>
      </div>

      {live && <div className="notice">{ERRORS.liveKeyRefused}</div>}
      {message && <div className="ci-message">{message}</div>}

      <h2>Payments received</h2>
      <p className="sub">
        Written by the signed webhook at <code>{data.webhook_url ?? "PUBLIC_BASE_URL is unset"}</code>.
        Nothing here grants credits yet.
      </p>
      <div className="tablewrap">
        <table>
          <thead>
            <tr>
              <th>When</th><th>Event</th><th>Mode</th><th className="num">Amount</th>
              <th>Status</th><th>Email</th><th>Object</th>
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
                <td>{e.email ?? "—"}</td>
                <td><code>{e.object_id ?? "—"}</code></td>
              </tr>
            ))}
          </tbody>
        </table>
        {data.events.length === 0 && (
          <p className="empty">
            Nothing yet. A payment shows up here within seconds of Stripe sending its
            webhook — if it never does, the endpoint or its secret is the thing to check.
          </p>
        )}
      </div>

      <h2>What has to be set</h2>
      <p className="sub">
        On the Railway <b>api</b> service: <code>STRIPE_SECRET_KEY</code> and{" "}
        <code>STRIPE_WEBHOOK_SECRET</code>. The second comes from Stripe →
        Developers → Webhooks → add an endpoint pointing at{" "}
        <code>{data.webhook_url ?? "<api>/api/stripe/webhook"}</code>, subscribed to{" "}
        <code>checkout.session.completed</code>. Until it is set, every webhook is
        refused — which is deliberate: an unsigned one would let anyone invent a
        payment on this page. The publishable key is not needed anywhere; Checkout is
        hosted by Stripe, so no card detail ever reaches our servers.
      </p>
    </>
  );
}
