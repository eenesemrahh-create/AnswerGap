"use client";

import { forwardRef, useEffect, useImperativeHandle, useRef } from "react";

/**
 * Cloudflare Turnstile, for a SIGNED-OUT search only (2026-10-19).
 *
 * The api refuses a signed-out search without a fresh token (`captchaFailed`),
 * and the daily total for all signed-out visitors is what bounds the bill;
 * this is what stops a script from emptying that total every morning.
 *
 * `interaction-only`: most visitors never see anything; a suspicious one gets
 * a single checkbox. Loaded only where this renders - a signed-in reader never
 * downloads Cloudflare's script (Privacy Policy §3).
 *
 * A token is ONE use. After a search, the parent calls `reset()` for a new one.
 */

const SCRIPT = "https://challenges.cloudflare.com/turnstile/v0/api.js?render=explicit";

interface TurnstileApi {
  render: (el: HTMLElement, options: Record<string, unknown>) => string;
  reset: (id: string) => void;
  remove: (id: string) => void;
}

declare global {
  interface Window {
    turnstile?: TurnstileApi;
  }
}

let loading: Promise<void> | null = null;

function loadScript(): Promise<void> {
  if (typeof window === "undefined") return Promise.resolve();
  if (window.turnstile) return Promise.resolve();
  if (!loading) {
    loading = new Promise((resolve, reject) => {
      const script = document.createElement("script");
      script.src = SCRIPT;
      script.async = true;
      script.onload = () => resolve();
      script.onerror = () => {
        loading = null;
        reject(new Error("turnstile script"));
      };
      document.head.appendChild(script);
    });
  }
  return loading;
}

export interface TurnstileHandle {
  reset: () => void;
}

export const Turnstile = forwardRef<
  TurnstileHandle,
  { siteKey: string; locale: string; onToken: (token: string | null) => void }
>(function Turnstile({ siteKey, locale, onToken }, ref) {
  const box = useRef<HTMLDivElement>(null);
  const widget = useRef<string | null>(null);
  // The latest callback, without re-rendering the widget when it changes.
  const tokenRef = useRef(onToken);
  useEffect(() => {
    tokenRef.current = onToken;
  }, [onToken]);

  useImperativeHandle(ref, () => ({
    reset: () => {
      tokenRef.current(null);
      if (widget.current && window.turnstile) window.turnstile.reset(widget.current);
    },
  }));

  useEffect(() => {
    let cancelled = false;
    loadScript()
      .then(() => {
        if (cancelled || !box.current || !window.turnstile || widget.current) return;
        widget.current = window.turnstile.render(box.current, {
          sitekey: siteKey,
          action: "search",
          appearance: "interaction-only",
          language: locale,
          callback: (token: string) => tokenRef.current(token),
          "expired-callback": () => tokenRef.current(null),
          "error-callback": () => tokenRef.current(null),
        });
      })
      .catch(() => tokenRef.current(null));
    return () => {
      cancelled = true;
      if (widget.current && window.turnstile) window.turnstile.remove(widget.current);
      widget.current = null;
    };
  }, [siteKey, locale]);

  return <div ref={box} className="turnstile-box" />;
});
