"use client";

import { useEffect, useId, useRef, useState } from "react";
import Link from "next/link";
import { useI18n } from "@/i18n";

/**
 * One nav item. `href` absent means the page does not exist yet - rendered as
 * text rather than as a link to nowhere, the rule `LegalDocument` already
 * applies to the footer: a menu entry that does nothing when clicked reads as
 * a broken site rather than as a coming-soon.
 */
export interface NavItem {
  label: string;
  href?: string;
  /** The page the reader is on. Marked `aria-current`, which is how a screen
   *  reader answers "where am I" - and the only thing a visual highlight does
   *  not say out loud. */
  current?: boolean;
}

/**
 * The marketing nav links, inline when they fit and behind a hamburger when
 * they do not.
 *
 * WHAT IT REPLACES: below 820px the links were `display: none`, and below
 * 720px they came back as a horizontally scrolling row. So between 721 and
 * 820px - a tablet held upright, a half-width laptop window - the whole menu
 * was simply unreachable, with nothing on screen to say it existed.
 *
 * ONE SET OF LINKS ON EVERY PAGE BUT THE TREE. The account page carried a nav
 * with a single "Pricing" link, which made it a dead end; the marketing pages
 * and the landing each drew their own copy. The list is now a prop, so the
 * caller supplies labels from whatever catalogue it has - the landing from
 * `i18n`, the server-rendered marketing pages from `content/marketing/chrome`
 * - while the behaviour lives here once.
 *
 * The tree screen keeps its own header: it is the product, not the site, and
 * its chrome is already fighting for the room the tree needs.
 */
export function NavMenu({ items }: { items: NavItem[] }) {
  const { t } = useI18n();
  const [open, setOpen] = useState(false);
  const panelId = useId();
  const root = useRef<HTMLDivElement>(null);

  /* Escape closes it, and so does a click anywhere else. Both are what a
     reader expects from a menu that covers the page behind it, and without
     the second one the only way out is the button that opened it - which is
     under the panel on a narrow screen. */
  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setOpen(false);
    };
    const onClick = (e: MouseEvent) => {
      if (!root.current?.contains(e.target as Node)) setOpen(false);
    };
    window.addEventListener("keydown", onKey);
    // `capture`, so a link inside the panel still navigates before this runs.
    document.addEventListener("click", onClick, true);
    return () => {
      window.removeEventListener("keydown", onKey);
      document.removeEventListener("click", onClick, true);
    };
  }, [open]);

  const render = (item: NavItem, inPanel: boolean) =>
    item.href ? (
      <Link
        key={item.label}
        href={item.href}
        className="mkt-nav-link"
        aria-current={item.current ? "page" : undefined}
        /* Closing on navigation matters for the in-page anchors: `/#built-for`
           scrolls without unmounting anything, so the panel would otherwise
           stay open over the section it just jumped to. */
        onClick={inPanel ? () => setOpen(false) : undefined}
      >
        {item.label}
      </Link>
    ) : (
      <span key={item.label} className="mkt-nav-link is-soon">
        {item.label}
      </span>
    );

  return (
    <div className="nav-menu" ref={root}>
      {/* The inline row. CSS hides it below the breakpoint rather than this
          component measuring anything: a width query in JavaScript would have
          to run before paint to avoid a flash, and CSS already does that. */}
      <div className="mkt-nav-links">{items.map((i) => render(i, false))}</div>

      <button
        type="button"
        className="nav-burger"
        aria-expanded={open}
        aria-controls={panelId}
        aria-label={t("market.nav.menu")}
        onClick={() => setOpen((v) => !v)}
      >
        {/* Three bars, drawn rather than typed. The glyph route is what made
            the image export unclickable: `⤓` is not in most system fonts, and
            neither is a reliable hamburger character. */}
        <span aria-hidden />
        <span aria-hidden />
        <span aria-hidden />
      </button>

      {open && (
        <div className="nav-panel" id={panelId}>
          {items.map((i) => render(i, true))}
        </div>
      )}
    </div>
  );
}
