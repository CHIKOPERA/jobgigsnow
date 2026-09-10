import { test } from "node:test";
import assert from "node:assert/strict";
import { hasExpiredJsonLdDeadline, isExpiredClosingDate } from "../job-expiration";

const noon = new Date("2026-09-10T12:00:00.000Z");

test("keeps a date-only deadline open for the full advertised day", () => {
  assert.equal(isExpiredClosingDate("2026-09-10", noon), false);
  assert.equal(isExpiredClosingDate("2026-09-09", noon), true);
});

test("uses the exact instant when a deadline contains a time", () => {
  assert.equal(isExpiredClosingDate("2026-09-10T11:59:00Z", noon), true);
  assert.equal(isExpiredClosingDate("2026-09-10T12:01:00Z", noon), false);
});

test("only expires JSON-LD when every advertised deadline has passed", () => {
  assert.equal(hasExpiredJsonLdDeadline([{ validThrough: "2026-09-09" }], noon), true);
  assert.equal(hasExpiredJsonLdDeadline([{ validThrough: "2026-09-09" }, { validThrough: "2026-09-11" }], noon), false);
  assert.equal(hasExpiredJsonLdDeadline([{ endDate: "2020-01-01" }], noon), false);
});
