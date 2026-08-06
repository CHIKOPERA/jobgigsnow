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
  assert.deepEqual(where.OR, [
    { title: { contains: "engineer", mode: "insensitive" } },
    { description: { contains: "engineer", mode: "insensitive" } },
  ]);
});

test("location filters with a case-insensitive contains match", () => {
  const where = buildJobWhere(query({ location: "Austin" }));
  assert.deepEqual(where.location, { contains: "Austin", mode: "insensitive" });
});

test("remote filters on an exact remoteType match", () => {
  const where = buildJobWhere(query({ remote: "REMOTE" }));
  assert.equal(where.remoteType, "REMOTE");
});

test("employmentType filters on an exact match", () => {
  const where = buildJobWhere(query({ employmentType: "FULL_TIME" }));
  assert.equal(where.employmentType, "FULL_TIME");
});

test("salaryMin matches jobs whose range clears the floor, including open-ended max", () => {
  const where = buildJobWhere(query({ salaryMin: 100_000 }));
  assert.deepEqual(where.OR, [
    { salaryMax: { gte: 100_000 } },
    { salaryMax: null, salaryMin: { gte: 100_000 } },
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

test("no filters beyond status when the query is empty", () => {
  const where = buildJobWhere(query());
  assert.deepEqual(where, { status: "PUBLISHED" });
});
