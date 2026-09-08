import assert from "node:assert/strict";
import test from "node:test";
import { groupFailures, type FailureForGrouping } from "../issue-groups";

test("groups repeated source errors and counts distinct affected jobs", () => {
  const base = {
    stage: "AGGREGATION",
    message: "Invalid   response schema",
    url: "https://example.com/job",
    createdAt: new Date("2026-09-08T18:00:00Z"),
    status: "RETRYING" as const,
    ingestRun: { sourceId: "source-1", source: { name: "Example Careers" } },
  };
  const rows: FailureForGrouping[] = [
    { ...base, id: "failure-1", rawJobId: "job-1" },
    { ...base, id: "failure-2", rawJobId: "job-1", status: "OPEN" },
    { ...base, id: "failure-3", rawJobId: "job-2" },
  ];

  const [group] = groupFailures(rows);
  assert.equal(groupFailures(rows).length, 1);
  assert.equal(group.affectedCount, 2);
  assert.equal(group.eventCount, 3);
  assert.equal(group.status, "OPEN");
  assert.equal(group.message, "Invalid response schema");
});
