import assert from "node:assert/strict";
import test from "node:test";
import { selectDueSourceIds } from "../source-schedule";

test("checks never-run sources before higher-priority recrawls", () => {
  const now = new Date("2026-09-10T12:00:00.000Z");
  const ids = selectDueSourceIds([
    { id: "known", cadenceMinutes: 60, lastRunAt: new Date("2026-09-10T10:00:00.000Z"), agentPriority: 100 },
    { id: "new-low", cadenceMinutes: 60, lastRunAt: null, agentPriority: 1 },
    { id: "new-high", cadenceMinutes: 60, lastRunAt: null, agentPriority: 2 },
    { id: "not-due", cadenceMinutes: 60, lastRunAt: new Date("2026-09-10T11:30:00.000Z"), agentPriority: 200 },
  ], now.getTime(), 3);

  assert.deepEqual(ids, ["new-high", "new-low", "known"]);
});

test("reserves a daily discovery slot for the least recently checked due source", () => {
  const now = new Date("2026-09-10T12:00:00.000Z");
  const ids = selectDueSourceIds([
    { id: "priority-one", cadenceMinutes: 60, lastRunAt: new Date("2026-09-10T10:00:00.000Z"), agentPriority: 100 },
    { id: "priority-two", cadenceMinutes: 60, lastRunAt: new Date("2026-09-10T09:00:00.000Z"), agentPriority: 90 },
    { id: "oldest", cadenceMinutes: 60, lastRunAt: new Date("2026-09-01T10:00:00.000Z"), agentPriority: 1 },
  ], now.getTime(), 2);

  assert.deepEqual(ids, ["priority-one", "oldest"]);
});
