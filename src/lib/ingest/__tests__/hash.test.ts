import { test } from "node:test";
import assert from "node:assert/strict";
import { hashAggregationInput, hashReconciledFields } from "../hash";
import type { ReconciledFields } from "../types";

function fields(overrides: Partial<Record<keyof ReconciledFields, string>> = {}): ReconciledFields {
  const base: ReconciledFields = {
    title: null,
    company: null,
    location: null,
    description: null,
    applyUrl: null,
    salaryText: null,
    postedAtText: null,
  };
  for (const [key, value] of Object.entries(overrides)) {
    base[key as keyof ReconciledFields] = { value, source: "jsonld", confidence: 0.95 };
  }
  return base;
}

test("is deterministic for identical reconciled fields", () => {
  const a = hashReconciledFields(fields({ title: "Forklift Operator", company: "Northwind" }));
  const b = hashReconciledFields(fields({ title: "Forklift Operator", company: "Northwind" }));
  assert.equal(a, b);
});

test("changes when a field's value changes", () => {
  const before = hashReconciledFields(fields({ title: "Forklift Operator" }));
  const after = hashReconciledFields(fields({ title: "Forklift Operator II" }));
  assert.notEqual(before, after);
});

test("is independent of which extraction tier produced the value", () => {
  const jsonld = hashReconciledFields(fields({ title: "Forklift Operator" }));
  const allNull = fields();
  allNull.title = { value: "Forklift Operator", source: "readability", confidence: 0.4 };
  assert.equal(jsonld, hashReconciledFields(allNull));
});

test("does not collide across an obviously different job", () => {
  const a = hashReconciledFields(fields({ title: "Forklift Operator", location: "Austin, TX" }));
  const b = hashReconciledFields(fields({ title: "Warehouse Associate", location: "Dallas, TX" }));
  assert.notEqual(a, b);
});

test("aggregation hash changes when AI-visible page context changes", () => {
  const reconciled = fields({ title: "Forklift Operator" });
  const before = hashAggregationInput(reconciled, "Applications close 1 September.");
  const after = hashAggregationInput(reconciled, "Applications close 15 September.");
  assert.notEqual(before, after);
});

test("aggregation hash ignores context-only whitespace changes", () => {
  const reconciled = fields({ title: "Forklift Operator" });
  const compact = hashAggregationInput(reconciled, "Applications close 1 September.");
  const spaced = hashAggregationInput(reconciled, " Applications\n  close 1 September. ");
  assert.equal(compact, spaced);
});
