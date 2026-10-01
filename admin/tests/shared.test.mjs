import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";

import { toCsv } from "../lib/shared/csv.ts";

/**
 * `admin/lib/shared/` holds COPIES of three web files, not imports of them.
 *
 * The admin and the web are separate Railway services, each built from its
 * own directory, so the admin cannot reach `../web` at build time. A copy is
 * the price; this test is what keeps the copy honest. If the customer's CSV
 * changes - a column added, the formula-injection rule tightened - the admin's
 * download must not quietly keep the old behaviour, so a diff fails here and
 * the fix is to copy the file again.
 */
const SHARED = ["csv.ts", "png.ts", "filename.ts"];

for (const name of SHARED) {
  test(`lib/shared/${name} is identical to web/lib/${name}`, () => {
    const admin = readFileSync(new URL(`../lib/shared/${name}`, import.meta.url), "utf8");
    const web = readFileSync(new URL(`../../web/lib/${name}`, import.meta.url), "utf8");
    assert.equal(admin.replace(/\r\n/g, "\n"), web.replace(/\r\n/g, "\n"),
      `copy web/lib/${name} over admin/lib/shared/${name}`);
  });
}

test("an admin export defangs a formula exactly as the customer's does", () => {
  const csv = toCsv([{
    question: "=HYPERLINK(\"http://evil\")",
    status: "gap", depth: 1, matching_pages: 0, results_checked: 8,
  }]);
  assert.match(csv, /"'=HYPERLINK\(""http:\/\/evil""\)"/);
});
