import { test } from "node:test";
import assert from "node:assert/strict";
import { careerSources } from "@/config/career-sources";
import { createSourceSchema } from "@/lib/validation/source";

test("the requested career-source catalogue contains 20 valid, unique sources", () => {
  assert.equal(careerSources.length, 20);
  assert.equal(new Set(careerSources.map((source) => source.baseUrl)).size, 20);
  for (const source of careerSources) assert.doesNotThrow(() => createSourceSchema.parse(source));
});
