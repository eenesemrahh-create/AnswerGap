"use client";

import { useEffect, useState } from "react";
import { API_BASE } from "@/lib/api";

/* TEMPORARY - the Stripe integration probe.
 *
 * A page for somebody WITHOUT admin access to run a real payment of their own
 * choosing, so more than one person can confirm the integration works. Delete
 * this folder, `PAY_PROBE_TOKEN` and the two /api/pay/* endpoints once Stripe
 * is wired to plans.
 *
 * REACHED BY A SECRET LINK: /pay?k=<token>. Not because the page is precious,
 * but because an open endpoint that mints Checkout sessions for any amount is
 * what card-testing abuse looks for, and Stripe freezes the account it lands
 * on. Without the key the page shows nothing to try.
 *
 * Copy is Turkish and NOT in the i18n catalogue on purpose: putting a
 * throwaway page through the five-locale build gate would cost four
 * translations per wording change and buy nothing. Every permanent screen
 * stays in `web/i18n`. */

type Config = { min_cents: number; max_cents: number; currency: string; mode: string };

/* The two ways a key can be wrong used to share one sentence, and they have
 * opposite fixes: "your link has no key" is the visitor's problem, "the server
 * refused this key" is the operator's - the value in PAY_PROBE_TOKEN does not
 * match the link, or the api has not restarted since it was set. One message
 * for both sent the reader looking in the wrong place. */
const NO_KEY_IN_LINK =
  "Bu bağlantıda anahtar yok. Linkin sonunda ?k=... kısmı da olmalı.";

const ERRORS: Record<string, string> = {
  badToken:
    "Sunucu bu anahtarı kabul etmedi. Linkteki ?k=... değeri, api servisindeki PAY_PROBE_TOKEN ile birebir aynı olmalı; değişken yeni eklendiyse servisin yeniden başlaması gerekir.",
  amountOutOfRange: "Tutar izin verilen aralığın dışında.",
  tooManyRequests: "Çok fazla deneme oldu. Bir saat sonra tekrar dene.",
  noKey: "Ödeme sistemi henüz yapılandırılmadı.",
  notFound: "Bu sayfa şu anda kapalı.",
};

const money = (cents: number, currency: string) =>
  `${(cents / 100).toFixed(2)} ${currency.toUpperCase()}`;

export default function PayProbePage() {
  const [token, setToken] = useState<string | null>(null);
  /* The URL is only readable in the browser, so the server-rendered pass has
     no key by definition. Without this flag that pass renders "no key in this
     link" for a moment on a perfectly good link - and a reader who arrives,
     reads it and leaves never sees the form appear. */
  const [ready, setReady] = useState(false);
  const [config, setConfig] = useState<Config | null>(null);
  const [closed, setClosed] = useState(false);
  const [amount, setAmount] = useState("1.00");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [outcome, setOutcome] = useState<"paid" | "cancelled" | null>(null);

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    setToken(params.get("k"));
    setReady(true);
    if (params.get("paid")) setOutcome("paid");
    if (params.get("cancelled")) setOutcome("cancelled");
    fetch(`${API_BASE}/api/pay/config`)
      .then((r) => (r.ok ? r.json() : Promise.reject(r.status)))
      .then(setConfig)
      .catch(() => setClosed(true));
  }, []);

  const pay = async () => {
    setError(null);
    const cents = Math.round(Number(amount.replace(",", ".")) * 100);
    if (!Number.isFinite(cents) || !config) {
      setError("Geçerli bir tutar yaz.");
      return;
    }
    if (cents < config.min_cents || cents > config.max_cents) {
      setError(
        `Tutar ${money(config.min_cents, config.currency)} ile ${money(
          config.max_cents,
          config.currency
        )} arasında olmalı.`
      );
      return;
    }
    setBusy(true);
    try {
      const response = await fetch(`${API_BASE}/api/pay/session`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ token: token ?? "", amount_cents: cents }),
      });
      const body = await response.json().catch(() => ({}));
      if (!response.ok) {
        const code = body?.detail?.code ?? "";
        setError(ERRORS[code] ?? `Ödeme başlatılamadı (${response.status}).`);
        return;
      }
      // Stripe's own page takes the card; nothing typed here touches a card.
      window.location.href = body.url;
    } catch {
      setError("Sunucuya ulaşılamadı.");
    } finally {
      setBusy(false);
    }
  };

  if (closed) {
    return (
      <main className="landing">
        <p className="status-text">{ERRORS.notFound}</p>
      </main>
    );
  }

  const live = config?.mode === "live";

  return (
    <main className="landing" style={{ maxWidth: 560 }}>
      <h1 style={{ fontSize: 28 }}>Ödeme testi</h1>

      {outcome === "paid" && (
        <div className="notice" style={{ marginBottom: 16 }}>
          Ödeme tamamlandı. Teşekkürler — kayıt birkaç saniye içinde yönetim panelinde
          görünür.
        </div>
      )}
      {outcome === "cancelled" && (
        <div className="notice" style={{ marginBottom: 16 }}>
          Ödeme yarıda kesildi. Hiçbir tutar çekilmedi.
        </div>
      )}

      {!ready ? (
        <p className="status-text">Yükleniyor…</p>
      ) : !token ? (
        <p className="status-text">{NO_KEY_IN_LINK}</p>
      ) : (
        <>
          <p className="tagline" style={{ marginBottom: 20 }}>
            {live
              ? "Bu gerçek bir ödemedir: yazdığın tutar kartından çekilir. Ödeme sayfası Stripe'a aittir, kart bilgin bu siteye hiç girilmez."
              : "Test modundasın. Kart olarak 4242 4242 4242 4242, ileri bir tarih ve herhangi bir CVC kullan. Gerçek para hareket etmez."}
          </p>

          <div style={{ display: "flex", gap: 10, alignItems: "center", flexWrap: "wrap" }}>
            <input
              className="search"
              inputMode="decimal"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              aria-label="Tutar"
              disabled={busy}
            />
            <span className="tagline">{config?.currency.toUpperCase() ?? "USD"}</span>
            <button className="btn" onClick={pay} disabled={busy || !config}>
              {busy ? "Hazırlanıyor…" : "Ödemeye geç"}
            </button>
          </div>

          {config && (
            <p className="tagline" style={{ marginTop: 10, fontSize: 13 }}>
              {money(config.min_cents, config.currency)} –{" "}
              {money(config.max_cents, config.currency)} arası bir tutar yazabilirsin.
            </p>
          )}

          {error && (
            <div className="error" style={{ marginTop: 16 }}>
              {error}
            </div>
          )}
        </>
      )}
    </main>
  );
}
