"use client";

import {
  useCallback,
  useEffect,
  useImperativeHandle,
  useMemo,
  useRef,
  useState,
} from "react";
import { useI18n } from "@/i18n";
import { pngFilename, svgToPng } from "@/lib/png";
import { aiKnown, isCited } from "@/lib/domains";
import type { Node } from "@/lib/types";
import { citedDomains } from "./AiSummary";

/* Tree layout, no library.
 *
 * At ~50 nodes a d3 dependency is not worth carrying, and hand-rolling keeps
 * full control of the layout. Horizontal orientation (root left, children
 * right) because questions are long sentences — a vertical tree forces boxes
 * that are either too narrow to read or too wide to fit.
 *
 * Layout: every leaf gets its own row; an internal node centres on its
 * children. That is the simple form of Reingold-Tilford and is visually
 * sufficient at this scale.
 */

const W = 252;
const H = 44;
const GAP_X = 64;
const ROW = 54;
const PAD = 40;
const CHARS_PER_LINE = 34;
/* A question wraps to at most this many lines before it is cut with an
   ellipsis. Three, not two: at two, one PAA question in five was cut, and a
   cut question is the one thing the exported image cannot recover. */
const MAX_LINES = 3;
const LINE_H = 14;
/* The AI Overview pill straddles the bottom border, so it never covers the
 * question text and fits the 10px gap between rows. */
const PILL_H = 14;
/* Mirrors `.panel` in globals.css. The canvas cannot measure a sibling it does
   not own, and the two only have to agree on how much room to leave. */
const PANEL_W = 400;
const MARGIN = 16;
/* Corner radius on an edge's two bends. Large enough to read as a rounded
   corner at 100%, small enough that the vertical trunk is still obviously a
   straight line. */
const EDGE_RADIUS = 10;
/* Zoom presets in the toolbar's dropdown, in percent. Their ends are also the
   clamp for every other way of zooming, so the wheel cannot reach a level the
   box cannot name. */
const ZOOM_LEVELS = [25, 50, 75, 100, 125, 150, 200, 300, 400];
const ZOOM_MIN = ZOOM_LEVELS[0] / 100;
const ZOOM_MAX = ZOOM_LEVELS[ZOOM_LEVELS.length - 1] / 100;
const clampZoom = (k: number) => Math.min(ZOOM_MAX, Math.max(ZOOM_MIN, k));

interface Placed {
  node: Node;
  x: number;
  /* `y` is where a standard H-tall box would sit, so `y + H / 2` is the
     centre every edge attaches to. A taller box grows evenly about that
     centre, from `top` for `h`. */
  y: number;
  top: number;
  h: number;
  lines: string[];
}

/* The box grows by one line for every line beyond what a standard box holds:
   two for a question, one for the seed, whose caption takes the other. */
function boxHeight(lines: number, isSeed: boolean): number {
  return H + Math.max(0, lines - (isSeed ? 1 : 2)) * LINE_H;
}

function wrap(text: string, maxLines = MAX_LINES): string[] {
  const words = text.split(/\s+/);
  const lines: string[] = [];
  let current = "";
  for (const word of words) {
    const candidate = current ? `${current} ${word}` : word;
    if (candidate.length <= CHARS_PER_LINE) {
      current = candidate;
    } else {
      if (current) lines.push(current);
      current = word;
      if (lines.length === maxLines) break;
    }
  }
  if (current && lines.length < maxLines) lines.push(current);
  if (lines.length === maxLines && lines.join(" ").length < text.length) {
    const last = lines[maxLines - 1];
    lines[maxLines - 1] =
      last.length > CHARS_PER_LINE - 1
        ? last.slice(0, CHARS_PER_LINE - 1) + "…"
        : last + "…";
  }
  return lines.length ? lines : [text];
}

/* One edge, routed as an elbow: out of the parent, down a shared channel, into
 * the child.
 *
 * It used to be a single cubic bezier from parent to child. That is the right
 * curve for a pair of nodes near each other and the wrong one for a fan: the
 * seed of a 51-node tree has its children spread over two thousand pixels, so
 * every curve left the parent at almost the same point and climbed at almost
 * the same angle, and the result read as a bundle of noise rather than as
 * structure. Measured on `dis-beyazlatma`, where it covered the left third of
 * the canvas.
 *
 * Every child of one parent now shares ONE vertical trunk at the midpoint of
 * the gap between columns, which is what an org chart or a file tree does and
 * for the same reason: the eye follows a line it can see the whole of.
 *
 * The corner radius shrinks on short hops so two rows apart never produces a
 * curve bigger than the distance it has to cover.
 */
function elbow(x1: number, y1: number, x2: number, y2: number): string {
  // Siblings that sit level with their parent get a straight line; an elbow
  // with no bend in it would still draw two curves worth of path data.
  if (Math.abs(y2 - y1) < 0.5) return `M${x1},${y1} H${x2}`;

  const midX = (x1 + x2) / 2;
  const down = y2 > y1 ? 1 : -1;
  const r = Math.min(EDGE_RADIUS, Math.abs(y2 - y1) / 2, (x2 - x1) / 2);

  return [
    `M${x1},${y1}`,
    `H${midX - r}`,
    `Q${midX},${y1} ${midX},${y1 + r * down}`,
    `V${y2 - r * down}`,
    `Q${midX},${y2} ${midX + r},${y2}`,
    `H${x2}`,
  ].join(" ");
}

export function QuestionTree({
  nodes,
  selectedId,
  onSelect,
  highlighted,
  site,
  seed,
  exportRef,
}: {
  nodes: Node[];
  selectedId: string | null;
  onSelect: (id: string) => void;
  /** Ids passing the filter. null means "no filter, show everything normally". */
  highlighted: Set<string> | null;
  /** The reader's normalized domain, or null; marks nodes that cite it. */
  site: string | null;
  /** Names the downloaded file. */
  seed: string;
  /**
   * Lets the toolbar trigger the image export.
   *
   * THE BUTTON LIVES OUTSIDE THIS COMPONENT NOW, under the view tabs, because
   * in the zoom strip it was a 28px square drawn with `⤓` - a glyph most
   * system fonts do not have, so it rendered as nothing and read as an
   * unclickable gap. The export itself has to stay here: it needs the `<svg>`
   * and the tree's measured extent, neither of which the toolbar can see.
   */
  exportRef?: React.Ref<{ exportPng: () => void }>;
}) {
  const { t } = useI18n();
  const canvasRef = useRef<HTMLDivElement>(null);
  /* The <svg> itself, for the image export. The canvas div around it carries
     the pan/zoom listeners and is the wrong element to serialise. */
  const svgRef = useRef<SVGSVGElement>(null);
  const [view, setView] = useState({ x: 0, y: 0, k: 1 });
  const [dragging, setDragging] = useState(false);
  const dragStart = useRef<{ mx: number; my: number; x: number; y: number } | null>(null);

  const { placed, edges, width, height } = useMemo(() => {
    const children = new Map<string | null, Node[]>();
    for (const node of nodes) {
      const list = children.get(node.parent_id) ?? [];
      list.push(node);
      children.set(node.parent_id, list);
    }

    const layout = new Map<string, Placed>();
    /* Leaves stack downward from here; a tall leaf takes its extra height
       out of the rows below it rather than overlapping them. */
    let cursor = 0;

    const place = (node: Node): number => {
      const kids = children.get(node.id) ?? [];
      const lines = wrap(node.question);
      const h = boxHeight(lines.length, node.depth === 0);
      const extra = h - H;
      let y: number;
      if (kids.length === 0) {
        y = cursor + extra / 2;
        cursor += ROW + extra;
      } else {
        const ys = kids.map(place);
        y = (Math.min(...ys) + Math.max(...ys)) / 2;
      }
      layout.set(node.id, {
        node,
        x: node.depth * (W + GAP_X),
        y,
        top: y - extra / 2,
        h,
        lines,
      });
      return y;
    };

    for (const root of children.get(null) ?? []) place(root);

    /* An internal box taller than standard can poke above the first row. */
    const minTop = Math.min(0, ...[...layout.values()].map((p) => p.top));
    if (minTop < 0) {
      for (const p of layout.values()) {
        p.y -= minTop;
        p.top -= minTop;
      }
    }

    const edgeList: { id: string; d: string }[] = [];
    for (const item of layout.values()) {
      const parentId = item.node.parent_id;
      if (!parentId) continue;
      const parent = layout.get(parentId);
      if (!parent) continue;
      const x1 = parent.x + W;
      const y1 = parent.y + H / 2;
      const x2 = item.x;
      const y2 = item.y + H / 2;
      edgeList.push({
        id: `${parentId}->${item.node.id}`,
        d: elbow(x1, y1, x2, y2),
      });
    }

    const all = [...layout.values()];
    const maxX = all.length ? Math.max(...all.map((p) => p.x)) + W : W;
    const maxY = all.length ? Math.max(...all.map((p) => p.top + p.h)) : H;

    return {
      placed: all,
      edges: edgeList,
      width: maxX + PAD * 2,
      height: maxY + PAD * 2,
    };
  }, [nodes]);

  const fit = useCallback(() => {
    const el = canvasRef.current;
    if (!el) return;
    const { clientWidth: cw, clientHeight: ch } = el;
    const k = clampZoom(Math.min(cw / width, ch / height, 1));
    setView({ k, x: (cw - width * k) / 2, y: (ch - height * k) / 2 });
  }, [width, height]);

  /* Download the tree as an image.
   *
   * THE WHOLE TREE, not the visible viewport: `rootTransform` replaces the
   * pan/zoom with the plain padding offset, so what lands in the file is the
   * answer rather than wherever the reader happened to have scrolled. That is
   * also why it does not matter that the on-screen SVG is 100% x 100% - the
   * export is measured from `width`/`height`, which are the tree's own extent.
   *
   * The background is read from the live canvas rather than hard-coded, so an
   * export taken in dark mode is dark. A PNG with no background at all is dark
   * text on transparency, invisible in most viewers. */
  const [exporting, setExporting] = useState(false);
  const exportPng = useCallback(() => {
    const svg = svgRef.current;
    const el = canvasRef.current;
    if (!svg || !el || exporting) return;
    setExporting(true);
    const background =
      window.getComputedStyle(el).backgroundColor || "#ffffff";
    svgToPng(svg, {
      width,
      height,
      background,
      rootTransform: `translate(${PAD},${PAD})`,
    })
      .then((blob) => {
        const url = URL.createObjectURL(blob);
        const link = document.createElement("a");
        link.href = url;
        link.download = pngFilename(seed);
        link.click();
        URL.revokeObjectURL(url);
      })
      .catch(() => {
        /* Nothing downloaded. Silent here rather than a thrown error: the
           button is a convenience, and a modal about a failed image on a page
           about questions helps nobody. */
      })
      .finally(() => setExporting(false));
  }, [width, height, seed, exporting]);

  /* Handed to the toolbar. `useImperativeHandle` rather than a callback prop
     because the button's ENABLED state has to follow `exporting`, and a
     function passed upward in an effect goes stale the moment that flips. */
  useImperativeHandle(exportRef, () => ({ exportPng }), [exportPng]);

  /* Opening position. NOT `fit()`.
   *
   * A question tree is a tall narrow ribbon and the canvas is landscape, so
   * fitting both axes is always decided by the height: measured on the three
   * demo trees the width fits at 91% every time while the height forces 82%,
   * 73% and — at 51 nodes — 32%. Fitting therefore guarantees that the bigger
   * the answer, the less of it can be read.
   *
   * So the tree opens at 100% anchored on the seed, the way a canvas tool
   * opens, and the whole-tree view stays one click away on the fit button.
   * A tree small enough to fit whole is centred instead, because for those
   * the overview and the readable view are the same thing. */
  const anchor = useCallback(() => {
    const el = canvasRef.current;
    if (!el) return;
    const { clientWidth: cw, clientHeight: ch } = el;
    if (width <= cw && height <= ch) {
      setView({ k: 1, x: (cw - width) / 2, y: (ch - height) / 2 });
      return;
    }
    const root = placed.find((p) => p.node.parent_id === null) ?? placed[0];
    const rootY = root ? root.y + H / 2 : height / 2;
    /* Centred horizontally while the tree is narrower than the canvas, pinned
       to the left edge once it is not — so a shallow tree is not stranded
       against one side, and a deep one still starts at the seed. */
    const x = width <= cw ? (cw - width) / 2 : 24 - PAD;
    setView({ k: 1, x, y: ch / 2 - (rootY + PAD) });
  }, [placed, width, height]);

  /* Once per mount, and deliberately not on every layout change: scoring a
     question harvests new nodes into the tree, and re-anchoring there would
     throw away the reader's pan and zoom mid-task. `applyScore` in TreeScreen
     avoids a refetch for that same reason — an effect keyed on the layout
     would have undone it. */
  const anchored = useRef(false);
  useEffect(() => {
    if (anchored.current) return;
    anchored.current = true;
    anchor();
  }, [anchor]);

  /* Keep the selected node out from under the detail panel.
   *
   * The panel buys its 400px back from the canvas by overlaying it, and the
   * node most likely to be underneath is the one just clicked — the panel is
   * anchored right and the deepest column sits right. So the canvas gives way:
   * the smallest pan that brings the selection back into the uncovered strip,
   * and nothing at all when it is already visible. */
  useEffect(() => {
    if (!selectedId) return;
    const el = canvasRef.current;
    if (!el) return;
    const item = placed.find((p) => p.node.id === selectedId);
    if (!item) return;
    const { clientWidth: cw, clientHeight: ch } = el;
    setView((v) => {
      const left = v.x + v.k * (item.x + PAD);
      const right = v.x + v.k * (item.x + PAD + W);
      const top = v.y + v.k * (item.top + PAD);
      const bottom = v.y + v.k * (item.top + PAD + item.h);
      const edge = cw - PANEL_W - MARGIN;
      let dx = 0;
      let dy = 0;
      if (right > edge) dx = edge - right;
      if (left + dx < MARGIN) dx = MARGIN - left;
      if (bottom > ch - MARGIN) dy = ch - MARGIN - bottom;
      if (top + dy < MARGIN) dy = MARGIN - top;
      return dx || dy ? { ...v, x: v.x + dx, y: v.y + dy } : v;
    });
  }, [selectedId, placed]);

  const onWheel = (e: React.WheelEvent) => {
    e.preventDefault();
    const el = canvasRef.current;
    if (!el) return;
    const box = el.getBoundingClientRect();
    const mx = e.clientX - box.left;
    const my = e.clientY - box.top;
    setView((v) => {
      const k = clampZoom(v.k * (e.deltaY < 0 ? 1.12 : 1 / 1.12));
      const ratio = k / v.k;
      return { k, x: mx - (mx - v.x) * ratio, y: my - (my - v.y) * ratio };
    });
  };

  const onPointerDown = (e: React.PointerEvent) => {
    if (e.button !== 0) return;
    (e.target as Element).setPointerCapture?.(e.pointerId);
    dragStart.current = { mx: e.clientX, my: e.clientY, x: view.x, y: view.y };
    setDragging(true);
  };
  const onPointerMove = (e: React.PointerEvent) => {
    const start = dragStart.current;
    if (!start) return;
    setView((v) => ({
      ...v,
      x: start.x + (e.clientX - start.mx),
      y: start.y + (e.clientY - start.my),
    }));
  };
  const endDrag = () => {
    dragStart.current = null;
    setDragging(false);
  };

  /* Zoom about the canvas centre. `zoomTo` is the dropdown's absolute level;
     `zoomBy` is the buttons' relative step. */
  const zoomTo = (target: (k: number) => number) =>
    setView((v) => {
      const el = canvasRef.current;
      const cw = el?.clientWidth ?? 0;
      const ch = el?.clientHeight ?? 0;
      const k = clampZoom(target(v.k));
      const ratio = k / v.k;
      return {
        k,
        x: cw / 2 - (cw / 2 - v.x) * ratio,
        y: ch / 2 - (ch / 2 - v.y) * ratio,
      };
    });
  const zoomBy = (factor: number) => zoomTo((k) => k * factor);

  /* The current level as a whole percent. When it is not one of the presets
     (wheel, +/-, fit) it is shown as an extra option so the box never lies
     about the scale on screen. */
  const percent = Math.round(view.k * 100);
  const levels = ZOOM_LEVELS.includes(percent)
    ? ZOOM_LEVELS
    : [...ZOOM_LEVELS, percent].sort((a, b) => a - b);

  return (
    <>
      <div className="zoom">
        <button onClick={() => zoomBy(1 / 1.25)} title={t("toolbar.zoomOut")}
                aria-label={t("toolbar.zoomOut")}>−</button>
        <select
          className="ratio"
          value={percent}
          onChange={(e) => zoomTo(() => Number(e.target.value) / 100)}
          title={t("toolbar.zoomLevel")}
          aria-label={t("toolbar.zoomLevel")}
        >
          {levels.map((p) => (
            <option key={p} value={p}>{p}%</option>
          ))}
        </select>
        <button onClick={() => zoomBy(1.25)} title={t("toolbar.zoomIn")}
                aria-label={t("toolbar.zoomIn")}>+</button>
        <button onClick={fit} title={t("toolbar.fit")} aria-label={t("toolbar.fit")}>⤢</button>
      </div>

      <div
        ref={canvasRef}
        className={`tree-canvas${dragging ? " dragging" : ""}`}
        onWheel={onWheel}
        onPointerDown={onPointerDown}
        onPointerMove={onPointerMove}
        onPointerUp={endDrag}
        onPointerCancel={endDrag}
      >
        <svg ref={svgRef} width="100%" height="100%">
          <g transform={`translate(${view.x},${view.y}) scale(${view.k}) translate(${PAD},${PAD})`}>
            {edges.map((edge) => (
              <path key={edge.id} className="edge-line" d={edge.d} />
            ))}

            {placed.map((item) => {
              const node = item.node;
              const faded = highlighted !== null && !highlighted.has(node.id);
              const selected = node.id === selectedId;
              /* The seed is the keyword that was typed, not a question that
                 was found. It keeps its score - selecting it still shows the
                 pages - but it is not drawn as a verdict, and it carries
                 neither the AI pill nor the repeat badge, both of which only
                 mean something about a discovered question. */
              const isSeed = node.depth === 0;
              return (
                <g
                  key={node.id}
                  className={`node ${node.status}${isSeed ? " seed" : ""}${
                    selected ? " selected" : ""
                  }${faded ? " faded" : ""}`}
                >
                  <g
                    className="node-hit"
                    onClick={() => onSelect(node.id)}
                    role="button"
                    tabIndex={0}
                    aria-label={node.question}
                    onKeyDown={(e) => {
                      if (e.key === "Enter" || e.key === " ") {
                        e.preventDefault();
                        onSelect(node.id);
                      }
                    }}
                  >
                    <rect className="node-box" x={item.x} y={item.top}
                          width={W} height={item.h} rx={7} />
                    {item.lines.map((line, i) => (
                      <text
                        key={i}
                        className="node-text"
                        x={item.x + 11}
                        /* The seed's text rides higher: the SEED caption sits
                           along the bottom of its box, where a question has
                           nothing. */
                        y={
                          isSeed
                            ? item.top + 20 + i * LINE_H
                            : item.top +
                              (item.h - item.lines.length * LINE_H) / 2 +
                              11 +
                              i * LINE_H
                        }
                      >
                        {line}
                      </text>
                    ))}
                    {isSeed && (
                      <text
                        className="node-seed-label"
                        x={item.x + 11}
                        y={item.top + item.h - 7}
                      >
                        {t("toolbar.seedLabel")}
                      </text>
                    )}
                    {!isSeed && (() => {
                      /* Only nodes whose AI answer could be READ carry a pill.
                         Unchecked and unresolved are both unknown, and a pill
                         reading "AI 0" would state a result neither has. */
                      const count = aiKnown(node) ? citedDomains(node).length : 0;
                      if (count === 0) return null;
                      const you = site !== null && isCited(node.ai_sources, site);
                      const label = you
                        ? `${t("ai.treeMarker", { count })} · ${t("table.aiYou")}`
                        : t("ai.treeMarker", { count });
                      const width = label.length * 6 + 14;
                      const x = item.x + W - width - 10;
                      const y = item.top + item.h - PILL_H / 2;
                      return (
                        <g className={`ai-pill${you ? " you" : ""}`}>
                          <title>
                            {you
                              ? `${t("ai.treeHint", { count })} ${t("ai.treeYouHint", { site })}`
                              : t("ai.treeHint", { count })}
                          </title>
                          <rect x={x} y={y} width={width} height={PILL_H} rx={PILL_H / 2} />
                          <text x={x + width / 2} y={y + 10} textAnchor="middle">
                            {label}
                          </text>
                        </g>
                      );
                    })()}
                    {!isSeed && node.repeat_count > 1 && (
                      <>
                        <circle cx={item.x + W - 15} cy={item.top + 14} r={9}
                                fill="var(--surface-2)" stroke="var(--border-strong)" />
                        <text className="node-sub badge-circle" x={item.x + W - 15}
                              y={item.top + 17.5} textAnchor="middle">
                          ×{node.repeat_count}
                        </text>
                      </>
                    )}
                  </g>
                </g>
              );
            })}
          </g>
        </svg>
      </div>
    </>
  );
}
