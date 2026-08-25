"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useI18n } from "@/i18n";
import type { Node } from "@/lib/types";

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

interface Placed {
  node: Node;
  x: number;
  y: number;
  lines: string[];
}

function wrap(text: string, maxLines = 2): string[] {
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

export function QuestionTree({
  nodes,
  selectedId,
  onSelect,
  highlighted,
}: {
  nodes: Node[];
  selectedId: string | null;
  onSelect: (id: string) => void;
  /** Ids passing the filter. null means "no filter, show everything normally". */
  highlighted: Set<string> | null;
}) {
  const { t } = useI18n();
  const canvasRef = useRef<HTMLDivElement>(null);
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
    let row = 0;

    const place = (node: Node): number => {
      const kids = children.get(node.id) ?? [];
      let y: number;
      if (kids.length === 0) {
        y = row * ROW;
        row += 1;
      } else {
        const ys = kids.map(place);
        y = (Math.min(...ys) + Math.max(...ys)) / 2;
      }
      layout.set(node.id, {
        node,
        x: node.depth * (W + GAP_X),
        y,
        lines: wrap(node.question),
      });
      return y;
    };

    for (const root of children.get(null) ?? []) place(root);

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
      const mid = (x1 + x2) / 2;
      edgeList.push({
        id: `${parentId}->${item.node.id}`,
        d: `M${x1},${y1} C${mid},${y1} ${mid},${y2} ${x2},${y2}`,
      });
    }

    const all = [...layout.values()];
    const maxX = all.length ? Math.max(...all.map((p) => p.x)) + W : W;
    const maxY = all.length ? Math.max(...all.map((p) => p.y)) + H : H;

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
    const k = Math.min(cw / width, ch / height, 1);
    setView({ k, x: (cw - width * k) / 2, y: (ch - height * k) / 2 });
  }, [width, height]);

  useEffect(() => {
    fit();
  }, [fit]);

  const onWheel = (e: React.WheelEvent) => {
    e.preventDefault();
    const el = canvasRef.current;
    if (!el) return;
    const box = el.getBoundingClientRect();
    const mx = e.clientX - box.left;
    const my = e.clientY - box.top;
    setView((v) => {
      const k = Math.min(2.5, Math.max(0.15, v.k * (e.deltaY < 0 ? 1.12 : 1 / 1.12)));
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

  const zoomBy = (factor: number) =>
    setView((v) => {
      const el = canvasRef.current;
      const cw = el?.clientWidth ?? 0;
      const ch = el?.clientHeight ?? 0;
      const k = Math.min(2.5, Math.max(0.15, v.k * factor));
      const ratio = k / v.k;
      return {
        k,
        x: cw / 2 - (cw / 2 - v.x) * ratio,
        y: ch / 2 - (ch / 2 - v.y) * ratio,
      };
    });

  return (
    <>
      <div className="zoom">
        <button onClick={() => zoomBy(1 / 1.25)} title={t("toolbar.zoomOut")}
                aria-label={t("toolbar.zoomOut")}>−</button>
        <span className="ratio">{Math.round(view.k * 100)}%</span>
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
        <svg width="100%" height="100%">
          <g transform={`translate(${view.x},${view.y}) scale(${view.k}) translate(${PAD},${PAD})`}>
            {edges.map((edge) => (
              <path key={edge.id} className="edge-line" d={edge.d} />
            ))}

            {placed.map((item) => {
              const node = item.node;
              const faded = highlighted !== null && !highlighted.has(node.id);
              const selected = node.id === selectedId;
              return (
                <g
                  key={node.id}
                  className={`node ${node.status}${selected ? " selected" : ""}${
                    faded ? " faded" : ""
                  }`}
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
                    <rect className="node-box" x={item.x} y={item.y}
                          width={W} height={H} rx={7} />
                    {item.lines.map((line, i) => (
                      <text
                        key={i}
                        className="node-text"
                        x={item.x + 11}
                        y={item.y + (item.lines.length === 1 ? 26 : 19 + i * 14)}
                      >
                        {line}
                      </text>
                    ))}
                    {node.repeat_count > 1 && (
                      <>
                        <circle cx={item.x + W - 15} cy={item.y + 14} r={9}
                                fill="var(--surface-2)" stroke="var(--border-strong)" />
                        <text className="node-sub badge-circle" x={item.x + W - 15}
                              y={item.y + 17.5} textAnchor="middle">
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
