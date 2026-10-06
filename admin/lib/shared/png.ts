import { exportFilename } from "./filename.ts";

/**
 * The question tree as a PNG.
 *
 * Pure of `@/` imports so `node --test` can load the parts that do not need a
 * browser, the convention `lib/domains.ts` set.
 *
 * WHY THIS IS NOT THREE LINES. An `<svg>` on the page is styled by
 * `globals.css`: `.node-box` gets its fill, `.edge-line` its stroke, `.node-text`
 * its font. Serialise that element and hand it to an `Image` and NONE of that
 * applies - a stylesheet outside the document does not travel with it. The
 * honest description of a naive export is "black text on a transparent
 * background with no boxes and no lines", which looks like a broken feature
 * rather than a missing stylesheet.
 *
 * So every element's COMPUTED style is read while it is still on the page and
 * written onto the clone as a presentation attribute. That is the whole job;
 * the rasterising underneath it really is three lines.
 *
 * FOUR MORE THINGS THAT GO WRONG QUIETLY:
 *
 * - A TRANSPARENT BACKGROUND. PNG supports it, and the result is dark text on
 *   nothing - invisible in any viewer with a dark chrome, which is most of
 *   them. The background is painted explicitly.
 * - THE VIEWPORT, NOT THE TREE. The on-screen SVG is panned and zoomed. An
 *   export of what happens to be visible is an export of a scroll position;
 *   the caller passes the tree's full extent instead.
 * - ONE DEVICE PIXEL PER CSS PIXEL. Readable on screen, soft in a report.
 *   Rendered at `scale` (2 by default).
 * - A DATA URL, NOT A BLOB URL. Drawing an SVG loaded from a blob: URL taints
 *   the canvas in some browsers, and a tainted canvas makes `toBlob` throw -
 *   a failure that appears only for some readers, which is the worst kind.
 */

/**
 * SVG properties that carry the look. Copied rather than "copy everything",
 * because a full computed style is ~340 declarations per element and inlining
 * all of them on a 51-node tree produces a multi-megabyte string that is
 * slower to serialise than the image is to draw.
 */
const PAINTED = [
  "fill",
  "fill-opacity",
  "stroke",
  "stroke-width",
  "stroke-dasharray",
  "stroke-linecap",
  "stroke-linejoin",
  "opacity",
  "font-family",
  "font-size",
  "font-weight",
  "font-style",
  "letter-spacing",
  "text-anchor",
  "dominant-baseline",
  "rx",
  "ry",
] as const;

/**
 * Copy the computed look of `live` onto `clone`, element for element.
 *
 * The two trees are walked in parallel rather than matched by selector: a
 * clone has no identity of its own, and `querySelectorAll` on both returns the
 * same elements in the same order because one is a deep copy of the other.
 */
export function inlineStyles(live: SVGSVGElement, clone: SVGSVGElement): void {
  const from = [live, ...Array.from(live.querySelectorAll("*"))];
  const to = [clone, ...Array.from(clone.querySelectorAll("*"))];
  for (let i = 0; i < from.length && i < to.length; i++) {
    const computed = window.getComputedStyle(from[i] as Element);
    const target = to[i] as SVGElement;
    let style = "";
    for (const property of PAINTED) {
      const value = computed.getPropertyValue(property);
      // `none` on `fill` is meaningful and must be kept; an EMPTY value is the
      // property not applying, and writing it would override the element's own
      // attribute with nothing.
      if (value) style += `${property}:${value};`;
    }
    target.setAttribute("style", style);
  }
}

export interface PngOptions {
  /** The whole tree, in SVG user units. Not the visible viewport. */
  width: number;
  height: number;
  /** Painted first. A transparent PNG of dark text is invisible in a dark viewer. */
  background: string;
  /** Device pixels per SVG unit. 2 keeps it readable when dropped into a doc. */
  scale?: number;
  /** Replaces the pan/zoom transform on the root group, so the export shows
   *  the tree rather than wherever the reader had scrolled to. */
  rootTransform?: string;
  /** A header and a legend around the tree. Without one, the image is the
   *  tree alone. */
  frame?: PngFrame;
}

/**
 * What turns a picture of boxes into something that can go in a client deck.
 *
 * An unframed export was a tree of coloured boxes with no key: the colours
 * ARE the product - unanswered, barely answered, well answered, not checked -
 * and an image that does not say which is which throws that away the moment
 * it leaves the app. It also did not say what was searched, or when.
 *
 * Every string arrives already translated, and every colour already resolved,
 * because this file has no stylesheet and no catalogue to read them from.
 */
export interface PngFrame {
  title: string;
  /** "15 questions · English · Updated 6 October 2026". */
  subtitle: string;
  legend: { label: string; fill: string; stroke: string; dashed: boolean }[];
  /** Small print under the legend, joined with " · ". */
  notes: string[];
  brand: string;
  colors: { ink: string; soft: string; faint: string; brand: string; rule: string };
  font: string;
}

export const FRAME_HEADER = 80;
export const FRAME_FOOTER = 64;
/* Below this the header and legend would collide on a tiny tree. */
export const FRAME_MIN_WIDTH = 760;
const FRAME_X = 40;

/** The size of the finished image: the tree, plus the frame if there is one. */
export function framedSize(options: PngOptions): { width: number; height: number } {
  if (!options.frame) return { width: options.width, height: options.height };
  return {
    width: Math.max(options.width, FRAME_MIN_WIDTH),
    height: options.height + FRAME_HEADER + FRAME_FOOTER,
  };
}

const SVG_NS = "http://www.w3.org/2000/svg";

/* textContent, never markup: a seed is whatever somebody typed, and the
   serialiser escapes it. */
function addText(
  parent: Element,
  text: string,
  x: number,
  y: number,
  style: string,
  anchor: "start" | "end" = "start"
): void {
  const el = parent.ownerDocument.createElementNS(SVG_NS, "text");
  el.setAttribute("x", String(x));
  el.setAttribute("y", String(y));
  el.setAttribute("text-anchor", anchor);
  el.setAttribute("style", style);
  el.textContent = text;
  parent.appendChild(el);
}

function drawFrame(clone: SVGSVGElement, frame: PngFrame, width: number, treeHeight: number): void {
  const doc = clone.ownerDocument;
  const g = doc.createElementNS(SVG_NS, "g");
  const c = frame.colors;
  const font = `font-family:${frame.font};`;

  addText(g, frame.title, FRAME_X, 40, `${font}font-size:20px;font-weight:700;fill:${c.ink};`);
  addText(g, frame.subtitle, FRAME_X, 62, `${font}font-size:12.5px;fill:${c.soft};`);
  addText(g, frame.brand, width - FRAME_X, 40, `${font}font-size:15px;font-weight:700;fill:${c.brand};`, "end");

  const rule = (y: number) => {
    const line = doc.createElementNS(SVG_NS, "line");
    line.setAttribute("x1", String(FRAME_X));
    line.setAttribute("x2", String(width - FRAME_X));
    line.setAttribute("y1", String(y));
    line.setAttribute("y2", String(y));
    line.setAttribute("style", `stroke:${c.rule};stroke-width:1;`);
    g.appendChild(line);
  };
  rule(FRAME_HEADER - 0.5);

  const top = FRAME_HEADER + treeHeight;
  rule(top + 0.5);
  let x = FRAME_X;
  for (const item of frame.legend) {
    const box = doc.createElementNS(SVG_NS, "rect");
    box.setAttribute("x", String(x));
    box.setAttribute("y", String(top + 17));
    box.setAttribute("width", "18");
    box.setAttribute("height", "12");
    box.setAttribute("rx", "3");
    box.setAttribute(
      "style",
      `fill:${item.fill};stroke:${item.stroke};stroke-width:1.5;` +
        (item.dashed ? "stroke-dasharray:3 2;" : "")
    );
    g.appendChild(box);
    addText(g, item.label, x + 26, top + 27, `${font}font-size:12px;fill:${c.ink};`);
    // No measuring API outside the page; ~6.6px a character at 12px is close
    // enough to space a key, and errs wide.
    x += 26 + item.label.length * 6.6 + 22;
  }
  if (frame.notes.length) {
    addText(g, frame.notes.join(" · "), FRAME_X, top + 50, `${font}font-size:11px;fill:${c.faint};`);
  }
  clone.appendChild(g);
}

/* `rgba(0, 0, 0, 0)` and `transparent` both mean "nothing painted here". */
export function isTransparent(color: string): boolean {
  const c = color.replace(/\s+/g, "").toLowerCase();
  return c === "" || c === "transparent" || /^rgba\(\d+,\d+,\d+,0(\.0*)?\)$/.test(c);
}

/**
 * The colour the reader actually sees behind `el`.
 *
 * The tree canvas paints only a dot pattern - its `background-color` is
 * transparent - so reading it alone painted the PNG transparent. In light mode
 * a viewer's white hid that; in dark mode it put light text on white.
 * Walk up to the first ancestor that paints something.
 */
export function opaqueBackground(el: Element, fallback = "#ffffff"): string {
  for (let node: Element | null = el; node; node = node.parentElement) {
    const color = window.getComputedStyle(node).backgroundColor;
    if (!isTransparent(color)) return color;
  }
  return fallback;
}

export const FRAME_STATUSES =["gap", "weak", "covered", "no_data"] as const;
export type FrameStatus = (typeof FRAME_STATUSES)[number];

/** Legend entries in a fixed order, each "Label N", every status listed even
 *  at zero - a key that drops a colour reads as "that colour cannot occur". */
export function frameLegendLabels(
  labels: Record<FrameStatus, string>,
  counts: Partial<Record<FrameStatus, number>>
): string[] {
  return FRAME_STATUSES.map((s) => `${labels[s]} ${counts[s] ?? 0}`);
}

/**
 * Build a frame from the live page. The colours come from the same CSS custom
 * properties the node boxes are painted with (both apps define them under the
 * same names), so the key matches the boxes in light and dark alike.
 */
export function cssFrame(
  el: Element,
  text: {
    title: string;
    subtitle: string;
    labels: Record<FrameStatus, string>;
    counts: Partial<Record<FrameStatus, number>>;
    notes: string[];
    brand: string;
  }
): PngFrame {
  const css = window.getComputedStyle(el);
  const v = (name: string, fallback: string) =>
    css.getPropertyValue(name).trim() || fallback;
  const labels = frameLegendLabels(text.labels, text.counts);
  const swatch: Record<FrameStatus, [string, string]> = {
    gap: ["--gap-bg", "--gap-border"],
    weak: ["--weak-bg", "--weak-border"],
    covered: ["--covered-bg", "--covered-border"],
    no_data: ["--nodata-bg", "--nodata-border"],
  };
  return {
    title: text.title,
    subtitle: text.subtitle,
    legend: FRAME_STATUSES.map((s, i) => ({
      label: labels[i],
      fill: v(swatch[s][0], "transparent"),
      stroke: v(swatch[s][1], "#999"),
      dashed: s === "no_data",
    })),
    notes: text.notes,
    brand: text.brand,
    colors: {
      ink: v("--text", "#1c1917"),
      soft: v("--text-soft", "#57534e"),
      faint: v("--text-faint", "#8a827a"),
      brand: v("--brand", "#7c3aed"),
      rule: v("--border", "#e7e2db"),
    },
    font: css.fontFamily || "sans-serif",
  };
}

/** Serialise a styled copy of `svg` covering the given extent. */
export function svgMarkup(svg: SVGSVGElement, options: PngOptions): string {
  const clone = svg.cloneNode(true) as SVGSVGElement;
  inlineStyles(svg, clone);
  const { width, height } = framedSize(options);

  clone.setAttribute("xmlns", SVG_NS);
  clone.setAttribute("width", String(width));
  clone.setAttribute("height", String(height));
  clone.setAttribute("viewBox", `0 0 ${width} ${height}`);

  const root = clone.querySelector("g");
  if (root) {
    const shift = options.frame ? `translate(0,${FRAME_HEADER}) ` : "";
    const own = options.rootTransform ?? root.getAttribute("transform") ?? "";
    if (shift || options.rootTransform !== undefined) {
      root.setAttribute("transform", `${shift}${own}`.trim());
    }
  }
  if (options.frame) drawFrame(clone, options.frame, width, options.height);
  return new XMLSerializer().serializeToString(clone);
}

/**
 * Rasterise. Resolves to a PNG blob.
 *
 * Rejects rather than resolving to a broken image when the SVG cannot be
 * loaded - the caller shows a message, because a download that silently
 * produces a 0-byte file is worse than one that says it failed.
 */
export function svgToPng(
  svg: SVGSVGElement,
  options: PngOptions
): Promise<Blob> {
  const scale = options.scale ?? 2;
  const markup = svgMarkup(svg, options);
  const size = framedSize(options);
  // encodeURIComponent, not a blob: URL - see the note at the top.
  const source = `data:image/svg+xml;charset=utf-8,${encodeURIComponent(markup)}`;

  return new Promise((resolve, reject) => {
    const image = new Image();
    image.onload = () => {
      const canvas = document.createElement("canvas");
      canvas.width = Math.max(1, Math.round(size.width * scale));
      canvas.height = Math.max(1, Math.round(size.height * scale));
      const context = canvas.getContext("2d");
      if (!context) return reject(new Error("no 2d context"));
      context.fillStyle = options.background;
      context.fillRect(0, 0, canvas.width, canvas.height);
      context.drawImage(image, 0, 0, canvas.width, canvas.height);
      canvas.toBlob(
        (blob) => (blob ? resolve(blob) : reject(new Error("toBlob returned null"))),
        "image/png"
      );
    };
    image.onerror = () => reject(new Error("the SVG could not be rasterised"));
    image.src = source;
  });
}

/** `dis-beyazlatma-2026-09-27.png`, by the same folding the CSV name uses. */
export function pngFilename(seed: string, today: Date = new Date()): string {
  return exportFilename(seed, "png", today);
}
