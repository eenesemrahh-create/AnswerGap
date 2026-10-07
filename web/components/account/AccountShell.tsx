"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { fetchMeta } from "@/lib/api";
import { marketingPath } from "@/lib/marketing";
import { loadMe, useMe } from "@/lib/me";
import type { Me, Meta } from "@/lib/types";
import { useI18n } from "@/i18n";
import { AccountMenu } from "../AccountMenu";
import { CreditStrip } from "../CreditStrip";
import { NavMenu } from "../NavMenu";

export type AccountSection = "overview" | "profile" | "subscription" | "settings";

const SECTIONS: { key: AccountSection; href: string; icon: React.ReactNode }[] = [
  {
    key: "overview",
    href: "/account",
    icon: <path d="M3 10.5 10 4l7 6.5V17a1 1 0 0 1-1 1h-3.5v-5h-5v5H4a1 1 0 0 1-1-1z" />,
  },
  {
    key: "profile",
    href: "/account/profile",
    icon: (
      <>
        <circle cx="10" cy="7" r="3.2" />
        <path d="M3.5 17.5c.8-3.2 3.4-5 6.5-5s5.7 1.8 6.5 5" />
      </>
    ),
  },
  {
    key: "subscription",
    href: "/account/subscription",
    icon: (
      <>
        <rect x="2.5" y="4.5" width="15" height="11" rx="2" />
        <path d="M2.5 8.5h15M6 12.5h3" />
      </>
    ),
  },
  {
    key: "settings",
    href: "/account/settings",
    icon: (
      <>
        <circle cx="10" cy="10" r="2.6" />
        <path d="M10 2.5v2.2M10 15.3v2.2M2.5 10h2.2M15.3 10h2.2M4.7 4.7l1.6 1.6M13.7 13.7l1.6 1.6M4.7 15.3l1.6-1.6M13.7 6.3l1.6-1.6" />
      </>
    ),
  },
];

/**
 * The frame every account page shares, 2026-10-07.
 *
 * The old `/account` was one long column - details, plan, credits, a ledger,
 * plans, settings and deletion - read top to bottom whatever the reader came
 * for. Four small pages now, each answering one question, with the credit
 * strip under the nav so what is left is never more than a glance away.
 *
 * The page body is rendered only once `/api/me` has answered, and only for a
 * signed-in reader; the loading and signed-out states live here once instead
 * of in four copies.
 */
export function AccountShell({
  active,
  title,
  lead,
  children,
}: {
  active: AccountSection;
  title: string;
  lead?: string;
  children: (me: Me) => React.ReactNode;
}) {
  const { t, locale } = useI18n();
  const [meta, setMeta] = useState<Meta | null>(null);
  const { me, known } = useMe();

  useEffect(() => {
    fetchMeta().then(setMeta).catch(() => {});
  }, []);

  const nav = (
    <nav className="mkt-nav">
      <div className="mkt-nav-inner">
        <Link href="/" className="mkt-brand">
          <span className="mkt-brand-tile" aria-hidden>
            A
          </span>
          AnswerGap
        </Link>
        <NavMenu
          items={[
            { label: t("market.nav.pricing"), href: marketingPath("pricing", locale) },
            { label: t("market.nav.solutions"), href: marketingPath("solutions", locale) },
            { label: t("market.nav.aiSeo"), href: "/#built-for" },
            { label: t("market.nav.blog") },
            { label: t("market.nav.contact"), href: marketingPath("contact", locale) },
          ]}
        />
        <div className="mkt-nav-tools">
          {meta && <AccountMenu meta={meta} onSessionChange={() => void loadMe(true)} />}
        </div>
      </div>
    </nav>
  );

  let body: React.ReactNode;
  if (!known) {
    body = <p className="acct-muted">{t("account.loading")}</p>;
  } else if (!me) {
    body = (
      <div className="acct-card acct-signedout">
        <h1>{t("account.signedOutTitle")}</h1>
        <p className="acct-muted">{t("account.signedOutLead")}</p>
        {/* A link, not a dialog: the dialog lives in the nav's account menu
            and there is no session here to open it from. The landing answers
            `?auth=signin`. */}
        <Link className="btn btn-primary" href="/?auth=signin">
          {t("account.signedOutAction")}
        </Link>
      </div>
    );
  } else {
    body = (
      <div className="acct-layout">
        <aside className="acct-side">
          <nav aria-label={t("account.title")}>
            {SECTIONS.map((s) => (
              <Link
                key={s.key}
                href={s.href}
                className={`acct-side-link${s.key === active ? " is-active" : ""}`}
                aria-current={s.key === active ? "page" : undefined}
              >
                <svg viewBox="0 0 20 20" aria-hidden>
                  {s.icon}
                </svg>
                {t(`account.nav${s.key[0].toUpperCase()}${s.key.slice(1)}`)}
              </Link>
            ))}
          </nav>
        </aside>
        <section className="acct-main">
          <header className="acct-head">
            <h1>{title}</h1>
            {lead && <p className="acct-muted">{lead}</p>}
          </header>
          {children(me)}
        </section>
      </div>
    );
  }

  return (
    <div className="mkt-page acct-page">
      {nav}
      <CreditStrip />
      <main className="acct-wrap">{body}</main>
    </div>
  );
}
