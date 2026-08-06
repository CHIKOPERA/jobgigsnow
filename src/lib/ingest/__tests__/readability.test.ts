import { test } from "node:test";
import assert from "node:assert/strict";
import { extractReadable, readabilityToCandidates } from "../extractors/readability";

const PAGE_URL = "https://example.com/jobs/8842";

test("extracts the main readable text from a content-heavy page", () => {
  const html = `<html><body>
    <nav>Home / Jobs / Careers</nav>
    <article>
      <h1>Forklift Operator</h1>
      <p>We are looking for an experienced forklift operator to join our warehouse team on the
      night shift. Responsibilities include loading and unloading trucks, maintaining inventory
      accuracy, and following all safety procedures at all times during every shift.</p>
      <p>Requirements include a valid forklift certification and at least two years of relevant
      warehouse experience in a fast-paced distribution environment.</p>
    </article>
    <footer>Copyright 2026</footer>
  </body></html>`;

  const result = extractReadable(html, PAGE_URL);

  assert.ok(result.text && result.text.includes("forklift operator"));
});

test("returns nulls instead of throwing on unparseable input", () => {
  assert.doesNotThrow(() => extractReadable("<html", PAGE_URL));
  const result = extractReadable("", PAGE_URL);
  assert.equal(result.text, null);
});

test("readabilityToCandidates tags its output as the readability tier with low confidence", () => {
  const candidates = readabilityToCandidates({ text: "Some content", title: null });
  assert.equal(candidates.description?.source, "readability");
  assert.ok(candidates.description!.confidence < 0.5);
});

test("readabilityToCandidates returns no candidates when there's no text", () => {
  const candidates = readabilityToCandidates({ text: null, title: null });
  assert.deepEqual(candidates, {});
});
