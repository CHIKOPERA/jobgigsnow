import { test } from "node:test";
import assert from "node:assert/strict";
import {
  diffDiscoveredUrls,
  extractLikelyJobLinks,
  extractListingLinks,
  findNextPageUrl,
  isSuspiciousEmptyDiscovery,
} from "../discovery-diff";
import type { CrawlConfig } from "@/lib/validation/source";

type HtmlCrawlConfig = Extract<CrawlConfig, { provider: "html" }>;

const LISTING_URL = "https://example.com/careers";

function config(overrides: Partial<HtmlCrawlConfig> = {}): HtmlCrawlConfig {
  return {
    provider: "html",
    listingUrls: [LISTING_URL],
    linkSelector: "a.job-link",
    linkAttr: "href",
    ...overrides,
  };
}

test("extractListingLinks resolves relative hrefs to absolute URLs and dedupes", () => {
  const html = `<html><body>
    <a class="job-link" href="/jobs/1">Forklift Operator</a>
    <a class="job-link" href="/jobs/2">Warehouse Associate</a>
    <a class="job-link" href="/jobs/1">Forklift Operator (duplicate link on page)</a>
    <a class="not-a-job" href="/about">About</a>
  </body></html>`;

  const links = extractListingLinks(html, LISTING_URL, config());

  assert.deepEqual(
    links.slice().sort(),
    ["https://example.com/jobs/1", "https://example.com/jobs/2"],
  );
});

test("extractListingLinks reads a custom linkAttr when configured", () => {
  const html = `<div class="job-link" data-url="/jobs/9">Something</div>`;
  const links = extractListingLinks(html, LISTING_URL, config({ linkSelector: ".job-link", linkAttr: "data-url" }));
  assert.deepEqual(links, ["https://example.com/jobs/9"]);
});

test("extractListingLinks can capture a URL embedded in an onclick attribute", () => {
  const html = `<table><tr class="job" onclick="javascript:window.location='/jobs/42';"><td>Job</td></tr></table>`;
  const links = extractListingLinks(
    html,
    LISTING_URL,
    config({
      linkSelector: "tr.job[onclick]",
      linkAttr: "onclick",
      linkRegex: "window\\.location=['\\\"]([^'\\\"]+)",
    }),
  );
  assert.deepEqual(links, ["https://example.com/jobs/42"]);
});

test("extractListingLinks skips elements with no href without throwing", () => {
  const html = `<a class="job-link">No href here</a>`;
  assert.doesNotThrow(() => extractListingLinks(html, LISTING_URL, config()));
  assert.deepEqual(extractListingLinks(html, LISTING_URL, config()), []);
});

test("fallback extraction keeps strong job-detail links and excludes broad navigation", () => {
  const html = `<nav>
      <a href="/careers">Careers</a>
      <a href="/jobs">All jobs</a>
      <a href="/privacy">Privacy</a>
    </nav>
    <main>
      <a href="/job/Johannesburg/Engineer_R123">Engineer</a>
      <a href="/Jobs/View/8842">Warehouse role</a>
      <a href="/search?jobid=991">Analyst</a>
    </main>`;

  assert.deepEqual(extractLikelyJobLinks(html, LISTING_URL).sort(), [
    "https://example.com/Jobs/View/8842",
    "https://example.com/job/Johannesburg/Engineer_R123",
    "https://example.com/search?jobid=991",
  ]);
});

test("fallback extraction only accepts PDFs whose surrounding text identifies an opportunity", () => {
  const html = `<div><a href="/reports/annual-report.pdf">Annual report</a></div>
    <div>Internship advert <a href="/documents/intake-2026.pdf">Download application</a></div>`;
  assert.deepEqual(extractLikelyJobLinks(html, LISTING_URL), [
    "https://example.com/documents/intake-2026.pdf",
  ]);
});

test("findNextPageUrl resolves the next-page link relative to the current page", () => {
  const html = `<a class="next" href="/careers?page=2">Next</a>`;
  assert.equal(findNextPageUrl(html, LISTING_URL, "a.next"), "https://example.com/careers?page=2");
});

test("findNextPageUrl returns null when there's no next-page link", () => {
  assert.equal(findNextPageUrl("<div></div>", LISTING_URL, "a.next"), null);
});

test("diffDiscoveredUrls buckets new, still-present, and missing correctly", () => {
  const previouslyActive = [
    { id: "row-1", externalUrl: "https://example.com/jobs/1" },
    { id: "row-2", externalUrl: "https://example.com/jobs/2" },
  ];
  const liveUrls = ["https://example.com/jobs/2", "https://example.com/jobs/3"];

  const diff = diffDiscoveredUrls(liveUrls, previouslyActive);

  assert.deepEqual(diff.newUrls, ["https://example.com/jobs/3"]);
  assert.deepEqual(diff.stillPresentUrls, ["https://example.com/jobs/2"]);
  assert.deepEqual(diff.missingRows, [{ id: "row-1", externalUrl: "https://example.com/jobs/1" }]);
});

test("diffDiscoveredUrls treats everything as new when there's no prior state", () => {
  const diff = diffDiscoveredUrls(["https://example.com/jobs/1"], []);
  assert.deepEqual(diff.newUrls, ["https://example.com/jobs/1"]);
  assert.deepEqual(diff.missingRows, []);
});

test("diffDiscoveredUrls treats everything as missing when nothing is live", () => {
  const previouslyActive = [{ id: "row-1", externalUrl: "https://example.com/jobs/1" }];
  const diff = diffDiscoveredUrls([], previouslyActive);
  assert.deepEqual(diff.newUrls, []);
  assert.deepEqual(diff.missingRows, previouslyActive);
});

test("zero-result safety protects established sources but allows genuinely empty new sources", () => {
  assert.equal(isSuspiciousEmptyDiscovery(0, 25, 5), true);
  assert.equal(isSuspiciousEmptyDiscovery(0, 4, 5), false);
  assert.equal(isSuspiciousEmptyDiscovery(1, 25, 5), false);
});
