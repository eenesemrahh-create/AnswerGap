import test from "node:test";
import assert from "node:assert/strict";

import {
  FRAME_FOOTER,
  FRAME_HEADER,
  FRAME_MIN_WIDTH,
  framedSize,
  frameLegendLabels,
  isTransparent,
} from "../lib/png.ts";

const LABELS = {
  gap: "Unanswered",
  weak: "Barely answered",
  covered: "Well answered",
  no_data: "Not checked",
};

test("an unframed export is exactly the tree", () => {
  assert.deepEqual(framedSize({ width: 900, height: 400, background: "#fff" }), {
    width: 900,
    height: 400,
  });
});

test("a frame adds its header and footer, and never narrows a wide tree", () => {
  const frame = {};
  assert.deepEqual(framedSize({ width: 2000, height: 400, background: "#fff", frame }), {
    width: 2000,
    height: 400 + FRAME_HEADER + FRAME_FOOTER,
  });
});

test("a tiny tree is widened so the header and key do not collide", () => {
  const size = framedSize({ width: 300, height: 120, background: "#fff", frame: {} });
  assert.equal(size.width, FRAME_MIN_WIDTH);
});

test("the key lists every status in a fixed order, zero included", () => {
  // A key that drops a colour reads as "that colour cannot occur".
  assert.deepEqual(frameLegendLabels(LABELS, { gap: 7, no_data: 28, weak: 3 }), [
    "Unanswered 7",
    "Barely answered 3",
    "Well answered 0",
    "Not checked 28",
  ]);
});

test("transparent colours are recognised in every spelling a browser returns", () => {
  for (const c of ["transparent", "rgba(0, 0, 0, 0)", "rgba(255,255,255,0)", ""]) {
    assert.equal(isTransparent(c), true, c);
  }
  for (const c of ["rgb(19, 18, 16)", "rgba(0, 0, 0, 0.5)", "#fff"]) {
    assert.equal(isTransparent(c), false, c);
  }
});
