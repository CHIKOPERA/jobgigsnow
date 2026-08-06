import { test } from "node:test";
import assert from "node:assert/strict";
import { toAggregationResult, type AiOutput } from "../aggregate-merge";
import type { ReconciledFields } from "../types";

const URL = "https://example.com/jobs/8842";

function reconciled(overrides: Partial<ReconciledFields> = {}): ReconciledFields {
  return {
    title: null,
    company: null,
    location: null,
    description: null,
    applyUrl: null,
    salaryText: null,
    postedAtText: null,
    ...overrides,
  };
}

function aiOutput(overrides: Partial<AiOutput> = {}): AiOutput {
  return {
    title: null,
    company: null,
    location: null,
    description: null,
    applyUrl: null,
    remoteType: null,
    employmentType: null,
    salaryMin: null,
    salaryMax: null,
    salaryCurrency: null,
    salaryPeriod: null,
    skills: [],
    postedAt: null,
    closesAt: null,
    inferredFieldConfidence: {
      remoteType: 0,
      employmentType: 0,
      salaryMin: 0,
      salaryPeriod: 0,
      postedAt: 0,
      closesAt: 0,
      skills: 0,
    },
    ...overrides,
  };
}

test("keeps the deterministic candidate's source/confidence when the AI agrees", () => {
  const result = toAggregationResult(
    URL,
    reconciled({ title: { value: "Forklift Operator", source: "jsonld", confidence: 0.95 } }),
    aiOutput({ title: "Forklift Operator" }),
  );
  assert.equal(result.normalized.title, "Forklift Operator");
  assert.equal(result.fieldSource.title, "jsonld");
  assert.equal(result.fieldConfidence.title, 0.95);
});

test("tags an AI override of a deterministic value as ai_inference", () => {
  const result = toAggregationResult(
    URL,
    reconciled({ title: { value: "Forklift Op.", source: "general_html", confidence: 0.5 } }),
    aiOutput({ title: "Forklift Operator" }),
  );
  assert.equal(result.normalized.title, "Forklift Operator");
  assert.equal(result.fieldSource.title, "ai_inference");
});

test("fills a gap the deterministic tiers missed and tags it ai_inference", () => {
  const result = toAggregationResult(URL, reconciled(), aiOutput({ company: "Northwind Logistics" }));
  assert.equal(result.normalized.company, "Northwind Logistics");
  assert.equal(result.fieldSource.company, "ai_inference");
});

test("leaves a base field null with no source/confidence entry when nothing supports it", () => {
  const result = toAggregationResult(URL, reconciled(), aiOutput());
  assert.equal(result.normalized.location, null);
  assert.equal("location" in result.fieldSource, false);
  assert.equal("location" in result.fieldConfidence, false);
});

test("never invent guard: nulls an inferred field below the minimum confidence threshold", () => {
  const result = toAggregationResult(
    URL,
    reconciled(),
    aiOutput({ remoteType: "REMOTE", inferredFieldConfidence: { ...aiOutput().inferredFieldConfidence, remoteType: 0.2 } }),
  );
  assert.equal(result.normalized.remoteType, null);
  assert.equal("remoteType" in result.fieldSource, false);
});

test("keeps an inferred field at or above the minimum confidence threshold", () => {
  const result = toAggregationResult(
    URL,
    reconciled(),
    aiOutput({ remoteType: "REMOTE", inferredFieldConfidence: { ...aiOutput().inferredFieldConfidence, remoteType: 0.8 } }),
  );
  assert.equal(result.normalized.remoteType, "REMOTE");
  assert.equal(result.fieldSource.remoteType, "ai_inference");
  assert.equal(result.fieldConfidence.remoteType, 0.8);
});

test("salaryMax/salaryCurrency ride along with salaryMin and are nulled together with it", () => {
  const low = toAggregationResult(
    URL,
    reconciled(),
    aiOutput({
      salaryMin: 50_000,
      salaryMax: 60_000,
      salaryCurrency: "USD",
      inferredFieldConfidence: { ...aiOutput().inferredFieldConfidence, salaryMin: 0.1 },
    }),
  );
  assert.equal(low.normalized.salaryMin, null);
  assert.equal(low.normalized.salaryMax, null);
  assert.equal(low.normalized.salaryCurrency, null);

  const high = toAggregationResult(
    URL,
    reconciled(),
    aiOutput({
      salaryMin: 50_000,
      salaryMax: 60_000,
      salaryCurrency: "USD",
      inferredFieldConfidence: { ...aiOutput().inferredFieldConfidence, salaryMin: 0.9 },
    }),
  );
  assert.equal(high.normalized.salaryMin, 50_000);
  assert.equal(high.normalized.salaryMax, 60_000);
  assert.equal(high.normalized.salaryCurrency, "USD");
});

test("empty skills array is treated as no inference, not a confident empty result", () => {
  const result = toAggregationResult(
    URL,
    reconciled(),
    aiOutput({ skills: [], inferredFieldConfidence: { ...aiOutput().inferredFieldConfidence, skills: 0.9 } }),
  );
  assert.deepEqual(result.normalized.skills, []);
  assert.equal("skills" in result.fieldSource, false);
});

test("sourceUrl and externalId both default to the page URL", () => {
  const result = toAggregationResult(URL, reconciled(), aiOutput());
  assert.equal(result.normalized.sourceUrl, URL);
  assert.equal(result.normalized.externalId, URL);
});
