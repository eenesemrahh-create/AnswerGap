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
}

/** Serialise a styled copy of `svg` covering the given extent. */
export function svgMarkup(svg: SVGSVGElement, options: PngOptions): string {
  const clone = svg.cloneNode(true) as SVGSVGElement;
  inlineStyles(svg, clone);

  clone.setAttribute("xmlns", "http://www.w3.org/2000/svg");
  clone.setAttribute("width", String(options.width));
  clone.setAttribute("height", String(options.height));
  clone.setAttribute("viewBox", `0 0 ${options.width} ${options.height}`);

  if (options.rootTransform !== undefined) {
    const root = clone.querySelector("g");
    if (root) root.setAttribute("transform", options.rootTransform);
  }
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
  // encodeURIComponent, not a blob: URL - see the note at the top.
  const source = `data:image/svg+xml;charset=utf-8,${encodeURIComponent(markup)}`;

  return new Promise((resolve, reject) => {
    const image = new Image();
    image.onload = () => {
      const canvas = document.createElement("canvas");
      canvas.width = Math.max(1, Math.round(options.width * scale));
      canvas.height = Math.max(1, Math.round(options.height * scale));
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
