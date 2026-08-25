import "server-only";
import { prisma } from "@/lib/prisma";
import { ingest } from "@/config/ingest";
import { sources as sourcesConfig } from "@/config/sources";
import type { CrawlConfig } from "@/lib/validation/source";
import {
  diffDiscoveredUrls,
  extractLikelyJobLinks,
  extractListingLinks,
  findNextPageUrl,
  isSuspiciousEmptyDiscovery,
} from "./discovery-diff";
import { isAllowedByRobots } from "./robots";
import { failRun, finalizeRunIfComplete, incrementRunCounters, recordFailure, startIngestRun } from "./run-tracking";
import { buildSmartRecruitersPageUrl, parseSmartRecruitersPage } from "./smartrecruiters";
import { discoverCornerstone } from "./cornerstone";
import { discoverOracle } from "./oracle";
import { discoverWorkday } from "./workday";

async function fetchListingPage(url: string, timeoutMs: number): Promise<string> {
  if (!(await isAllowedByRobots(url))) {
    throw new Error(`Disallowed by robots.txt: ${url}`);
  }
  const res = await fetch(url, {
    headers: { "user-agent": sourcesConfig.defaultUserAgent },
    signal: AbortSignal.timeout(timeoutMs),
  });
  if (!res.ok) throw new Error(`Listing page returned HTTP ${res.status}`);
  return res.text();
}

async function fetchSmartRecruitersPage(url: string, timeoutMs: number): Promise<unknown> {
  if (!(await isAllowedByRobots(url))) {
    throw new Error(`Disallowed by robots.txt: ${url}`);
  }
  const res = await fetch(url, {
    headers: { accept: "application/json", "user-agent": sourcesConfig.defaultUserAgent },
    signal: AbortSignal.timeout(timeoutMs),
  });
  if (!res.ok) throw new Error(`SmartRecruiters returned HTTP ${res.status}`);
  return res.json();
}

async function fetchAts(url: string | URL | Request, init?: RequestInit): Promise<Response> {
  const resolvedUrl = typeof url === "string" ? url : url instanceof URL ? url.toString() : url.url;
  if (!(await isAllowedByRobots(resolvedUrl))) throw new Error(`Disallowed by robots.txt: ${resolvedUrl}`);
  const headers = new Headers(init?.headers);
  if (!headers.has("user-agent")) headers.set("user-agent", sourcesConfig.defaultUserAgent);
  return fetch(url, {
    ...init,
    headers,
    signal: init?.signal ?? AbortSignal.timeout(sourcesConfig.defaultFetchTimeoutMs),
  });
}

/** Crawls every listingUrl (+ pagination) for one source, tolerating a bad listing URL among
 *  several — only fails the whole discovery pass if every listingUrl fails. */
async function crawlAllListings(
  config: Extract<CrawlConfig, { provider: "html" }>,
  onListingError: (url: string, message: string) => void,
): Promise<string[]> {
  const allLinks = new Set<string>();
  let anySucceeded = false;
  const timeoutMs = config.fetchTimeoutMs ?? sourcesConfig.defaultFetchTimeoutMs;

  for (const startUrl of config.listingUrls) {
    try {
      const visited = new Set<string>();
      let pageUrl: string | null = startUrl;
      let pageCount = 0;
      const maxPages = config.pagination?.maxPages ?? 1;

      while (pageUrl && pageCount < maxPages && !visited.has(pageUrl)) {
        visited.add(pageUrl);
        const html = await fetchListingPage(pageUrl, timeoutMs);
        const configuredLinks = extractListingLinks(html, pageUrl, config);
        const pageLinks = configuredLinks.length > 0 ? configuredLinks : extractLikelyJobLinks(html, pageUrl);
        for (const link of pageLinks) allLinks.add(link);

        pageCount += 1;
        pageUrl = config.pagination ? findNextPageUrl(html, pageUrl, config.pagination.nextPageSelector) : null;
      }
      anySucceeded = true;
    } catch (err) {
      onListingError(startUrl, err instanceof Error ? err.message : String(err));
    }
  }

  if (!anySucceeded && config.listingUrls.length > 0) {
    throw new Error("Every listingUrl failed for this source.");
  }
  return [...allLinks];
}

async function crawlSmartRecruiters(
  config: Extract<CrawlConfig, { provider: "smartrecruiters" }>,
  onListingError: (url: string, message: string) => void,
): Promise<string[]> {
  const links = new Set<string>();
  let offset = 0;
  const timeoutMs = config.fetchTimeoutMs ?? sourcesConfig.defaultFetchTimeoutMs;

  for (let page = 0; page < config.maxPages; page++) {
    const endpoint = buildSmartRecruitersPageUrl(config.companyIdentifier, config.pageSize, offset);
    try {
      const parsed = parseSmartRecruitersPage(
        await fetchSmartRecruitersPage(endpoint, timeoutMs),
        config.companyIdentifier,
      );
      for (const posting of parsed.postings) links.add(posting.postingUrl);

      offset += parsed.postings.length;
      if (parsed.postings.length === 0 || offset >= parsed.totalFound || parsed.postings.length < config.pageSize) {
        break;
      }
    } catch (err) {
      onListingError(endpoint, err instanceof Error ? err.message : String(err));
      throw new Error("SmartRecruiters discovery failed for this source.");
    }
  }

  return [...links];
}

async function discoverLiveUrls(
  config: CrawlConfig,
  onListingError: (url: string, message: string) => void,
): Promise<string[]> {
  const timeoutMs = config.fetchTimeoutMs ?? sourcesConfig.defaultFetchTimeoutMs;
  const atsFetcher: typeof fetch = (input, init) =>
    fetchAts(input, {
      ...init,
      signal: init?.signal ?? AbortSignal.timeout(timeoutMs),
    });

  switch (config.provider) {
    case "smartrecruiters":
      return crawlSmartRecruiters(config, onListingError);
    case "workday":
      return discoverWorkday(config, atsFetcher);
    case "oracle":
      return discoverOracle(config, atsFetcher);
    case "cornerstone":
      return discoverCornerstone(config, atsFetcher);
    case "html":
      return crawlAllListings(config, onListingError);
  }
}

/**
 * Runs one discovery cycle for a source: finds live job-detail URLs, upserts RawJob shells for
 * new/resurfacing ones, tracks missing/inactive transitions, and produces an IngestRun. Actual
 * page acquisition (fetching each detail page) and aggregation happen later, drained by
 * tick.ts — this only decides which RawJobs exist and whether they're still active.
 */
export async function discoverSource(sourceId: string): Promise<string | null> {
  const source = await prisma.source.findUnique({ where: { id: sourceId } });
  if (!source || !source.enabled) return null;

  const config = source.crawlConfig as unknown as CrawlConfig;
  const run = await startIngestRun(sourceId);
  const now = new Date();

  try {
    const listingErrors: { url: string; message: string }[] = [];
    let liveUrlsRaw: string[];
    try {
      liveUrlsRaw = await discoverLiveUrls(config, (url, message) => listingErrors.push({ url, message }));
    } catch (err) {
      // Preserve the actionable endpoint-level error before the outer catch records the summary.
      for (const { url, message } of listingErrors) {
        await recordFailure({ ingestRunId: run.id, stage: "DISCOVERY", url, message });
      }
      throw err;
    }
    const liveUrls = liveUrlsRaw.slice(0, sourcesConfig.maxPagesPerRun);

    for (const { url, message } of listingErrors) {
      await recordFailure({ ingestRunId: run.id, stage: "DISCOVERY", url, message });
    }

    const previouslyActive = await prisma.rawJob.findMany({
      where: { sourceId, active: true },
      select: { id: true, externalId: true, externalUrl: true },
    });

    if (
      isSuspiciousEmptyDiscovery(
        liveUrls.length,
        previouslyActive.length,
        sourcesConfig.zeroResultSafetyMinPreviousJobs,
      )
    ) {
      throw new Error(
        `Discovery returned zero URLs for a source with ${previouslyActive.length} active jobs; preserving existing jobs.`,
      );
    }

    const diff = diffDiscoveredUrls(liveUrls, previouslyActive);

    // Collect old ingestRunIds before we reassign them — needed to finalize any runs that
    // become empty after the reassignment (a run whose jobs all move to the new run will
    // never be finalized otherwise because finalizeRunIfComplete is only called per-job).
    const displacedRunIds = new Set<string>();
    if (diff.stillPresentUrls.length > 0 || diff.missingRows.length > 0) {
      const displaced = await prisma.rawJob.findMany({
        where: {
          id: { in: diff.missingRows.map((r) => r.id) },
          ingestRunId: { not: null },
        },
        select: { ingestRunId: true },
      });
      const displacedByUrl = await prisma.rawJob.findMany({
        where: {
          sourceId,
          externalUrl: { in: diff.stillPresentUrls },
          ingestRunId: { not: null },
        },
        select: { ingestRunId: true },
        distinct: ["ingestRunId"],
      });
      for (const row of [...displaced, ...displacedByUrl]) {
        if (row.ingestRunId && row.ingestRunId !== run.id) displacedRunIds.add(row.ingestRunId);
      }
    }

    await prisma.rawJob.updateMany({
      where: { sourceId, externalUrl: { in: diff.stillPresentUrls } },
      data: { lastSeenAt: now, consecutiveMissingRuns: 0, ingestRunId: run.id },
    });

    for (const url of diff.newUrls) {
      // externalId is the resolved URL itself — always available, unique per job, and needs no
      // extra crawlConfig field. Upsert (not create) because this URL may belong to a row that
      // went inactive earlier and is now resurfacing.
      await prisma.rawJob.upsert({
        where: { sourceId_externalId: { sourceId, externalId: url } },
        create: {
          sourceId,
          externalId: url,
          externalUrl: url,
          payload: {},
          contentHash: "",
          fetchStatus: "PENDING",
          lastSeenAt: now,
          ingestRunId: run.id,
        },
        update: {
          lastSeenAt: now,
          consecutiveMissingRuns: 0,
          active: true,
          ingestRunId: run.id,
        },
      });
    }

    let inactiveCount = 0;
    for (const row of diff.missingRows) {
      const updated = await prisma.rawJob.update({
        where: { id: row.id },
        data: { consecutiveMissingRuns: { increment: 1 }, ingestRunId: run.id },
        select: { consecutiveMissingRuns: true },
      });

      if (updated.consecutiveMissingRuns >= ingest.missingRunsThreshold) {
        await prisma.rawJob.update({ where: { id: row.id }, data: { active: false } });
        inactiveCount += 1;

        const linkedJob = await prisma.job.findUnique({
          where: { rawJobId: row.id },
          select: { id: true, status: true },
        });
        if (linkedJob?.status === "PUBLISHED") {
          await prisma.job.update({ where: { id: linkedJob.id }, data: { status: "CLOSED" } });
        }
      }
    }

    await incrementRunCounters(run.id, {
      discoveredCount: liveUrls.length,
      newCount: diff.newUrls.length,
      missingCount: diff.missingRows.length,
      inactiveCount,
      failedCount: listingErrors.length,
    });

    await prisma.source.update({ where: { id: sourceId }, data: { lastRunAt: now } });
    await finalizeRunIfComplete(run.id);

    // Finalize any old runs whose jobs were just reassigned to this run — they're now empty
    // and would stay RUNNING forever if we don't check them here.
    for (const oldRunId of displacedRunIds) {
      await finalizeRunIfComplete(oldRunId);
    }

    return run.id;
  } catch (err) {
    await recordFailure({
      ingestRunId: run.id,
      stage: "DISCOVERY",
      url: source.baseUrl,
      message: err instanceof Error ? err.message : String(err),
    });
    await failRun(run.id);
    return run.id;
  }
}
