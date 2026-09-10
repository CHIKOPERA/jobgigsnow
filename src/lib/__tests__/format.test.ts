import { test } from "node:test";
import assert from "node:assert/strict";
import { daysLeftLabel, formatSalary } from "../format";

function isoDaysFromNow(days: number): string {
  return new Date(Date.now() + days * 86_400_000).toISOString();
}

test("returns null when there's no deadline", () => {
  assert.equal(daysLeftLabel(null), null);
});

test("returns null when the deadline has already passed", () => {
  assert.equal(daysLeftLabel(isoDaysFromNow(-2)), null);
});

test("singular label for exactly one day left", () => {
  assert.equal(daysLeftLabel(isoDaysFromNow(1)), "1 day left");
});

test("plural label for multiple days left", () => {
  assert.equal(daysLeftLabel(isoDaysFromNow(5)), "5 days left");
});

test("returns null beyond the 30-day urgency window", () => {
  assert.equal(daysLeftLabel(isoDaysFromNow(45)), null);
});

test("30 days left is still shown, at the boundary", () => {
  assert.equal(daysLeftLabel(isoDaysFromNow(30)), "30 days left");
});

test("formats South African salaries in Rand with their advertised period", () => {
  assert.equal(formatSalary(25_000, 35_000, "ZAR", "MONTHLY"), "R25 000–35 000/month");
});
