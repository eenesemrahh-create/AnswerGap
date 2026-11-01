"use client";

import { useState } from "react";
import { useI18n } from "@/i18n";

/**
 * The landing's pitch sections, from the Replit design of 2026-11-01.
 *
 * ILLUSTRATIVE, AND IT SAYS SO ON THE SCREEN. Every question, count and verdict
 * here was written by hand to teach how a result reads; CLAUDE.md's rule is
 * that static data is never presented as if it were measured, so each block
 * carries its own note rather than one footnote nobody connects to it.
 *
 * The verdict labels are the real `status.*` strings and the real `.badge`
 * colours: this is the one thing on the page that must match the product.
 */

type Verdict = "gap" | "weak" | "covered";

/** Pages checked per example row, about what one results page returns. */
const CHECKED = 8;

/** Pages targeting the question, per row. Same shape in every tab: one of each
 *  verdict, which is the lesson the table exists to teach. */
const ROWS: { verdict: Verdict; matching: number }[] = [
  { verdict: "gap", matching: 0 },
  { verdict: "weak", matching: 2 },
  { verdict: "covered", matching: 7 },
];

const TABS = ["tab1", "tab2", "tab3"] as const;

export function Workflow() {
  const { t } = useI18n();
  const steps = ["step1", "step2", "step3"] as const;
  return (
    <section className="mkt-section" id="workflow">
      <div className="mkt-lead">
        <div>
          <span className="mkt-eyebrow">{t("market.workflow.eyebrow")}</span>
          <h2 className="mkt-lead-title">{t("market.workflow.title")}</h2>
        </div>
        <p>{t("market.workflow.body")}</p>
      </div>
      <ol className="mkt-steps">
        {steps.map((step) => (
          <li key={step} className="mkt-step">
            <span className="mkt-step-label">{t(`market.workflow.${step}.label`)}</span>
            <h3>{t(`market.workflow.${step}.title`)}</h3>
            <p>{t(`market.workflow.${step}.body`)}</p>
            <code className="mkt-step-sample">{t(`market.workflow.${step}.sample`)}</code>
          </li>
        ))}
      </ol>
      <p className="mkt-illustrative">{t("market.workflow.note")}</p>
    </section>
  );
}

export function Examples() {
  const { t } = useI18n();
  const [tab, setTab] = useState<(typeof TABS)[number]>("tab1");
  return (
    <div className="mkt-band">
      <section className="mkt-section" id="examples">
        <span className="mkt-eyebrow">{t("market.examples.eyebrow")}</span>
        <h2 className="mkt-lead-title">{t("market.examples.title")}</h2>
        <p className="mkt-examples-sub">{t("market.examples.sub")}</p>
        <div className="mkt-tabs">
          {TABS.map((id) => (
            <button
              key={id}
              type="button"
              className="mkt-tab"
              aria-pressed={tab === id}
              onClick={() => setTab(id)}
            >
              {t(`market.examples.${id}.term`)}
            </button>
          ))}
        </div>
        <table className="mkt-table">
          <thead>
            <tr>
              <th scope="col">{t("market.examples.columnQuestion")}</th>
              <th scope="col">{t("market.examples.columnPages")}</th>
              <th scope="col">{t("market.examples.columnVerdict")}</th>
              <th scope="col">{t("market.examples.columnIdea")}</th>
            </tr>
          </thead>
          <tbody>
            {ROWS.map(({ verdict, matching }, i) => {
              const n = i + 1;
              return (
                <tr key={verdict}>
                  <th scope="row">{t(`market.examples.${tab}.q${n}`)}</th>
                  <td data-label={t("market.examples.columnPages")}>
                    <span className={`mkt-dots ${verdict}`} aria-hidden>
                      {Array.from({ length: CHECKED }, (_, dot) => (
                        <i key={dot} className={dot < matching ? "on" : undefined} />
                      ))}
                    </span>
                    <span className="mkt-dots-count">
                      {t("status.evidence", { matching, checked: CHECKED })}
                    </span>
                  </td>
                  <td data-label={t("market.examples.columnVerdict")}>
                    <span className={`badge ${verdict}`}>{t(`status.${verdict}`)}</span>
                  </td>
                  <td data-label={t("market.examples.columnIdea")}>
                    {verdict === "covered"
                      ? t("market.examples.skipIdea")
                      : t(`market.examples.${tab}.idea${n}`)}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </section>
    </div>
  );
}

export function Formats() {
  const { t } = useI18n();
  const cards = ["card1", "card2", "card3", "card4", "card5", "card6"] as const;
  return (
    <section className="mkt-section" id="formats">
      <div className="mkt-formats">
        <div>
          <span className="mkt-eyebrow">{t("market.formats.eyebrow")}</span>
          <h2 className="mkt-lead-title">{t("market.formats.title")}</h2>
          <p>{t("market.formats.body")}</p>
        </div>
        <div className="mkt-format-grid">
          {cards.map((card) => (
            <article key={card} className="mkt-format">
              <h3>{t(`market.formats.${card}.title`)}</h3>
              <p className="mkt-format-when">{t(`market.formats.${card}.when`)}</p>
              <p>{t(`market.formats.${card}.how`)}</p>
            </article>
          ))}
        </div>
      </div>
    </section>
  );
}

export function Faq() {
  const { t } = useI18n();
  const items = [1, 2, 3, 4, 5, 6, 7] as const;
  return (
    <div className="mkt-band">
      <section className="mkt-section mkt-faq" id="faq">
        <div className="mkt-section-head">
          <span className="mkt-eyebrow">{t("market.faq.eyebrow")}</span>
          <h2 className="mkt-section-title">{t("market.faq.title")}</h2>
        </div>
        {items.map((n) => (
          <details key={n}>
            <summary>{t(`market.faq.q${n}`)}</summary>
            <p>{t(`market.faq.a${n}`)}</p>
          </details>
        ))}
      </section>
    </div>
  );
}
