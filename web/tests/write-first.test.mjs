import assert from "node:assert/strict";
import { test } from "node:test";
import { writeFirst } from "../lib/write-first.ts";

const node = (question, over = {}) => ({
  question,
  status: "gap",
  depth: 1,
  results_checked: 8,
  matching_pages: 0,
  repeat_count: 1,
  ...over,
});

test("only checked gaps are listed, never the seed", () => {
  const list = writeFirst([
    node("seed", { depth: 0 }),
    node("unknown", { status: "no_data", results_checked: 0 }),
    node("unchecked", { results_checked: 0 }),
    node("covered", { status: "covered" }),
    node("real"),
  ]);
  assert.deepEqual(list.map((n) => n.question), ["real"]);
});

test("fewest pages, then most branches, then closest to the seed", () => {
  const list = writeFirst([
    node("one page", { matching_pages: 1, repeat_count: 9 }),
    node("deep", { depth: 4 }),
    node("branches", { repeat_count: 3, depth: 5 }),
    node("shallow", { depth: 2 }),
  ]);
  assert.deepEqual(list.map((n) => n.question), ["branches", "shallow", "deep", "one page"]);
});

test("the input is left in its own order", () => {
  const input = [node("b", { depth: 2 }), node("a")];
  writeFirst(input);
  assert.equal(input[0].question, "b");
});
