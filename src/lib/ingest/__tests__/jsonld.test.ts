import { test } from "node:test";
import assert from "node:assert/strict";
import { extractJsonLd, jsonLdToCandidates } from "../extractors/jsonld";

test("extracts a JobPosting object from a single ld+json script", () => {
  const html = `
    <html><head>
      <script type="application/ld+json">
        {"@context":"https://schema.org","@type":"JobPosting","title":"Forklift Operator",
         "hiringOrganization":{"@type":"Organization","name":"Northwind Logistics"},
         "jobLocation":{"@type":"Place","address":{"addressLocality":"Austin","addressRegion":"TX"}},
         "description":"<p>Lift things.</p>","datePosted":"2026-08-01",
         "baseSalary":{"@type":"MonetaryAmount","currency":"USD","value":{"@type":"QuantitativeValue","minValue":19,"maxValue":23,"unitText":"HOUR"}}}
      </script>
    </head><body></body></html>`;

  const postings = extractJsonLd(html);
  assert.equal(postings.length, 1);

  const candidates = jsonLdToCandidates(postings);
  assert.equal(candidates.title?.value, "Forklift Operator");
  assert.equal(candidates.title?.source, "jsonld");
  assert.equal(candidates.company?.value, "Northwind Logistics");
  assert.equal(candidates.location?.value, "Austin, TX");
  assert.equal(candidates.description?.value, "Lift things.");
  assert.equal(candidates.salaryText?.value, "USD 19-23 HOUR");
  assert.equal(candidates.postedAtText?.value, "2026-08-01");
});

test("ignores non-JobPosting ld+json blocks and finds JobPosting inside @graph", () => {
  const html = `
    <script type="application/ld+json">{"@type":"BreadcrumbList","itemListElement":[]}</script>
    <script type="application/ld+json">
      {"@graph":[{"@type":"WebPage"},{"@type":"JobPosting","title":"Warehouse Associate"}]}
    </script>`;

  const postings = extractJsonLd(html);
  assert.equal(postings.length, 1);
  assert.equal(postings[0].title, "Warehouse Associate");
});

test("skips malformed JSON without throwing", () => {
  const html = `<script type="application/ld+json">{not valid json</script>`;
  assert.doesNotThrow(() => extractJsonLd(html));
  assert.deepEqual(extractJsonLd(html), []);
});

test("jsonLdToCandidates keeps the first non-empty value when multiple postings are found", () => {
  const candidates = jsonLdToCandidates([
    { "@type": "JobPosting", title: "First" },
    { "@type": "JobPosting", title: "Second" },
  ]);
  assert.equal(candidates.title?.value, "First");
});
