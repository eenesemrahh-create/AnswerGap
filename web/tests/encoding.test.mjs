// Run with `npm test`.
//
// THE ONE BUG A CODE REVIEW CANNOT SEE. The account-erasure strings shipped in
// `008dad5` as UTF-8 bytes written through a latin-1 encoder, so five locales
// rendered "HesabÄ±mÄ± silâ¦" on a production dialog while the diff, the build,
// the types and the lint all stayed perfectly happy. Nothing in the toolchain
// reads the prose; only a person looking at the screen does, and by then it is
// live.
//
// So the toolchain reads it here. This tests BYTES, not behaviour, which is why
// it loads the catalogues as text rather than importing them - an import would
// hand back strings that are already whatever the file says, and the point is
// to judge the file.
import { test } from "node:test";
import assert from "node:assert/strict";
import { readdirSync, readFileSync } from "node:fs";
import { join } from "node:path";

/** Every text file a customer's eyes can reach. */
const DIRS = ["i18n", "content/legal", "content/legal/terms", "content/legal/privacy"];

function catalogues() {
  const out = [];
  for (const dir of DIRS) {
    for (const name of readdirSync(new URL(`../${dir}`, import.meta.url))) {
      if (name.endsWith(".ts")) out.push([join(dir, name), new URL(`../${dir}/${name}`, import.meta.url)]);
    }
  }
  return out;
}

// A latin-1 lead byte followed by a continuation byte: "Ã©", "Ä±", "ÅŸ", "â€¦".
// Correctly encoded prose never produces this pair, because the second half is
// a control character or a stray symbol no language writes after a capital A
// with a diacritic.
const MOJIBAKE = /[Â-Åâ][\u0080-¿]/g;

test("no catalogue carries mojibake", () => {
  for (const [label, url] of catalogues()) {
    const text = readFileSync(url, "utf8");
    const hits = text.match(MOJIBAKE);
    assert.equal(
      hits,
      null,
      `${label} has ${hits?.length} mojibake sequence(s), first ${JSON.stringify(hits?.[0])} - the file was written through a latin-1 encoder`
    );
  }
});

test("no catalogue carries a replacement character", () => {
  // U+FFFD is the other half of the same accident: a byte that survived the
  // round trip as an unrecoverable "�". Unlike mojibake it cannot be
  // repaired by decoding again - the original character is simply gone - so it
  // has to be caught before the sentence is translated four more times.
  for (const [label, url] of catalogues()) {
    assert.ok(
      !readFileSync(url, "utf8").includes("�"),
      `${label} contains U+FFFD; a character was lost, not merely misencoded`
    );
  }
});
