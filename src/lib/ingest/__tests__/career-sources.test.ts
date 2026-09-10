import { test } from "node:test";
import assert from "node:assert/strict";
import { careerSources } from "@/config/career-sources";
import { createSourceSchema } from "@/lib/validation/source";

test("the requested career-source catalogue contains 31 valid, unique sources", () => {
  assert.equal(careerSources.length, 31);
  assert.equal(new Set(careerSources.map((source) => source.baseUrl)).size, 31);
  for (const source of careerSources) assert.doesNotThrow(() => createSourceSchema.parse(source));
});

test("the expanded catalogue omits rejected or technically unsuitable candidates", () => {
  const names = new Set(careerSources.map((source) => source.name));
  for (const excluded of [
    "Careers Portal Apprenticeships",
    "SETAJobs",
    "National Treasury Graduate Recruitment",
    "SAYAS Opportunities",
    "Sanlam Careers",
  ]) {
    assert.equal(names.has(excluded), false);
  }
});
