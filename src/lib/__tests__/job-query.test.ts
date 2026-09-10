import { test } from "node:test";
import assert from "node:assert/strict";
import { buildJobWhere } from "../job-filters";
import type { JobListQuery } from "../validation/job";

function query(overrides: Partial<JobListQuery> = {}): JobListQuery {
  return { limit: 20, ...overrides };
}

test("always scopes to PUBLISHED jobs", () => {
  const where = buildJobWhere(query());
  assert.equal(where.status, "PUBLISHED");
});

test("q filters title/description case-insensitively", () => {
  const where = buildJobWhere(query({ q: "engineer" }));
  assert.deepEqual(where.AND, [{ OR: [
    { title: { contains: "engineer", mode: "insensitive" } },
    { description: { contains: "engineer", mode: "insensitive" } },
  ] }]);
});

test("location filters with a case-insensitive contains match", () => {
  const where = buildJobWhere(query({ location: "Austin" }));
  assert.deepEqual(where.location, { contains: "Austin", mode: "insensitive" });
});

test("category filters on an exact OpportunityCategory match", () => {
  const where = buildJobWhere(query({ category: "INTERNSHIP" }));
  assert.equal(where.category, "INTERNSHIP");
});

test("industry and province use exact normalized classifications", () => {
  const where = buildJobWhere(query({ industry: "TECHNOLOGY", province: "GAUTENG" }));
  assert.equal(where.industry, "TECHNOLOGY");
  assert.equal(where.province, "GAUTENG");
});

test("no category filter when unset", () => {
  const where = buildJobWhere(query());
  assert.equal("category" in where, false);
});

test("remote filters on an exact remoteType match", () => {
  const where = buildJobWhere(query({ remote: "REMOTE" }));
  assert.equal(where.remoteType, "REMOTE");
});

test("employmentType filters on an exact match", () => {
  const where = buildJobWhere(query({ employmentType: "FULL_TIME" }));
  assert.equal(where.employmentType, "FULL_TIME");
});

test("salaryMin compares a monthly Rand target across advertised pay periods", () => {
  const where = buildJobWhere(query({ salaryMin: 100_000 }));
  const salary = (where.AND as Array<Record<string, unknown>>)[0];
  assert.equal(salary.salaryCurrency, "ZAR");
  assert.deepEqual(salary.OR, [
    { salaryPeriod: "HOURLY", OR: [{ salaryMax: { gte: 579 } }, { salaryMax: null, salaryMin: { gte: 579 } }] },
    { salaryPeriod: "DAILY", OR: [{ salaryMax: { gte: 4615 } }, { salaryMax: null, salaryMin: { gte: 4615 } }] },
    { salaryPeriod: "WEEKLY", OR: [{ salaryMax: { gte: 23095 } }, { salaryMax: null, salaryMin: { gte: 23095 } }] },
    { salaryPeriod: "MONTHLY", OR: [{ salaryMax: { gte: 100_000 } }, { salaryMax: null, salaryMin: { gte: 100_000 } }] },
    { salaryPeriod: "YEARLY", OR: [{ salaryMax: { gte: 1_200_000 } }, { salaryMax: null, salaryMin: { gte: 1_200_000 } }] },
  ]);
});

test("tags filters jobs that have at least one matching tag", () => {
  const where = buildJobWhere(query({ tags: ["remote-friendly", "senior"] }));
  assert.deepEqual(where.tags, { some: { tag: { name: { in: ["remote-friendly", "senior"] } } } });
});

test("empty tags array is not applied as a filter", () => {
  const where = buildJobWhere(query({ tags: [] }));
  assert.equal(where.tags, undefined);
});

test("company filters on the company's slug", () => {
  const where = buildJobWhere(query({ company: "northwind-logistics" }));
  assert.deepEqual(where.company, { slug: "northwind-logistics" });
});

test("postedWithin filters postedAt within the last N days", () => {
  const before = Date.now();
  const where = buildJobWhere(query({ postedWithin: 7 }));
  const gte = (where.postedAt as { gte: Date }).gte;
  const daysAgo = (before - gte.getTime()) / 86_400_000;
  assert.ok(daysAgo >= 6.99 && daysAgo <= 7.01, `expected ~7 days, got ${daysAgo}`);
});

test("an empty query still excludes expired published jobs", () => {
  const where = buildJobWhere(query());
  assert.equal(where.status, "PUBLISHED");
  assert.deepEqual((where.OR as unknown[])[0], { closesAt: null });
  assert.ok(((where.OR as Array<{ closesAt?: { gte?: unknown } }>)[1].closesAt?.gte) instanceof Date);
});
