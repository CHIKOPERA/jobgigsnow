import { test } from "node:test";
import assert from "node:assert/strict";
import { extractMetadata, extractSelectorFields } from "../extractors/selectors";

const PAGE_URL = "https://example.com/jobs/8842";

test("prefers a source-specific selector over the general-HTML fallback", () => {
  const html = `<html><body>
    <h1>Generic Fallback Title</h1>
    <span class="posting-title">Forklift Operator</span>
  </body></html>`;

  const { fields, candidates } = extractSelectorFields(html, PAGE_URL, { title: ".posting-title" });

  assert.equal(fields.title, "Forklift Operator");
  assert.equal(candidates.title?.source, "selectors");
  assert.equal(candidates.title?.confidence, 0.85);
});

test("falls back to a general selector when no source-specific selector is configured", () => {
  const html = `<html><body><h1>Warehouse Associate</h1></body></html>`;

  const { fields, candidates } = extractSelectorFields(html, PAGE_URL);

  assert.equal(fields.title, "Warehouse Associate");
  assert.equal(candidates.title?.source, "general_html");
  assert.equal(candidates.title?.confidence, 0.5);
});

test("falls back when the configured source-specific selector matches nothing", () => {
  const html = `<html><body><h1>Warehouse Associate</h1></body></html>`;

  const { fields } = extractSelectorFields(html, PAGE_URL, { title: ".does-not-exist" });

  assert.equal(fields.title, "Warehouse Associate");
});

test("resolves a relative apply-link href against the page URL", () => {
  const html = `<html><body><a href="/apply/now">Apply</a></body></html>`;

  const { fields } = extractSelectorFields(html, PAGE_URL);

  assert.equal(fields.applyUrl, "https://example.com/apply/now");
});

test("reads a <time datetime> attribute rather than its text content", () => {
  const html = `<html><body><time datetime="2026-08-01">Aug 1</time></body></html>`;

  const { fields } = extractSelectorFields(html, PAGE_URL);

  assert.equal(fields.postedAt, "2026-08-01");
});

test("extractMetadata resolves a relative canonical link against the page URL", () => {
  const html = `<html><head>
    <title>Forklift Operator | Northwind</title>
    <meta name="description" content="Great job">
    <link rel="canonical" href="/jobs/8842">
  </head></html>`;

  const metadata = extractMetadata(html, PAGE_URL);

  assert.equal(metadata.title, "Forklift Operator | Northwind");
  assert.equal(metadata.description, "Great job");
  assert.equal(metadata.canonicalUrl, "https://example.com/jobs/8842");
});
