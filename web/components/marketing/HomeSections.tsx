"use client";

import { useState, type ReactNode } from "react";
import { useI18n } from "@/i18n";

/**
 * The landing's pitch sections, from the Replit design of 2026-11-01.
 *
 * The example table is ILLUSTRATIVE AND SAYS SO ON THE SCREEN: every question,
 * count and verdict in it was written by hand to teach how a result reads, and
 * CLAUDE.md's rule is that static data is never presented as if it were
 * measured. Its verdict labels are the real `status.*` strings and the real
 * `.badge` colours, because that is the one thing here that must match the
 * product.
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

function Icon({ children }: { children: ReactNode }) {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor"
         strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
      {children}
    </svg>
  );
}

const STEP_ICONS: ReactNode[] = [
  <Icon key="term"><circle cx="11" cy="11" r="7" /><path d="m20 20-3.5-3.5" /></Icon>,
  <Icon key="questions">
    <path d="m3 6 2 2 3-3M3 17l2 2 3-3M12 6h9M12 12h9M12 18h9" />
  </Icon>,
  <Icon key="content">
    <path d="M14 3H6a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V9z" />
    <path d="M14 3v6h6M8 13h8M8 17h8" />
  </Icon>,
];

const FORMAT_ICONS: ReactNode[] = [
  <Icon key="faq">
    <circle cx="12" cy="12" r="9" />
    <path d="M9.5 9a2.5 2.5 0 1 1 3.5 2.3c-.7.3-1 .9-1 1.7M12 17h.01" />
  </Icon>,
  <Icon key="guide">
    <path d="M12 7v14M12 7a4 4 0 0 0-4-3H3v15h6a3 3 0 0 1 3 2 3 3 0 0 1 3-2h6V4h-5a4 4 0 0 0-4 3z" />
  </Icon>,
  <Icon key="compare">
    <path d="M12 3v18M7 21h10M5 7h14M5 7l-3 7a3.5 3.5 0 0 0 6 0zM19 7l-3 7a3.5 3.5 0 0 0 6 0z" />
  </Icon>,
  <Icon key="steps">
    <rect x="3" y="4" width="7" height="7" rx="1" />
    <rect x="3" y="14" width="7" height="7" rx="1" />
    <path d="M14 6h7M14 10h7M14 16h7M14 20h7" />
  </Icon>,
  <Icon key="video">
    <rect x="3" y="6" width="13" height="12" rx="2" />
    <path d="m16 10 5-3v10l-5-3z" />
  </Icon>,
  <Icon key="note">
    <path d="M21 15a2 2 0 0 1-2 2H8l-5 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
    <path d="M8 8h8M8 12h5" />
  </Icon>,
];

export function Workflow() {
  const { t } = useI18n();
  const steps = ["step1", "step2", "step3"] as const;
  return (
    <section className="mkt-section" id="workflow">
      <div className="mkt-lead">
        <div>
          <span className="mkt-eyebrow">{t("market.workflow.eyebrow")}</span>
          <h2 className="mkt-lead-title">
            {t("market.workflow.titleLead")}{" "}
            <span>{t("market.workflow.titleMuted")}</span>
          </h2>
        </div>
        <p>{t("market.workflow.body")}</p>
      </div>
      <ol className="mkt-steps">
        {steps.map((step, i) => (
          <li key={step} className="mkt-step">
            <span className="mkt-step-icon">{STEP_ICONS[i]}</span>
            <span className="mkt-step-label">{t(`market.workflow.${step}.label`)}</span>
            <h3>{t(`market.workflow.${step}.title`)}</h3>
            <p>{t(`market.workflow.${step}.body`)}</p>
            <code className="mkt-step-sample">{t(`market.workflow.${step}.sample`)}</code>
          </li>
        ))}
      </ol>
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
          {cards.map((card, i) => (
            <article key={card} className="mkt-format">
              <span className="mkt-format-icon">{FORMAT_ICONS[i]}</span>
              <h3>{t(`market.formats.${card}.title`)}</h3>
              <p className="mkt-format-when">{t(`market.formats.${card}.when`)}</p>
              <p className="mkt-format-how">{t(`market.formats.${card}.how`)}</p>
            </article>
          ))}
        </div>
      </div>
    </section>
  );
}

/** One answer open at a time; opening another closes it. The closed answers
 *  stay in the HTML, `hidden`, so a crawler still reads them. */
export function Faq() {
  const { t } = useI18n();
  const [open, setOpen] = useState<number | null>(1);
  const items = [1, 2, 3, 4, 5, 6] as const;
  return (
    <div className="mkt-band">
      <section className="mkt-section mkt-faq" id="faq">
        <div className="mkt-section-head">
          <span className="mkt-eyebrow">{t("market.faq.eyebrow")}</span>
          <h2 className="mkt-faq-title">{t("market.faq.title")}</h2>
        </div>
        {items.map((n) => (
          <div key={n} className="mkt-faq-item">
            <h3>
              <button
                type="button"
                id={`faq-q${n}`}
                aria-expanded={open === n}
                aria-controls={`faq-a${n}`}
                onClick={() => setOpen(open === n ? null : n)}
              >
                {t(`market.faq.q${n}`)}
                <svg viewBox="0 0 20 20" aria-hidden>
                  <path d="m5 8 5 5 5-5" />
                </svg>
              </button>
            </h3>
            <p id={`faq-a${n}`} role="region" aria-labelledby={`faq-q${n}`} hidden={open !== n}>
              {t(`market.faq.a${n}`)}
            </p>
          </div>
        ))}
      </section>
    </div>
  );
}
