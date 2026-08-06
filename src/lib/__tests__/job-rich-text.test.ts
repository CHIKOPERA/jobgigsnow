import { test } from "node:test";
import assert from "node:assert/strict";
import { sanitizeJobDescription, toEditorHtml } from "../job-rich-text";

test("sanitizes scripts and unsafe attributes from reviewed descriptions", () => {
  const result = sanitizeJobDescription('<p onclick="bad()">Hello</p><script>alert(1)</script>');
  assert.equal(result, "<p>Hello</p>");
});

test("keeps safe formatting and hardens external links", () => {
  const result = sanitizeJobDescription('<h2>Role</h2><a href="https://example.com">Apply</a>');
  assert.match(result, /<h2>Role<\/h2>/);
  assert.match(result, /rel="noopener noreferrer"/);
  assert.match(result, /target="_blank"/);
});

test("converts legacy plain text descriptions into editor paragraphs", () => {
  assert.equal(toEditorHtml("First line\nsecond line\n\nNext"), "<p>First line<br>second line</p><p>Next</p>");
});
