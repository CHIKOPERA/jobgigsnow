import assert from "node:assert/strict";
import test from "node:test";
import { aggregatedJobStatus } from "../review-policy";

test("jobs are staged until automatic publication finishes", () => {
  assert.equal(aggregatedJobStatus, "READY");
  assert.notEqual(aggregatedJobStatus as string, "PUBLISHED");
});
