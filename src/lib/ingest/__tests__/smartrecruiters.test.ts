import { test } from "node:test";
import assert from "node:assert/strict";
import { buildSmartRecruitersPageUrl, parseSmartRecruitersPage } from "../smartrecruiters";

test("buildSmartRecruitersPageUrl includes the company and pagination", () => {
  assert.equal(
    buildSmartRecruitersPageUrl("StandardBankGroup", 100, 200),
    "https://api.smartrecruiters.com/v1/companies/StandardBankGroup/postings?limit=100&offset=200",
  );
});

test("parseSmartRecruitersPage keeps valid public posting URLs", () => {
  const parsed = parseSmartRecruitersPage({
    totalFound: 3,
    content: [
      { id: "1", postingUrl: "https://jobs.smartrecruiters.com/Company/1-role" },
      { id: "2", postingUrl: "not-a-url" },
      { id: "3" },
    ],
  });

  assert.deepEqual(parsed, {
    totalFound: 3,
    postings: [{ id: "1", postingUrl: "https://jobs.smartrecruiters.com/Company/1-role" }],
  });
});

test("parseSmartRecruitersPage rejects responses without content", () => {
  assert.throws(() => parseSmartRecruitersPage({ totalFound: 1 }), /missing content/);
});
