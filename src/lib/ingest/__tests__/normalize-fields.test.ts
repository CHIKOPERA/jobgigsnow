import { test } from "node:test";
import assert from "node:assert/strict";
import { buildNormalizedFields } from "../normalize-fields";
import type { AggregationResult, NormalizedJobFields } from "../types";

const URL = "https://example.com/jobs/8842";

function normalized(overrides: Partial<NormalizedJobFields> = {}): NormalizedJobFields {
  return {
    externalId: URL,
    sourceUrl: URL,
    title: "Forklift Operator",
    company: "Northwind Logistics",
    location: "Austin, TX",
    remoteType: "ONSITE",
    employmentType: "FULL_TIME",
    salaryMin: null,
    salaryMax: null,
    salaryCurrency: null,
    salaryPeriod: null,
    description: "Lift things safely.",
    skills: [],
    postedAt: null,
    closesAt: null,
    applyUrl: null,
    ...overrides,
  };
}

function aggregation(overrides: Partial<NormalizedJobFields> = {}): AggregationResult {
  return { normalized: normalized(overrides), fieldConfidence: {}, fieldSource: {} };
}

test("builds valid fields when every required field is present", () => {
  const result = buildNormalizedFields(aggregation(), URL);
  assert.equal(result.ok, true);
  if (result.ok) {
    assert.equal(result.fields.title, "Forklift Operator");
    assert.equal(result.fields.companyName, "Northwind Logistics");
  }
});

test("reports every missing required field, not just the first", () => {
  const result = buildNormalizedFields(aggregation({ title: null, company: null, remoteType: null }), URL);
  assert.equal(result.ok, false);
  if (!result.ok) {
    assert.deepEqual(result.missingFields.slice().sort(), ["company", "remoteType", "title"]);
  }
});

test("falls back to the source URL as applyUrl when nothing was found or inferred", () => {
  const result = buildNormalizedFields(aggregation({ applyUrl: null }), URL);
  assert.equal(result.ok, true);
  if (result.ok) assert.equal(result.fields.applyUrl, URL);
});

test("keeps an explicit applyUrl over the source-URL fallback", () => {
  const result = buildNormalizedFields(aggregation({ applyUrl: "https://northwind.example/apply/8842" }), URL);
  assert.equal(result.ok, true);
  if (result.ok) assert.equal(result.fields.applyUrl, "https://northwind.example/apply/8842");
});

test("converts a date-only postedAt into a full ISO datetime", () => {
  const result = buildNormalizedFields(aggregation({ postedAt: "2026-08-01" }), URL);
  assert.equal(result.ok, true);
  if (result.ok) assert.equal(result.fields.postedAt, "2026-08-01T00:00:00.000Z");
});

test("treats an unparseable date as null instead of throwing", () => {
  assert.doesNotThrow(() => buildNormalizedFields(aggregation({ postedAt: "not a date" }), URL));
  const result = buildNormalizedFields(aggregation({ postedAt: "not a date" }), URL);
  assert.equal(result.ok, true);
  if (result.ok) assert.equal(result.fields.postedAt, null);
});

test("nulls salaryMax/salaryCurrency together with a null salaryMin", () => {
  const result = buildNormalizedFields(
    aggregation({ salaryMin: null, salaryMax: 60_000, salaryCurrency: "USD" }),
    URL,
  );
  assert.equal(result.ok, true);
  if (result.ok) {
    assert.equal(result.fields.salaryMax, null);
    assert.equal(result.fields.salaryCurrency, null);
  }
});

test("keeps salaryMax/salaryCurrency when salaryMin is present", () => {
  const result = buildNormalizedFields(
    aggregation({ salaryMin: 50_000, salaryMax: 60_000, salaryCurrency: "USD" }),
    URL,
  );
  assert.equal(result.ok, true);
  if (result.ok) {
    assert.equal(result.fields.salaryMax, 60_000);
    assert.equal(result.fields.salaryCurrency, "USD");
  }
});

test("maps skills straight through to tags", () => {
  const result = buildNormalizedFields(aggregation({ skills: ["forklift", "safety"] }), URL);
  assert.equal(result.ok, true);
  if (result.ok) assert.deepEqual(result.fields.tags, ["forklift", "safety"]);
});
