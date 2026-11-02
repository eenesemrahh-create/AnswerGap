import assert from "node:assert/strict";
import { test } from "node:test";
import { marketName } from "../lib/market.ts";

test("the country is named in the reader's language", () => {
  const tree = { location_name: "United States", location_iso: "US" };
  assert.equal(marketName(tree, "en-US"), "United States");
  assert.equal(marketName(tree, "de-DE"), "Vereinigte Staaten");
});

test("the API's name stands in for a code that cannot be read", () => {
  assert.equal(marketName({ location_name: "Somewhere", location_iso: "not a code" }, "en-US"), "Somewhere");
  assert.equal(marketName({ location_name: "Somewhere" }, "en-US"), "Somewhere");
});

test("an unknown market shows nothing", () => {
  assert.equal(marketName({}, "en-US"), "");
});
