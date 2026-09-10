import assert from "node:assert/strict";
import test from "node:test";
import { classifyOpportunity } from "../opportunity-category";
import type { NormalizedJobFields } from "../types";

function listing(overrides: Partial<NormalizedJobFields> = {}): NormalizedJobFields {
  return {
    externalId: "listing-1",
    sourceUrl: "https://example.com/listing-1",
    title: "Administrator",
    company: "Example Org",
    location: "Johannesburg",
    industry: "OTHER",
    province: "GAUTENG",
    description: "<p>Applications are open for this position.</p>",
    applyUrl: "https://example.com/apply",
    remoteType: "ONSITE",
    employmentType: "FULL_TIME",
    salaryMin: null,
    salaryMax: null,
    salaryCurrency: null,
    salaryPeriod: null,
    skills: [],
    postedAt: null,
    closesAt: null,
    ...overrides,
  };
}

test("classifies an explicit internship title instead of the JOB fallback", () => {
  assert.equal(
    classifyOpportunity(listing({ title: "Student Internship: Public Housing Programme" })),
    "INTERNSHIP",
  );
});

test("uses the inferred internship employment type when the title is less explicit", () => {
  assert.equal(classifyOpportunity(listing({ title: "Student Programme", employmentType: "INTERNSHIP" })), "INTERNSHIP");
});

test("classifies each supported specialist opportunity type from its title", () => {
  assert.equal(classifyOpportunity(listing({ title: "Municipal Learnership 2027" })), "LEARNERSHIP");
  assert.equal(classifyOpportunity(listing({ title: "Electrician Apprenticeship" })), "APPRENTICESHIP");
  assert.equal(classifyOpportunity(listing({ title: "Engineering Graduate Programme" })), "GRADUATE_PROGRAMME");
  assert.equal(classifyOpportunity(listing({ title: "Call for Applications: Advisory Panel" })), "CALL_FOR_APPLICATIONS");
  assert.equal(classifyOpportunity(listing({ title: "Postgraduate Bursary 2027" })), "FUNDING");
});

test("specific categories take precedence over generic application language", () => {
  assert.equal(
    classifyOpportunity(listing({ title: "Call for Applications: Research Scholarship" })),
    "FUNDING",
  );
});

test("classifies strong description signals after stripping HTML", () => {
  assert.equal(
    classifyOpportunity(listing({ description: "<p>Apply for our paid internship in Johannesburg.</p>" })),
    "INTERNSHIP",
  );
});

test("does not treat incidental internship experience as the advertised category", () => {
  assert.equal(
    classifyOpportunity(listing({ description: "Prior internship experience is advantageous." })),
    "JOB",
  );
});

test("falls back to JOB when there is no specialist opportunity signal", () => {
  assert.equal(classifyOpportunity(listing()), "JOB");
});
