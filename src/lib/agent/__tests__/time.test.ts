import { test } from "node:test";
import assert from "node:assert/strict";
import { johannesburgDateKey, johannesburgDayBounds } from "../time";

test("daily goal boundaries use South African time when UTC is on the previous day", () => {
  const instant = new Date("2026-09-08T22:30:00.000Z");
  const bounds = johannesburgDayBounds(instant);

  assert.equal(johannesburgDateKey(instant), "2026-09-09");
  assert.equal(bounds.start.toISOString(), "2026-09-08T22:00:00.000Z");
  assert.equal(bounds.end.toISOString(), "2026-09-09T22:00:00.000Z");
});
