"use client";

import { useEffect, useState } from "react";
import { fetchDevSpend } from "@/lib/api";
import type { DevSpend, Meta } from "@/lib/types";
import { useI18n } from "@/i18n";

/**
 * Everything the product is doing and what it has cost, in dollars.
 *
 * This is the developer role's surface and it is labelled as one. It shows the
 * underlying per-request cost rather than credits on purpose: customers will be
 * priced in credits, but the argument for the Standard queue is a ratio, and a
 * ratio cannot be checked in a currency that hides one side of it.
 *
 * EVERY FIGURE HERE IS REPORTED, NOT ESTIMATED. CLAUDE.md's rule - read the
 * cost from the response - matters most in exactly this panel, because a
 * transparency view filled with plausible guesses is worse than no view: it
 * looks like evidence.
 *
 * Rendered only when `meta.role === "developer"`. Today that is always true.
 * The point is that the check exists, so sign-in changes where the role comes
 * from and nothing else.
 */
export function DevPanel({ meta }: { meta: Meta }) {
  const { t } = useI18n();
  const [open, setOpen] = useState(false);
  const [spend, setSpend] = useState<DevSpend | null>(null);

  useEffect(() => {
    if (!open) return;
    fetchDevSpend().then(setSpend).catch(() => setSpend(null));
  }, [open]);

  if (meta.role !== "developer") return null;

  const money = (value: number) => `$${value.toFixed(4)}`;
  const saved = spend ? spend.standard.if_live - spend.standard.spend : 0;

  return (
    <div className={`devpanel${open ? " open" : ""}`}>
      <button className="devpanel-toggle" onClick={() => setOpen(!open)}>
        <i className="dot dev" />
        {t("dev.role")}
        {spend && <b className="devpanel-total">{money(spend.total)}</b>}
        <span className="devpanel-caret">{open ? "▾" : "▸"}</span>
      </button>

      {open && (
        <div className="devpanel-body">
          {!spend ? (
            <p className="muted">{t("dev.loading")}</p>
          ) : (
            <>
              <table className="devtable">
                <tbody>
                  <tr>
                    <th>{t("dev.liveQueue")}</th>
                    <td>{t("dev.crawls", { count: spend.live.crawls })}</td>
                    <td className="num">{money(spend.live.spend)}</td>
                  </tr>
                  <tr>
                    <th>{t("dev.standardQueue")}</th>
                    <td>{t("dev.tasks", { count: spend.standard.tasks })}</td>
                    <td className="num">{money(spend.standard.spend)}</td>
                  </tr>
                  {/* The saving is the whole reason the split exists, so it is
                      shown rather than asserted. */}
                  <tr className="devsaved">
                    <th>{t("dev.saved")}</th>
                    <td className="muted">
                      {t("dev.savedNote", { ifLive: money(spend.standard.if_live) })}
                    </td>
                    <td className="num">{money(saved)}</td>
                  </tr>
                  <tr className="devtotal">
                    <th>{t("dev.total")}</th>
                    <td />
                    <td className="num">{money(spend.total)}</td>
                  </tr>
                </tbody>
              </table>

              <div className="devgrid">
                <span>
                  {t("dev.perRequest", {
                    live: money(meta.pricing.live_per_request),
                    standard: money(meta.pricing.standard_per_request),
                  })}
                </span>
                <span>
                  {t("dev.rows", {
                    questions: spend.rows.questions,
                    scores: spend.rows.gap_scores,
                    snapshots: spend.rows.serp_snapshots,
                  })}
                </span>
                <span>
                  {t("dev.storage", {
                    state: spend.storage.ok ? t("dev.ok") : t("dev.broken"),
                    tables: spend.storage.tables.length,
                  })}
                </span>
                <span>
                  {t("dev.callback", {
                    state: spend.callback_configured
                      ? t("dev.on")
                      : t("dev.offSweep"),
                  })}
                </span>
                {spend.standard.pending > 0 && (
                  <span>{t("dev.pending", { count: spend.standard.pending })}</span>
                )}
                {spend.standard.failed > 0 && (
                  <span className="batch-failed">
                    {t("dev.failedTasks", { count: spend.standard.failed })}
                  </span>
                )}
                {spend.storage.error && (
                  <span className="batch-failed">{spend.storage.error}</span>
                )}
              </div>
            </>
          )}
        </div>
      )}
    </div>
  );
}
