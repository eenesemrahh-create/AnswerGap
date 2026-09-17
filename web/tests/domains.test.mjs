// Run with `npm test`. Node strips the TypeScript types itself, so the pure
// helpers in lib/ need no build step and no test framework.
import { test } from "node:test";
import assert from "node:assert/strict";
import { citesSite, isCited, normalizeSite } from "../lib/domains.ts";

test("whatever people paste reduces to the hostname", () => {
  for (const input of [
    "example.com",
    "Example.COM",
    "www.example.com",
    "https://www.example.com/",
    "http://example.com/blog/post?x=1#top",
    "  example.com  ",
    "example.com:8080",
    "example.com.",
  ]) {
    assert.equal(normalizeSite(input), "example.com", input);
  }
});

test("a subdomain the user typed is kept", () => {
  assert.equal(
    normalizeSite("https://health.clevelandclinic.org/x"),
    "health.clevelandclinic.org"
  );
});

test("country-code and non-ASCII domains are accepted", () => {
  assert.equal(normalizeSite("www.medicana.com.tr"), "medicana.com.tr");
  assert.equal(normalizeSite("diş.com.tr"), "diş.com.tr");
});

test("things that are not a domain are refused", () => {
  for (const input of ["", "   ", "example", "not a domain.com", "https://", "a..com"]) {
    assert.equal(normalizeSite(input), null, JSON.stringify(input));
  }
});

test("a source matches its site and the site's subdomains", () => {
  assert.equal(citesSite("www.medicana.com.tr", "medicana.com.tr"), true);
  assert.equal(citesSite("medipol.com.tr", "medipol.com.tr"), true);
  assert.equal(citesSite("my.clevelandclinic.org", "clevelandclinic.org"), true);
  assert.equal(citesSite("WWW.Colgate.com", "colgate.com"), true);
});

test("a lookalike domain is NOT the site", () => {
  // Suffix matching without the dot would credit these to someone else.
  assert.equal(citesSite("notcolgate.com", "colgate.com"), false);
  assert.equal(citesSite("colgate.com.evil.io", "colgate.com"), false);
});

test("a subdomain asks about itself only", () => {
  const site = "health.clevelandclinic.org";
  assert.equal(citesSite("health.clevelandclinic.org", site), true);
  assert.equal(citesSite("my.clevelandclinic.org", site), false);
  assert.equal(citesSite("clevelandclinic.org", site), false);
});

test("isCited looks across every source of a question", () => {
  const sources = ["www.reddit.com", "my.clevelandclinic.org"];
  assert.equal(isCited(sources, "clevelandclinic.org"), true);
  assert.equal(isCited(sources, "colgate.com"), false);
  assert.equal(isCited([], "colgate.com"), false);
});
