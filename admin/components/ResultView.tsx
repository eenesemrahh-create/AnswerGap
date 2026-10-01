"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { makeT, type Locale } from "@/lib/i18n";
import type { SearchNode } from "@/lib/types";
import { csvFilename, toCsv } from "@/lib/shared/csv.ts";
import { pngFilename, svgToPng } from "@/lib/shared/png.ts";
import { recordSearchExport } from "@/app/searches/actions";

type T = ReturnType<typeof makeT>;

/**
 * The stored result of one search, as a TREE or as a LIST, with the same two
 * downloads the customer has: CSV of the questions and PNG of the tree.
 *
 * The tree is a port of the customer app's `QuestionTree` - same layout, same
 * elbow edges, same status styling - so the admin sees what the customer saw.
 * A port rather than a shared import because the two apps are built as
 * separate services; the parts that MUST NOT drift (the CSV rules, the PNG
 * rasteriser, the file names) are byte-for-byte copies under `lib/shared/`,
 * pinned by `tests/shared.test.mjs`.
 *
 * EVERY DOWNLOAD IS AUDITED FIRST. The file is built here from data already on
 * the page, but taking a copy of somebody's research out of the product is an
 * act that should leave a trace, so the audit row is written before the file
 * is - and if it cannot be written, no file is produced.
 */
export function ResultView({
  slug,
  seed,
  nodes,
  locale,
}: {
  slug: string;
  seed: string;
  nodes: SearchNode[];
  locale: Locale;
}) {
  const t = makeT(locale);
  const [mode, setMode] = useState<"tree" | "list">("tree");
  const [selected, setSelected] = useState<string | null>(null);
  const [busy, setBusy] = useState<"csv" | "png" | null>(null);
  const [failed, setFailed] = useState(false);
  const exportPngRef = useRef<(() => Promise<Blob>) | null>(null);

  // Orphans (a parent the list does not contain) hang from the seed rather
  // than vanishing from both views.
  const fixed = useMemo(() => {
    const ids = new Set(nodes.map((n) => n.id));
    const root = nodes.find((n) => n.depth === 0) ?? null;
    return nodes.map((n) =>
      n.depth > 0 && (!n.parent_id || !ids.has(n.parent_id)) && root
        ? { ...n, parent_id: root.id }
        : n
    );
  }, [nodes]);
  const questions = useMemo(() => fixed.filter((n) => n.depth > 0), [fixed]);

  const download = (blob: Blob, name: string) => {
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = name;
    link.click();
    URL.revokeObjectURL(url);
  };

  const exportCsv = async () => {
    if (busy) return;
    setBusy("csv");
    setFailed(false);
    try {
      await recordSearchExport(slug, "csv", questions.length);
      // Unknown stays unknown: `results_checked` 0 is the CSV's own marker for
      // "never looked", and it leaves the measured cells empty.
      const rows = questions.map((n) => ({
        ...n,
        matching_pages: n.matching_pages ?? 0,
        results_checked: n.results_checked ?? 0,
      }));
      download(new Blob([toCsv(rows)], { type: "text/csv;charset=utf-8" }),
               csvFilename(seed));
    } catch {
      setFailed(true);
    } finally {
      setBusy(null);
    }
  };

  const exportPng = async () => {
    if (busy) return;
    // The tree has to be on screen to be measured and styled.
    if (mode !== "tree") setMode("tree");
    setBusy("png");
    setFailed(false);
    try {
      await recordSearchExport(slug, "png", fixed.length);
      // One frame for the tree to mount if the list was showing.
      await new Promise((r) => requestAnimationFrame(() => r(null)));
      const render = exportPngRef.current;
      if (!render) throw new Error("tree not mounted");
      download(await render(), pngFilename(seed));
    } catch {
      setFailed(true);
    } finally {
      setBusy(null);
    }
  };

  const chosen = fixed.find((n) => n.id === selected) ?? null;

  return (
    <div className="result-view">
      <div className="result-bar">
        <div className="seg" role="tablist">
          <button role="tab" aria-selected={mode === "tree"}
                  className={mode === "tree" ? "on" : ""} onClick={() => setMode("tree")}>
            {t("searches.viewTree")}
          </button>
          <button role="tab" aria-selected={mode === "list"}
                  className={mode === "list" ? "on" : ""} onClick={() => setMode("list")}>
            {t("searches.viewList")}
          </button>
        </div>
        <span className="spacer" />
        <button className="act" onClick={exportCsv} disabled={busy !== null}>
          {busy === "csv" ? t("searches.exporting") : t("searches.downloadCsv")}
        </button>
        <button className="act" onClick={exportPng} disabled={busy !== null}>
          {busy === "png" ? t("searches.exporting") : t("searches.downloadPng")}
        </button>
      </div>
      <p className="faint small">{t("searches.exportAudited")}</p>
      {failed && <p className="notice">{t("searches.exportFailed")}</p>}

      {mode === "tree" ? (
        <>
          <TreeCanvas t={t} nodes={fixed} selectedId={selected} onSelect={setSelected}
                      exportRef={exportPngRef} />
          {chosen ? (
            <div className="qcard">
              <NodeDetail t={t} node={chosen} heading />
            </div>
          ) : (
            <p className="faint small">{t("searches.clickNode")}</p>
          )}
        </>
      ) : (
        <ResultList t={t} nodes={fixed} />
      )}
    </div>
  );
}

/* ---------------------------------------------------------------- detail */

function NodeDetail({ t, node, heading }: { t: T; node: SearchNode; heading?: boolean }) {
  return (
    <div className="qdetail">
      {heading && (
        <p className="qcard-head">
          <span className={`status-pill ${node.status}`}>{t(`gapStatus.${node.status}`)}</span>{" "}
          <b>{node.question}</b>
        </p>
      )}
      <p className="faint">
        {node.results_checked
          ? t("searches.pagesChecked", {
              matching: node.matching_pages ?? 0,
              checked: node.results_checked,
            })
          : t("searches.notChecked")}
        {node.ai_sources.length > 0 &&
          ` · ${t("searches.aiCites", { domains: node.ai_sources.join(", ") })}`}
        {node.discovered_by === "harvest" && ` · ${t("searches.harvested")}`}
      </p>
      {node.results.length > 0 && (
        <ol>
          {node.results.map((r, i) => (
            <li key={i}>
              {/* Only http(s) becomes a link. The URL is third-party data, and
                  a `javascript:` one would run in the admin's own session. */}
              {/^https?:\/\//i.test(r.url ?? "") ? (
                <a href={r.url} target="_blank" rel="noreferrer noopener">
                  {r.title || r.url}
                </a>
              ) : (
                <span>{r.title || r.url}</span>
              )}{" "}
              <span className="faint">{r.domain}</span>
            </li>
          ))}
        </ol>
      )}
    </div>
  );
}

/* ------------------------------------------------------------------ list */

function ResultList({ t, nodes }: { t: T; nodes: SearchNode[] }) {
  const children = new Map<string, SearchNode[]>();
  for (const n of nodes) {
    if (!n.parent_id) continue;
    children.set(n.parent_id, [...(children.get(n.parent_id) ?? []), n]);
  }
  const root = nodes.find((n) => n.depth === 0);
  const seen = new Set<string>();
  const render = (list: SearchNode[]) => (
    <ul className="qtree">
      {list.map((n) => {
        if (seen.has(n.id)) return null; // a cycle must not hang the page
        seen.add(n.id);
        const kids = children.get(n.id) ?? [];
        return (
          <li key={n.id}>
            <details>
              <summary>
                <span className={`status-pill ${n.status}`}>{t(`gapStatus.${n.status}`)}</span>{" "}
                {n.question}
              </summary>
              <NodeDetail t={t} node={n} />
            </details>
            {kids.length > 0 && render(kids)}
          </li>
        );
      })}
    </ul>
  );
  return render(root ? children.get(root.id) ?? [] : nodes.filter((n) => n.depth === 1));
}

/* ------------------------------------------------------------------ tree */

const W = 252;
const H = 44;
const GAP_X = 64;
const ROW = 54;
const PAD = 40;
const CHARS_PER_LINE = 34;
const PILL_H = 14;
const EDGE_RADIUS = 10;

interface Placed {
  node: SearchNode;
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
      last.length > CHARS_PER_LINE - 1 ? last.slice(0, CHARS_PER_LINE - 1) + "…" : last + "…";
  }
  return lines.length ? lines : [text];
}

function elbow(x1: number, y1: number, x2: number, y2: number): string {
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

function TreeCanvas({
  t,
  nodes,
  selectedId,
  onSelect,
  exportRef,
}: {
  t: T;
  nodes: SearchNode[];
  selectedId: string | null;
  onSelect: (id: string) => void;
  exportRef: React.RefObject<(() => Promise<Blob>) | null>;
}) {
  const canvasRef = useRef<HTMLDivElement>(null);
  const svgRef = useRef<SVGSVGElement>(null);
  const [view, setView] = useState({ x: 0, y: 0, k: 1 });
  const [dragging, setDragging] = useState(false);
  const dragStart = useRef<{ mx: number; my: number; x: number; y: number } | null>(null);

  const { placed, edges, width, height } = useMemo(() => {
    const children = new Map<string | null, SearchNode[]>();
    for (const node of nodes) {
      const list = children.get(node.parent_id) ?? [];
      list.push(node);
      children.set(node.parent_id, list);
    }
    const layout = new Map<string, Placed>();
    let row = 0;
    const place = (node: SearchNode): number => {
      if (layout.has(node.id)) return layout.get(node.id)!.y; // cycle guard
      layout.set(node.id, { node, x: node.depth * (W + GAP_X), y: 0, lines: wrap(node.question) });
      const kids = children.get(node.id) ?? [];
      let y: number;
      if (kids.length === 0) {
        y = row * ROW;
        row += 1;
      } else {
        const ys = kids.map(place);
        y = (Math.min(...ys) + Math.max(...ys)) / 2;
      }
      layout.get(node.id)!.y = y;
      return y;
    };
    for (const root of children.get(null) ?? []) place(root);

    const edgeList: { id: string; d: string }[] = [];
    for (const item of layout.values()) {
      const parentId = item.node.parent_id;
      if (!parentId) continue;
      const parent = layout.get(parentId);
      if (!parent) continue;
      edgeList.push({
        id: `${parentId}->${item.node.id}`,
        d: elbow(parent.x + W, parent.y + H / 2, item.x, item.y + H / 2),
      });
    }
    const all = [...layout.values()];
    const maxX = all.length ? Math.max(...all.map((p) => p.x)) + W : W;
    const maxY = all.length ? Math.max(...all.map((p) => p.y)) + H : H;
    return { placed: all, edges: edgeList, width: maxX + PAD * 2, height: maxY + PAD * 2 };
  }, [nodes]);

  const fit = useCallback(() => {
    const el = canvasRef.current;
    if (!el) return;
    const { clientWidth: cw, clientHeight: ch } = el;
    const k = Math.min(cw / width, ch / height, 1);
    setView({ k, x: (cw - width * k) / 2, y: (ch - height * k) / 2 });
  }, [width, height]);

  // Opens at 100% on the seed, like the customer's tree; fit is one click.
  useEffect(() => {
    const el = canvasRef.current;
    if (!el) return;
    const { clientWidth: cw, clientHeight: ch } = el;
    if (width <= cw && height <= ch) {
      setView({ k: 1, x: (cw - width) / 2, y: (ch - height) / 2 });
      return;
    }
    const root = placed.find((p) => p.node.parent_id === null) ?? placed[0];
    const rootY = root ? root.y + H / 2 : height / 2;
    setView({ k: 1, x: width <= cw ? (cw - width) / 2 : 24 - PAD, y: ch / 2 - (rootY + PAD) });
    // Once per mount: re-anchoring on every render would undo the admin's pan.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // The WHOLE tree, not the visible viewport, on the canvas's own background.
  useEffect(() => {
    exportRef.current = () => {
      const svg = svgRef.current;
      const el = canvasRef.current;
      if (!svg || !el) return Promise.reject(new Error("no tree"));
      return svgToPng(svg, {
        width,
        height,
        background: window.getComputedStyle(el).backgroundColor || "#ffffff",
        rootTransform: `translate(${PAD},${PAD})`,
      });
    };
    return () => {
      exportRef.current = null;
    };
  }, [exportRef, width, height]);

  // Wheel zoom needs a non-passive listener, or preventDefault is ignored
  // and the page scrolls along with the zoom.
  useEffect(() => {
    const el = canvasRef.current;
    if (!el) return;
    const onWheel = (e: WheelEvent) => {
      e.preventDefault();
      const box = el.getBoundingClientRect();
      const mx = e.clientX - box.left;
      const my = e.clientY - box.top;
      setView((v) => {
        const k = Math.min(2.5, Math.max(0.15, v.k * (e.deltaY < 0 ? 1.12 : 1 / 1.12)));
        const ratio = k / v.k;
        return { k, x: mx - (mx - v.x) * ratio, y: my - (my - v.y) * ratio };
      });
    };
    el.addEventListener("wheel", onWheel, { passive: false });
    return () => el.removeEventListener("wheel", onWheel);
  }, []);

  const zoomBy = (factor: number) =>
    setView((v) => {
      const el = canvasRef.current;
      const cw = el?.clientWidth ?? 0;
      const ch = el?.clientHeight ?? 0;
      const k = Math.min(2.5, Math.max(0.15, v.k * factor));
      const ratio = k / v.k;
      return { k, x: cw / 2 - (cw / 2 - v.x) * ratio, y: ch / 2 - (ch / 2 - v.y) * ratio };
    });

  return (
    <div className="tree-wrap">
      <div className="zoom">
        <button onClick={() => zoomBy(1 / 1.25)} aria-label={t("searches.zoomOut")}>−</button>
        <span className="ratio">{Math.round(view.k * 100)}%</span>
        <button onClick={() => zoomBy(1.25)} aria-label={t("searches.zoomIn")}>+</button>
        <button onClick={fit} aria-label={t("searches.fit")} title={t("searches.fit")}>⤢</button>
      </div>
      <div
        ref={canvasRef}
        className={`tree-canvas${dragging ? " dragging" : ""}`}
        onPointerDown={(e) => {
          if (e.button !== 0) return;
          dragStart.current = { mx: e.clientX, my: e.clientY, x: view.x, y: view.y };
          setDragging(true);
        }}
        onPointerMove={(e) => {
          const start = dragStart.current;
          if (!start) return;
          setView((v) => ({ ...v, x: start.x + (e.clientX - start.mx), y: start.y + (e.clientY - start.my) }));
        }}
        onPointerUp={() => { dragStart.current = null; setDragging(false); }}
        onPointerLeave={() => { dragStart.current = null; setDragging(false); }}
      >
        <svg ref={svgRef} width="100%" height="100%">
          <g transform={`translate(${view.x},${view.y}) scale(${view.k}) translate(${PAD},${PAD})`}>
            {edges.map((edge) => (
              <path key={edge.id} className="edge-line" d={edge.d} />
            ))}
            {placed.map((item) => {
              const node = item.node;
              const isSeed = node.depth === 0;
              const ai = node.results_checked ? new Set(node.ai_sources).size : 0;
              return (
                <g key={node.id}
                   className={`node ${node.status}${isSeed ? " seed" : ""}${node.id === selectedId ? " selected" : ""}`}>
                  <g
                    className="node-hit"
                    role="button"
                    tabIndex={0}
                    aria-label={node.question}
                    onClick={() => onSelect(node.id)}
                    onKeyDown={(e) => {
                      if (e.key === "Enter" || e.key === " ") {
                        e.preventDefault();
                        onSelect(node.id);
                      }
                    }}
                  >
                    <rect className="node-box" x={item.x} y={item.y} width={W} height={H} rx={7} />
                    {item.lines.map((line, i) => (
                      <text key={i} className="node-text" x={item.x + 11}
                            y={item.y + (isSeed ? 20 : item.lines.length === 1 ? 26 : 19) +
                               (item.lines.length === 1 && !isSeed ? 0 : i * 14)}>
                        {line}
                      </text>
                    ))}
                    {isSeed && (
                      <text className="node-seed-label" x={item.x + 11} y={item.y + H - 7}>
                        {t("searches.seedLabel")}
                      </text>
                    )}
                    {!isSeed && ai > 0 && (() => {
                      const label = `AI ${ai}`;
                      const pw = label.length * 6 + 14;
                      const x = item.x + W - pw - 10;
                      const y = item.y + H - PILL_H / 2;
                      return (
                        <g className="ai-pill">
                          <rect x={x} y={y} width={pw} height={PILL_H} rx={PILL_H / 2} />
                          <text x={x + pw / 2} y={y + 10} textAnchor="middle">{label}</text>
                        </g>
                      );
                    })()}
                    {!isSeed && node.repeat_count > 1 && (
                      <>
                        <circle cx={item.x + W - 15} cy={item.y + 14} r={9} className="badge-dot" />
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
    </div>
  );
}
