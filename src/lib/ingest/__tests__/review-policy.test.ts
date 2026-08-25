import assert from "node:assert/strict";
import test from "node:test";
import { aggregatedJobStatus, hasRequiredSocialImage } from "../review-policy";

test("automatically aggregated jobs wait in the editorial review queue", () => {
  assert.equal(aggregatedJobStatus, "READY");
  assert.notEqual(aggregatedJobStatus as string, "PUBLISHED");
});

test("publishing requires a non-empty stored social image URL", () => {
  assert.equal(hasRequiredSocialImage("https://cdn.example/jobs/image.jpg"), true);
  assert.equal(hasRequiredSocialImage(null), false);
  assert.equal(hasRequiredSocialImage(undefined), false);
  assert.equal(hasRequiredSocialImage("   "), false);
});
