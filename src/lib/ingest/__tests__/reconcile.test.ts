import { test } from "node:test";
import assert from "node:assert/strict";
import { reconcile } from "../reconcile";
import type { ReconciledFields } from "../types";

test("prefers jsonld over selectors over general_html over readability", () => {
  const result = reconcile(
    { title: { value: "From Readability", source: "readability", confidence: 0.4 } },
    { title: { value: "From GeneralHtml", source: "general_html", confidence: 0.5 } },
    { title: { value: "From Selectors", source: "selectors", confidence: 0.85 } },
    { title: { value: "From JsonLd", source: "jsonld", confidence: 0.95 } },
  );
  assert.equal(result.title?.value, "From JsonLd");
});

test("order of arguments doesn't matter — tier rank decides, not arrival order", () => {
  const result = reconcile(
    { title: { value: "From JsonLd", source: "jsonld", confidence: 0.95 } },
    { title: { value: "From Selectors", source: "selectors", confidence: 0.85 } },
  );
  assert.equal(result.title?.value, "From JsonLd");
});

test("falls back to a lower tier when a higher tier has no candidate for that field", () => {
  const result = reconcile(
    { company: { value: "Northwind", source: "general_html", confidence: 0.5 } },
    { title: { value: "Forklift Operator", source: "jsonld", confidence: 0.95 } },
  );
  assert.equal(result.title?.value, "Forklift Operator");
  assert.equal(result.company?.value, "Northwind");
});

test("fields with no candidate from any tier are null", () => {
  const result = reconcile({ title: { value: "Forklift Operator", source: "jsonld", confidence: 0.95 } });
  const untouched: (keyof ReconciledFields)[] = [
    "company",
    "location",
    "description",
    "applyUrl",
    "salaryText",
    "postedAtText",
  ];
  for (const key of untouched) assert.equal(result[key], null);
});

test("handles being called with no candidate sets at all", () => {
  const result = reconcile();
  assert.equal(result.title, null);
});
