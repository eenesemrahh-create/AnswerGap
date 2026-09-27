/**
 * The question table as a CSV file.
 *
 * Pure, and free of `@/` imports, so `node --test` can load it directly - the
 * convention `lib/domains.ts` set. Everything here is a decision about what a
 * spreadsheet does with our data rather than about how to join strings.
 *
 * FOUR THINGS A NAIVE CSV WRITER GETS WRONG, and three of them fail silently:
 *
 * 1. FORMULA INJECTION. A cell beginning `=`, `+`, `-`, `@`, tab or carriage
 *    return is executed as a formula by Excel and Google Sheets. Our rows are
 *    Google's text and third-party page titles - data we did not write - and
 *    `=HYPERLINK(...)` in a question is a phishing link that runs when the
 *    customer opens the file we generated. Prefixed with an apostrophe, which
 *    every spreadsheet reads as "this is text".
 *
 * 2. THE BOM. Excel decodes a BOM-less file as the system codepage, so `diş`
 *    opens as `diÅŸ` for the market this product was measured in. Three bytes
 *    fix it and no other reader minds.
 *
 * 3. UNKNOWN IS NOT ZERO. A question nobody checked has no matching-page count
 *    and no verdict. Writing `0` there would turn "we never looked" into "no
 *    page answers this" - a gap the metric never claimed, in a file somebody
 *    will sort by that column. Those cells are empty, and `status` says
 *    `not_checked`.
 *
 * 4. CRLF. RFC 4180 says CRLF, and Excel on Windows agrees; LF alone puts a
 *    whole sheet on one row in some versions.
 */

/** Columns, in the order a reader scans them: what was asked, what we found,
 *  then where it sits in the tree. */
export const CSV_COLUMNS = [
  "question",
  "status",
  "depth",
  "matching_pages",
  "results_checked",
  "ai_domains",
  "repeat_count",
  "parents",
  "updated_at",
] as const;

/** The subset of a node this file needs. Structural typing, so the real `Node`
 *  satisfies it without this module importing the app's types. */
export interface CsvNode {
  question: string;
  status: string;
  depth: number;
  matching_pages: number;
  results_checked: number;
  ai_sources?: string[];
  repeat_count?: number;
  parents?: string[];
  updated_at?: string | null;
}

const RISKY_FIRST_CHARACTER = /^[=+\-@\t\r]/;

/**
 * One cell, escaped for RFC 4180 and defanged for spreadsheets.
 *
 * The apostrophe goes on BEFORE the quoting, not after: a cell that needs both
 * must end up as `"'=1+1"`, and doing it the other way round would place the
 * apostrophe outside the quotes where it is data rather than an escape.
 */
export function cell(value: unknown): string {
  if (value === null || value === undefined) return "";
  let text = String(value);
  if (RISKY_FIRST_CHARACTER.test(text)) text = `'${text}`;
  if (/[",\r\n]/.test(text)) text = `"${text.replace(/"/g, '""')}"`;
  return text;
}

/**
 * A number that is only meaningful once somebody has checked.
 *
 * `results_checked === 0` is the tree's own marker for "never looked", and it
 * is why this takes the whole node rather than a number: the caller cannot
 * decide emptiness from the value alone, because 0 matching pages on a CHECKED
 * question is the product's most important finding.
 */
function measured(node: CsvNode, value: number): string {
  return node.results_checked > 0 ? String(value) : "";
}

export function toRow(node: CsvNode): string {
  return [
    cell(node.question),
    cell(node.status),
    cell(node.depth),
    measured(node, node.matching_pages),
    cell(node.results_checked),
    // Distinct cited domains, the same count the AI Overview column shows.
    // Empty rather than 0 on an unchecked question, for rule 3 above.
    node.results_checked > 0 ? cell((node.ai_sources ?? []).length) : "",
    cell(node.repeat_count ?? ""),
    // Several parents is the repeat signal made visible. Semicolons, because
    // a comma would need the whole cell quoting for no gain in readability.
    cell((node.parents ?? []).join("; ")),
    cell(node.updated_at ?? ""),
  ].join(",");
}

/** The whole file, BOM included. */
export function toCsv(nodes: CsvNode[]): string {
  const lines = [CSV_COLUMNS.join(","), ...nodes.map(toRow)];
  return "﻿" + lines.join("\r\n") + "\r\n";
}

/**
 * A filename a person can find again.
 *
 * The seed plus the date, ASCII-folded: `diş beyazlatma` becomes
 * `dis-beyazlatma`, because a downloaded file travels through mail clients and
 * file systems that still mangle anything else. Falls back to `answergap` when
 * the seed folds away to nothing, which a non-Latin seed does entirely.
 */
export function csvFilename(seed: string, today: Date = new Date()): string {
  const slug = seed
    .normalize("NFKD")
    .replace(/[̀-ͯ]/g, "")
    .replace(/ı/g, "i")
    .replace(/ş/g, "s")
    .replace(/ğ/g, "g")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 60);
  const date = today.toISOString().slice(0, 10);
  return `${slug || "answergap"}-${date}.csv`;
}
