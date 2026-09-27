import test from "node:test";
import assert from "node:assert/strict";

import { CSV_COLUMNS, cell, csvFilename, toCsv, toRow } from "../lib/csv.ts";

/**
 * The CSV export.
 *
 * Three of the four things this file gets right fail SILENTLY when they are
 * got wrong - a mangled Turkish character, a zero that means "we never looked",
 * a formula that runs when the customer opens the file. So each one is pinned
 * here rather than trusted to a reading of the code.
 */

const node = (over = {}) => ({
  question: "Dişleri en çabuk ne beyazlatır?",
  status: "gap",
  depth: 2,
  matching_pages: 1,
  results_checked: 7,
  ai_sources: ["colgate.com", "clevelandclinic.org"],
  repeat_count: 3,
  parents: ["a", "b"],
  updated_at: "2026-09-27T10:00:00+00:00",
  ...over,
});

// ------------------------------------------------------------- escaping

test("a comma does not split a cell", () => {
  assert.equal(cell("teeth, whitened"), '"teeth, whitened"');
});

test("a quote is doubled and the cell is wrapped", () => {
  assert.equal(cell('he said "no"'), '"he said ""no"""');
});

test("a newline inside a question survives", () => {
  assert.equal(cell("two\nlines"), '"two\nlines"');
});

test("an ordinary cell is left alone", () => {
  assert.equal(cell("teeth whitening"), "teeth whitening");
  assert.equal(cell(0), "0");
  assert.equal(cell(null), "");
  assert.equal(cell(undefined), "");
});

// --------------------------------------------------- formula injection

test("a cell that a spreadsheet would EXECUTE is defanged", () => {
  // The real risk: our rows are Google's text and third-party page titles.
  // `=HYPERLINK(...)` in a question is a phishing link that runs when the
  // customer opens the file WE generated.
  for (const dangerous of ["=1+1", "+1", "-1", "@SUM(A1)", "\tx", "\rx"]) {
    assert.ok(
      cell(dangerous).replace(/^"/, "").startsWith("'"),
      `${JSON.stringify(dangerous)} was not defanged`
    );
  }
});

test("the apostrophe goes INSIDE the quotes when a cell needs both", () => {
  // Order matters: `'"=1,2"` would put the escape outside the quoted field,
  // where it is data rather than an escape.
  assert.equal(cell("=1,2"), `"'=1,2"`);
});

test("a question that merely CONTAINS an equals sign is not touched", () => {
  assert.equal(cell("what is 2=2"), "what is 2=2");
});

// ------------------------------------------------- unknown is not zero

test("an unchecked question has EMPTY measurements, never 0", () => {
  // Writing 0 would turn "we never looked" into "no page answers this" - a
  // gap the metric never claimed, in a column somebody will sort by.
  const row = toRow(node({ status: "not_checked", results_checked: 0, matching_pages: 0 }));
  const cells = row.split(",");
  const matching = CSV_COLUMNS.indexOf("matching_pages");
  const ai = CSV_COLUMNS.indexOf("ai_domains");
  assert.equal(cells[matching], "");
  assert.equal(cells[ai], "");
  assert.ok(row.includes("not_checked"));
});

test("zero matching pages on a CHECKED question is a real 0", () => {
  // The product's most important finding. Blanking it would hide exactly the
  // rows this tool exists to surface.
  const row = toRow(node({ matching_pages: 0, results_checked: 8 }));
  assert.equal(row.split(",")[CSV_COLUMNS.indexOf("matching_pages")], "0");
});

// -------------------------------------------------------- the envelope

test("the file starts with a BOM so Excel reads Turkish correctly", () => {
  // Without it `diş` opens as `diÅŸ` in the market this product was measured in.
  const csv = toCsv([node()]);
  assert.ok(csv.startsWith("﻿"));
  assert.ok(csv.includes("Dişleri en çabuk ne beyazlatır?"));
});

test("rows are CRLF-separated and the header comes first", () => {
  const csv = toCsv([node()]);
  const [header] = csv.slice(1).split("\r\n");
  assert.equal(header, CSV_COLUMNS.join(","));
  assert.ok(csv.endsWith("\r\n"));
});

test("an empty tree still produces a header", () => {
  assert.equal(toCsv([]), "﻿" + CSV_COLUMNS.join(",") + "\r\n");
});

test("a node missing the optional fields does not crash or print undefined", () => {
  // Archive trees omit fields the live API sends; the same shape difference
  // that took the question panel down on 2026-09-17.
  const row = toRow({
    question: "q", status: "gap", depth: 1,
    matching_pages: 2, results_checked: 5,
  });
  assert.ok(!row.includes("undefined"));
});

// ---------------------------------------------------------- filenames

test("the filename folds a Turkish seed to something a file system keeps", () => {
  assert.equal(
    csvFilename("diş beyazlatma", new Date("2026-09-27T12:00:00Z")),
    "dis-beyazlatma-2026-09-27.csv"
  );
});

test("a seed with nothing Latin in it still produces a usable name", () => {
  assert.equal(
    csvFilename("日本語", new Date("2026-09-27T12:00:00Z")),
    "answergap-2026-09-27.csv"
  );
});

test("punctuation and spacing collapse rather than leaking into the name", () => {
  assert.equal(
    csvFilename("  what's   best?? ", new Date("2026-09-27T12:00:00Z")),
    "what-s-best-2026-09-27.csv"
  );
});
