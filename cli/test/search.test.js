import assert from "node:assert/strict";
import { describe, it } from "node:test";

import { search, formatResults } from "../src/commands/search.js";

// These run against the real dist/ bundle (built via `npm run build` before
// `npm test`, same as add.test.js relies on for its file checks), so they
// double as an integration check that the registry actually contains what
// the assertions expect.

describe("search", () => {
  it("throws on an empty query", () => {
    assert.throws(() => search(""), /needs a query/);
    assert.throws(() => search("   "), /needs a query/);
  });

  it("finds a showpiece by exact name", () => {
    const results = search("macbook-scroll");
    assert.ok(results.length >= 1);
    assert.equal(results[0].name, "macbook-scroll");
    assert.equal(results[0].kind, "showpiece");
  });

  it("finds a showpiece by alias, case-insensitively", () => {
    const results = search("Laptop Opening");
    assert.ok(results.some((r) => r.name === "macbook-scroll"));
  });

  it("finds a fallback entry", () => {
    const results = search("button");
    assert.ok(results.some((r) => r.name === "button" && r.kind === "fallback"));
  });

  it("requires every query term to match (AND, not OR)", () => {
    const broad = search("card");
    const narrowed = search("card zzz_no_such_term_zzz");
    assert.ok(broad.length > 0);
    assert.equal(narrowed.length, 0);
  });

  it("ranks a name/alias match above a mere effect-prose match", () => {
    const results = search("scroll");
    assert.ok(results.length > 1);
    // "macbook-scroll" matches by name; something matching only via `effect`
    // text containing "scroll" should not outrank it.
    assert.equal(results[0].name, "macbook-scroll");
  });

  it("--library restricts to one source library", () => {
    const results = search("card", { library: "cult-ui" });
    assert.ok(results.length > 0);
    assert.ok(results.every((r) => r.library === "cult-ui"));
  });

  it("--library with no matches in that library returns empty", () => {
    const results = search("macbook-scroll", { library: "shadcn" });
    assert.equal(results.length, 0);
  });

  it("returns no matches for nonsense input", () => {
    const results = search("zzz_definitely_not_a_component_zzz");
    assert.equal(results.length, 0);
  });
});

describe("formatResults", () => {
  it("reports no matches", () => {
    assert.match(formatResults([]), /No matches/);
  });

  it("includes name, kind/library tag, and aliases", () => {
    const results = search("macbook-scroll");
    const out = formatResults(results);
    assert.match(out, /macbook-scroll/);
    assert.match(out, /\[showpiece\/aceternity\]/);
    assert.match(out, /aliases:/);
  });
});
