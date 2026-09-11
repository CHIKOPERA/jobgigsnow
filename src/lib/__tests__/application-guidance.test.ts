import { test } from "node:test";
import assert from "node:assert/strict";
import {
  cleanApplicationGuidance,
  EMPTY_APPLICATION_GUIDANCE,
  hasApplicationGuidance,
} from "../application-guidance";

test("cleans whitespace, blank items and duplicates", () => {
  const result = cleanApplicationGuidance({
    ...EMPTY_APPLICATION_GUIDANCE,
    summary: "  Show customer-service evidence. ",
    experience: [" Two years in retail ", "", "Two years in retail"],
  });

  assert.equal(result.summary, "Show customer-service evidence.");
  assert.deepEqual(result.experience, ["Two years in retail"]);
});

test("treats an empty structure as absent", () => {
  assert.equal(hasApplicationGuidance(EMPTY_APPLICATION_GUIDANCE), false);
  assert.equal(hasApplicationGuidance({ ...EMPTY_APPLICATION_GUIDANCE, referenceNumber: "FIN-2048" }), true);
});
