import { exportFilename } from "./filename.ts";

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
 * 3. UNKNOWN IS NOT ZERO. A question nobody checked has no AI Overview
 *    reading and no verdict. Writing "none" there would turn "we never looked"
 *    into "nothing cites an answer" - a claim nobody measured, in a file
 *    somebody will filter by that column. Those cells are empty, and `Status`
 *    says `Not checked`.
 *
 * 4. CRLF. RFC 4180 says CRLF, and Excel on Windows agrees; LF alone puts a
 *    whole sheet on one row in some versions.
 */

/** A FLAT LIST, three columns, at the operator's request (2026-10-03). The
 *  file used to carry the tree as well - depth, parents, repeat count - and
 *  a reader opening it wanted the questions and the verdicts, not the shape
 *  they were found in. The tree is the PNG export's job. */
export const CSV_COLUMNS = ["Question", "Status", "AI Overview"] as const;

/** The labels the Table view shows (`status.*` in `i18n/en.ts`), so the file
 *  and the screen name a verdict the same way. English, like the headers: a
 *  file is passed around, and a column of mixed languages sorts badly. An
 *  unknown status is written as itself rather than dropped. */
const STATUS_LABELS: Record<string, string> = {
  gap: "Unanswered",
  weak: "Barely answered",
  covered: "Well answered",
  no_data: "Not checked",
  not_checked: "Not checked",
};

/** The subset of a node this file needs. Structural typing, so the real `Node`
 *  satisfies it without this module importing the app's types. */
export interface CsvNode {
  question: string;
  status: string;
  results_checked: number;
  ai_sources?: string[];
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

export function toRow(node: CsvNode): string {
  return [
    cell(node.question),
    cell(STATUS_LABELS[node.status] ?? node.status),
    // The domains Google's AI Overview cited, distinct. EMPTY on a question
    // nobody checked, for rule 3 above - and also empty on a checked one that
    // cites nothing, which `Status` tells apart. Semicolons, because a comma
    // would need the whole cell quoting for no gain in readability.
    node.results_checked > 0
      ? cell([...new Set(node.ai_sources ?? [])].join("; "))
      : "",
  ].join(",");
}

/** The whole file, BOM included. */
export function toCsv(nodes: CsvNode[]): string {
  const lines = [CSV_COLUMNS.join(","), ...nodes.map(toRow)];
  return "﻿" + lines.join("\r\n") + "\r\n";
}

/** `dis-beyazlatma-2026-09-27.csv`. The folding lives in `filename.ts`, shared
 *  with the image export so the two files of one search agree on their name. */
export function csvFilename(seed: string, today: Date = new Date()): string {
  return exportFilename(seed, "csv", today);
}
