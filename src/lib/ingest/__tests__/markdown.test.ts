import { test } from "node:test";
import assert from "node:assert/strict";
import { extractMarkdown } from "../extractors/markdown";

test("converts basic HTML structure to Markdown", () => {
  const html = "<h1>Forklift Operator</h1><p>Great <strong>benefits</strong>.</p>";
  const markdown = extractMarkdown(html);
  assert.ok(markdown?.includes("# Forklift Operator"));
  assert.ok(markdown?.includes("**benefits**"));
});

test("returns null for empty input instead of an empty string", () => {
  assert.equal(extractMarkdown(""), null);
  assert.equal(extractMarkdown("   "), null);
});
