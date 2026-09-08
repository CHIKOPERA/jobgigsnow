import assert from "node:assert/strict";
import test from "node:test";
import {
  buildJobBreadcrumbSchema,
  buildJobMetaDescription,
  buildJobPostingSchema,
  buildSiteSchemas,
  plainTextDescription,
  serializeJsonLd,
  type JobSeoInput,
} from "../job-seo";

const job: JobSeoInput = {
  id: "job_123",
  slug: "senior-developer-acme",
  title: "Senior Developer",
  category: "JOB",
  companyName: "Acme",
  companyDomain: "acme.example",
  location: "South Africa",
  remoteType: "REMOTE",
  employmentType: "FULL_TIME",
  salaryMin: 800_000,
  salaryMax: 1_000_000,
  salaryCurrency: "ZAR",
  salaryPeriod: "YEARLY",
  description: "<p>Build useful products.</p>",
  postedAt: "2026-09-01T00:00:00.000Z",
  closesAt: "2026-10-01T00:00:00.000Z",
  applyUrl: "https://acme.example/jobs/123",
  isNative: false,
  socialImageUrl: "https://images.example/job.jpg",
};

test("builds Google JobPosting data for a remote salaried job", () => {
  const schema = buildJobPostingSchema(job, "https://jobgigsnow.co.za/");
  assert.ok(schema);
  assert.equal(schema["@type"], "JobPosting");
  assert.equal(schema.url, "https://jobgigsnow.co.za/jobs/senior-developer-acme");
  assert.equal(schema.employmentType, "FULL_TIME");
  assert.equal(schema.jobLocationType, "TELECOMMUTE");
  assert.deepEqual(schema.applicantLocationRequirements, { "@type": "Country", name: "South Africa" });
  assert.deepEqual(schema.baseSalary, {
    "@type": "MonetaryAmount",
    currency: "ZAR",
    value: { "@type": "QuantitativeValue", minValue: 800_000, maxValue: 1_000_000, unitText: "YEAR" },
  });
  assert.equal(schema.hiringOrganization.sameAs, "https://acme.example/");
  assert.equal(schema.directApply, false);
});

test("omits unsupported optional job fields rather than inventing values", () => {
  const schema = buildJobPostingSchema({
    ...job,
    remoteType: "ONSITE",
    closesAt: null,
    salaryMin: null,
    salaryMax: null,
    companyDomain: "not a domain",
    socialImageUrl: null,
  }, "https://jobgigsnow.co.za");
  assert.ok(schema);
  assert.equal("validThrough" in schema, false);
  assert.equal("baseSalary" in schema, false);
  assert.equal("jobLocationType" in schema, false);
  assert.equal("image" in schema, false);
});

test("does not add JobPosting markup to non-job opportunities or rows without a posting date", () => {
  assert.equal(buildJobPostingSchema({ ...job, category: "FUNDING" }, "https://jobgigsnow.co.za"), null);
  assert.equal(buildJobPostingSchema({ ...job, postedAt: null }, "https://jobgigsnow.co.za"), null);
});

test("builds concise plain-text metadata and breadcrumb data", () => {
  const description = buildJobMetaDescription(job);
  assert.ok(description.length <= 160);
  assert.match(description, /Senior Developer at Acme/);
  assert.match(description, /Remote/);
  assert.equal(plainTextDescription("<p>Hello <strong>world</strong>.</p>"), "Hello world.");

  const breadcrumbs = buildJobBreadcrumbSchema(job, "https://jobgigsnow.co.za/");
  assert.equal(breadcrumbs.itemListElement[1].item, "https://jobgigsnow.co.za/jobs/senior-developer-acme");
});

test("escapes less-than characters in JSON-LD", () => {
  const serialized = serializeJsonLd({ description: "</script><script>alert(1)</script>" });
  assert.equal(serialized.includes("<"), false);
  assert.match(serialized, /\\u003c\/script>/);
});

test("builds the site identity schemas", () => {
  const schemas = buildSiteSchemas("JobGigsNow", "Find jobs", "https://jobgigsnow.co.za/");
  assert.deepEqual(schemas.map((schema) => schema["@type"]), ["Organization", "WebSite"]);
  const website = schemas[1];
  assert.ok(website && "publisher" in website);
  assert.equal(website.publisher?.["@id"], "https://jobgigsnow.co.za/#organization");
});
