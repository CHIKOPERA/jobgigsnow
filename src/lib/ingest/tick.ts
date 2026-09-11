import "server-only";
import type { IngestRunStatus, Prisma } from "@/generated/prisma/client";
import { searchPexels } from "@/lib/pexels";
import { importJobSocialImage } from "@/lib/job-social-image";
import { hasExpiredJsonLdDeadline } from "@/lib/job-expiration";
import { prepareAutomaticPublication } from "./auto-publish";
import { prisma } from "@/lib/prisma";
import { ai as aiConfig } from "@/config/ai";
import { ingest } from "@/config/ingest";
import { sources as sourcesConfig } from "@/config/sources";
import type { CrawlConfig } from "@/lib/validation/source";
import { acquirePage } from "./acquisition";
import { aggregate } from "./aggregate";
import { discoverSource } from "./discovery";
import { extractJsonLd, jsonLdToCandidates } from "./extractors/jsonld";
import { extractMarkdown } from "./extractors/markdown";
import { extractReadable, readabilityToCandidates } from "./extractors/readability";
import { extractMetadata, extractSelectorFields } from "./extractors/selectors";
import { hashAggregationInput } from "./hash";
import { upsertJob } from "./job-service";
import { normalize } from "./normalize";
import { reconcile } from "./reconcile";
import { selectDueSourceIds } from "./source-schedule";
import {
  finalizeRunIfComplete,
  incrementRunCounters,
  recordFailure,
  resolveFailuresForRawJob,
  updateRunActivity,
} from "./run-tracking";
import type { RawExtractionBundle } from "./types";
import type { ImportProgressReporter, ImportStage } from "./progress-types";

type JobStageReporter = (stage: ImportStage, jobTitle?: string) => void | Promise<void>;

function timeBudget(startedAt: number): boolean {
  return Date.now() - startedAt < ingest.tickTimeBudgetMs;
}

type RunCounters = Parameters<typeof incrementRunCounters>[1];

async function maybeIncrementCounters(runId: string | null, counters: RunCounters) {
  if (!runId) return;
  const run = await prisma.ingestRun.findUnique({ where: { id: runId }, select: { status: true } });
  if (run?.status === "RUNNING") await incrementRunCounters(runId, counters);
}

// ---------------------------------------------------------------------------
// Discovery
// ---------------------------------------------------------------------------

async function findDueSourceIds(): Promise<string[]> {
  const now = Date.now();
  const enabledSources = await prisma.source.findMany({
    where: { enabled: true },
    select: { id: true, cadenceMinutes: true, lastRunAt: true, agentPriority: true },
  });

  return selectDueSourceIds(enabledSources, now, ingest.discoveryPerTick);
}

async function findRunningRunIds(): Promise<string[]> {
  const runs = await prisma.ingestRun.findMany({
    where: { status: "RUNNING" },
    orderBy: { startedAt: "asc" },
    take: ingest.discoveryPerTick,
    select: { id: true },
  });
  return runs.map((run) => run.id);
}

// ---------------------------------------------------------------------------
// Acquisition + extraction + reconciliation
// ---------------------------------------------------------------------------

interface AcquisitionCandidate {
  id: string;
  externalUrl: string;
  sourceId: string;
  ingestRunId: string | null;
  contentHash: string;
  extractionVersion: string | null;
  updatedAt: Date;
  rawTitle: string | null;
  source: { crawlConfig: unknown } | null;
  ingestRun: { status: IngestRunStatus } | null;
}

async function processAcquisition(row: AcquisitionCandidate, report?: JobStageReporter): Promise<"fetched" | "failed" | "skipped"> {
  if (row.ingestRun && row.ingestRun.status !== "RUNNING") return "skipped";
  const claim = await prisma.rawJob.updateMany({
    where: { id: row.id, updatedAt: row.updatedAt,
      OR: [{ fetchStatus: { not: "FETCHING" } }, { updatedAt: { lt: new Date(Date.now() - ingest.claimStaleMs) } }],
    },
    data: { fetchStatus: "FETCHING" },
  });
  if (claim.count === 0) return "skipped";

  try {
    await report?.("capturing", row.rawTitle ?? undefined);
    const config = row.source?.crawlConfig as unknown as CrawlConfig | undefined;

    const acquired = await acquirePage(row.externalUrl, config);
    const html = acquired.html;

    const jsonLdPostings = extractJsonLd(html);
    const { fields: selectorFields, candidates: selectorCandidates } = extractSelectorFields(
      html,
      row.externalUrl,
      config?.detailSelectors,
    );
    const metadata = extractMetadata(html, row.externalUrl);
    const readable = extractReadable(html, row.externalUrl);
    const markdown = acquired.markdown ?? extractMarkdown(html);

    const reconciled = reconcile(jsonLdToCandidates(jsonLdPostings), selectorCandidates, readabilityToCandidates(readable));
    const aggregationContext = markdown ?? readable.text;
    const newHash = hashAggregationInput(reconciled, aggregationContext);
    const isFirstFetch = row.contentHash === "";
    const contentChanged = isFirstFetch || newHash !== row.contentHash;
    const pipelineChanged = row.extractionVersion !== aiConfig.promptVersion;
    const canonicalUrl = metadata.canonicalUrl ?? acquired.redirectedUrl ?? null;

    const bundle: RawExtractionBundle = {
      originalUrl: row.externalUrl,
      canonicalUrl,
      httpStatus: acquired.httpStatus,
      fetchedAt: acquired.fetchedAt,
      html: acquired.html,
      htmlTruncated: acquired.htmlTruncated,
      jsonLd: jsonLdPostings,
      selectors: selectorFields,
      readableText: readable.text,
      markdown,
      metadata,
      errors: [],
      reconciled,
    };

    await prisma.rawJob.update({
      where: { id: row.id },
      data: {
        payload: bundle as unknown as Prisma.InputJsonValue,
        contentHash: newHash,
        extractionVersion: aiConfig.promptVersion,
        fetchStatus: "FETCHED",
        httpStatus: acquired.httpStatus,
        canonicalUrl,
        lastCrawledAt: new Date(),
        lastChangedAt: contentChanged ? new Date() : undefined,
        // A prompt/schema version change re-runs aggregation even when the source text is stable;
        // otherwise undefined leaves an already-complete unchanged row alone.
        needsAggregation: contentChanged || pipelineChanged ? true : undefined,
      },
    });

    // "new" is already counted at discovery time — only changed/unchanged apply to re-fetches.
    if (!isFirstFetch) {
      await maybeIncrementCounters(row.ingestRunId, contentChanged ? { changedCount: 1 } : { unchangedCount: 1 });
    }
    await resolveFailuresForRawJob(row.id, ["ACQUISITION", "EXTRACTION"]);
    if (row.ingestRunId) await finalizeRunIfComplete(row.ingestRunId);
    return "fetched";
  } catch (err) {
    await prisma.rawJob.update({
      where: { id: row.id },
      data: { fetchStatus: "FAILED", needsAggregation: false, aggregationClaimedAt: null },
    });
    if (row.ingestRunId) {
      await maybeIncrementCounters(row.ingestRunId, { failedCount: 1 });
      await recordFailure({
        ingestRunId: row.ingestRunId,
        rawJobId: row.id,
        stage: "ACQUISITION",
        url: row.externalUrl,
        message: err instanceof Error ? err.message : String(err),
      });
      await finalizeRunIfComplete(row.ingestRunId);
    }
    return "failed";
  }
}

// ---------------------------------------------------------------------------
// AI aggregation
// ---------------------------------------------------------------------------

interface AggregationCandidate {
  id: string;
  externalUrl: string;
  ingestRunId: string | null;
  payload: unknown;
  rawTitle: string | null;
  source: { crawlConfig: unknown } | null;
  ingestRun: { status: IngestRunStatus } | null;
}

type ProcessingOutcome = "published" | "ready" | "updated" | "failed" | "skipped";

async function processAggregation(
  row: AggregationCandidate,
  report?: JobStageReporter,
  publishNow = true,
): Promise<ProcessingOutcome> {
  if (row.ingestRun && row.ingestRun.status !== "RUNNING") return "skipped";
  const claim = await prisma.rawJob.updateMany({
    where: {
      id: row.id, needsAggregation: true, fetchStatus: "FETCHED",
      OR: [{ aggregationClaimedAt: null }, { aggregationClaimedAt: { lt: new Date(Date.now() - ingest.claimStaleMs) } }],
    },
    data: { aggregationClaimedAt: new Date() },
  });
  if (claim.count === 0) return "skipped";

  try {
    const bundle = row.payload as unknown as RawExtractionBundle;

    // Avoid paying for an AI rewrite when the authoritative structured deadline has passed.
    if (hasExpiredJsonLdDeadline(bundle.jsonLd)) {
      await prisma.rawJob.update({
        where: { id: row.id },
        data: { active: false, needsAggregation: false, aggregationClaimedAt: null },
      });
      if (row.ingestRunId) await maybeIncrementCounters(row.ingestRunId, { inactiveCount: 1 });
      return "skipped";
    }

    await report?.("rewriting", row.rawTitle ?? undefined);

    const { result, inputTokens, outputTokens } = await aggregate({
      externalUrl: row.externalUrl,
      reconciled: bundle.reconciled,
      markdown: bundle.markdown,
      readableText: bundle.readableText,
    });

    const config = row.source?.crawlConfig as unknown as CrawlConfig | undefined;
    const normalized = await normalize(result, row.id, row.externalUrl, config?.categoryHint);
    let successfulOutcome: ProcessingOutcome = "failed";

    if (!normalized.ok) {
      await prisma.$transaction([
        prisma.rawJob.update({ where: { id: row.id }, data: { needsAggregation: false } }),
        prisma.improvementRun.create({
          data: {
            rawJobId: row.id,
            model: aiConfig.model,
            promptVersion: aiConfig.promptVersion,
            inputTokens,
            outputTokens,
            diff: result as unknown as Prisma.InputJsonValue,
            status: "FAILED",
            startedAt: new Date(),
            finishedAt: new Date(),
          },
        }),
      ]);

      if (row.ingestRunId) {
        await maybeIncrementCounters(row.ingestRunId, { validationFailedCount: 1 });
        await recordFailure({
          ingestRunId: row.ingestRunId,
          rawJobId: row.id,
          stage: "VALIDATION",
          url: row.externalUrl,
          message: `Missing required fields after aggregation: ${normalized.missingFields.join(", ")}`,
        });
      }
    } else {
      const job = await upsertJob(normalized.input);
      const wasAlreadyPublished = job.status === "PUBLISHED";
      successfulOutcome = wasAlreadyPublished ? "updated" : publishNow ? "published" : "ready";

      await report?.("image", normalized.input.title);
      await prepareAutomaticPublication(
        () => searchPexels(normalized.input.title, 1),
        async (photo) => ({
          socialImageUrl: await importJobSocialImage(job.id, photo.id, photo.url),
          socialImageAlt: photo.alt,
          socialImageCredit: `Photo by ${photo.photographer} on Pexels`,
          socialImageSourceUrl: photo.photographerUrl,
        }),
        async (image) => {
          if (publishNow && !wasAlreadyPublished) await report?.("publishing", normalized.input.title);
          return prisma.job.update({
            where: { id: job.id },
            data: {
              ...(image ?? {}),
              ...(!wasAlreadyPublished && publishNow && {
                status: "PUBLISHED",
                publishedAt: job.publishedAt ?? new Date(),
                postedAt: normalized.input.postedAt ? new Date(normalized.input.postedAt) : new Date(),
              }),
            },
          });
        },
      );

      const improvementRunCreates = [
        prisma.improvementRun.create({
          data: {
            rawJobId: row.id,
            jobId: job.id,
            model: aiConfig.model,
            promptVersion: aiConfig.promptVersion,
            inputTokens,
            outputTokens,
            diff: result as unknown as Prisma.InputJsonValue,
            status: "SUCCEEDED",
            startedAt: new Date(),
            finishedAt: new Date(),
          },
        }),
      ];

      await prisma.$transaction([
        prisma.rawJob.update({ where: { id: row.id }, data: { needsAggregation: false } }),
        ...improvementRunCreates,
      ]);
      await resolveFailuresForRawJob(row.id);
    }

    if (row.ingestRunId) await finalizeRunIfComplete(row.ingestRunId);
    return normalized.ok ? successfulOutcome : "failed";
  } catch (err) {
    // needsAggregation is deliberately left true — a transient AI/network failure is retried by
    // the next tick automatically (Section F, point 11), unlike a validation failure above.
    if (row.ingestRunId) {
      await maybeIncrementCounters(row.ingestRunId, { aiFailedCount: 1 });
      await recordFailure({
        ingestRunId: row.ingestRunId,
        rawJobId: row.id,
        stage: "AGGREGATION",
        url: row.externalUrl,
        message: err instanceof Error ? err.message : String(err),
      });
      await finalizeRunIfComplete(row.ingestRunId);
    }
    return "failed";
  }
}

/** Processes one queued detail URL immediately from capture through publication. */
export async function processQueuedRawJob(
  rawJobId: string,
  report?: JobStageReporter,
  publishNow = true,
): Promise<ProcessingOutcome> {
  const acquisition = await prisma.rawJob.findUnique({
    where: { id: rawJobId },
    select: {
      id: true,
      externalUrl: true,
      sourceId: true,
      ingestRunId: true,
      contentHash: true,
      extractionVersion: true,
      updatedAt: true,
      rawTitle: true,
      fetchStatus: true,
      lastCrawledAt: true,
      source: { select: { crawlConfig: true } },
      ingestRun: { select: { status: true } },
    },
  });
  if (!acquisition || (acquisition.ingestRun && acquisition.ingestRun.status !== "RUNNING")) return "skipped";

  const recrawlCutoff = new Date(Date.now() - ingest.recrawlAfterMs);
  const shouldAcquire =
    acquisition.fetchStatus !== "FETCHED" ||
    acquisition.extractionVersion !== aiConfig.promptVersion ||
    acquisition.lastCrawledAt === null ||
    acquisition.lastCrawledAt < recrawlCutoff;

  if (shouldAcquire) {
    const acquisitionResult = await processAcquisition(acquisition, report);
    if (acquisitionResult !== "fetched") return acquisitionResult;
  }

  const aggregation = await prisma.rawJob.findUnique({
    where: { id: rawJobId },
    select: {
      id: true,
      externalUrl: true,
      ingestRunId: true,
      payload: true,
      rawTitle: true,
      fetchStatus: true,
      needsAggregation: true,
      source: { select: { crawlConfig: true } },
      ingestRun: { select: { status: true } },
    },
  });
  if (aggregation?.fetchStatus === "FETCHED" && aggregation.needsAggregation) {
    return processAggregation(aggregation, report, publishNow);
  }
  return "skipped";
}

// ---------------------------------------------------------------------------
// Orchestration
// ---------------------------------------------------------------------------

export interface SimpleImportResult {
  ingestRunId: string | null;
  found: number;
  processed: number;
  published: number;
  queued: number;
  skipped: number;
  failed: number;
  elapsedMs: number;
}

async function processRunJobs(
  runId: string,
  startedAt: number,
  report?: ImportProgressReporter,
  maxPublications = Number.POSITIVE_INFINITY,
): Promise<SimpleImportResult> {
  const run = await prisma.ingestRun.findUnique({
    where: { id: runId },
    select: { status: true, discoveredCount: true, failedCount: true, source: { select: { name: true } } },
  });
  if (!run || run.status !== "RUNNING") {
    return {
      ingestRunId: runId,
      found: run?.discoveredCount ?? 0,
      processed: 0,
      published: 0,
      queued: 0,
      skipped: 0,
      failed: run?.status === "FAILED" ? Math.max(run.failedCount, 1) : 0,
      elapsedMs: Date.now() - startedAt,
    };
  }

  const recrawlCutoff = new Date(Date.now() - ingest.recrawlAfterMs);
  const rows = await prisma.rawJob.findMany({
    where: {
      ingestRunId: runId,
      active: true,
      OR: [
        { fetchStatus: { not: "FETCHED" } },
        { needsAggregation: true },
        { extractionVersion: { not: aiConfig.promptVersion } },
        { extractionVersion: null },
        { lastCrawledAt: null },
        { lastCrawledAt: { lt: recrawlCutoff } },
      ],
    },
    orderBy: [{ fetchStatus: "asc" }, { updatedAt: "asc" }],
    take: sourcesConfig.maxPagesPerRun,
    select: { id: true },
  });

  const result: SimpleImportResult = {
    ingestRunId: runId,
    found: rows.length,
    processed: 0,
    published: 0,
    queued: 0,
    skipped: 0,
    failed: 0,
    elapsedMs: 0,
  };

  const sourceName = run.source.name;
  const emit = (stage: ImportStage, message: string, current?: number, jobTitle?: string) => report?.({
    type: "progress",
    stage,
    message,
    runId,
    sourceName,
    jobTitle,
    found: result.found,
    processed: result.processed,
    published: result.published,
    skipped: result.skipped,
    failed: result.failed,
    current,
    total: rows.length,
  });

  emit("found", rows.length === 0 ? `${sourceName} is up to date.` : `${rows.length} new or updated ${rows.length === 1 ? "job" : "jobs"} found.`);

  for (const [index, row] of rows.entries()) {
    if (!timeBudget(startedAt)) break;
    const currentRun = await prisma.ingestRun.findUnique({ where: { id: runId }, select: { status: true } });
    if (currentRun?.status !== "RUNNING") break;
    const current = index + 1;
    const outcome = await processQueuedRawJob(row.id, async (stage, jobTitle) => {
      const label = jobTitle ?? `job ${current} of ${rows.length}`;
      const messages: Partial<Record<ImportStage, string>> = {
        capturing: `Capturing ${label}…`,
        rewriting: `Rewriting ${label}…`,
        image: `Finding an image for ${label}…`,
        publishing: `Publishing ${label}…`,
      };
      await updateRunActivity(runId, stage.toUpperCase(), jobTitle ?? label);
      emit(stage, messages[stage] ?? `Processing ${label}…`, current, jobTitle);
    }, result.published < maxPublications);
    result.processed += 1;
    if (outcome === "published") result.published += 1;
    else if (outcome === "ready") result.queued += 1;
    else if (outcome === "failed") result.failed += 1;
    else result.skipped += 1;
    const finalStage = outcome === "published" ? "published" : outcome === "failed" ? "failed" : "skipped";
    const finalMessage = outcome === "published"
      ? `Published job ${current} of ${rows.length}.`
      : outcome === "ready" ? `Queued job ${current} of ${rows.length} for a future publication day.`
        : outcome === "failed" ? `Job ${current} of ${rows.length} needs attention.` : `Skipped unchanged job ${current} of ${rows.length}.`;
    emit(finalStage, finalMessage, current);
  }

  await finalizeRunIfComplete(runId);
  result.elapsedMs = Date.now() - startedAt;
  return result;
}

/** One clear source import: discover URLs, process each URL, publish every valid job. */
export async function importSource(
  sourceId: string,
  startedAt = Date.now(),
  report?: ImportProgressReporter,
  maxPublications = Number.POSITIVE_INFINITY,
): Promise<SimpleImportResult> {
  const source = await prisma.source.findUnique({ where: { id: sourceId }, select: { name: true, enabled: true } });
  const activeRun = await prisma.ingestRun.findFirst({
    where: { sourceId, status: { in: ["RUNNING", "PAUSED"] } },
    orderBy: { startedAt: "desc" },
    select: { id: true, status: true, discoveredCount: true },
  });
  if (activeRun) {
    if (activeRun.status === "RUNNING") return processRunJobs(activeRun.id, startedAt, report, maxPublications);
    return {
      ingestRunId: activeRun.id,
      found: activeRun.discoveredCount,
      processed: 0,
      published: 0,
      queued: 0,
      skipped: 0,
      failed: 0,
      elapsedMs: Date.now() - startedAt,
    };
  }
  if (source?.enabled) {
    report?.({ type: "progress", stage: "discovering", message: `Checking ${source.name} for new jobs…`, sourceName: source.name, found: 0, processed: 0, published: 0, skipped: 0, failed: 0 });
  }
  const runId = await discoverSource(sourceId);
  if (!runId) {
    return { ingestRunId: null, found: 0, processed: 0, published: 0, queued: 0, skipped: 0, failed: 0, elapsedMs: Date.now() - startedAt };
  }
  return processRunJobs(runId, startedAt, report, maxPublications);
}

/** Compatibility wrapper for old callers that already have a run id. */
export async function processSourceRun(runId: string, startedAt = Date.now(), report?: ImportProgressReporter): Promise<SimpleImportResult> {
  return processRunJobs(runId, startedAt, report);
}

export interface TickResult {
  discoveryRunIds: string[];
  acquisitionProcessed: number;
  aggregationProcessed: number;
  sourceRuns: SimpleImportResult[];
  elapsedMs: number;
}

export interface TickOptions {
  /** Bounds automatic output for a goal-managed run. Manual single-job imports are unaffected. */
  maxPublications?: number;
}

/**
 * One bounded slice of ingestion work, safe to call as often as Vercel Cron is configured to call
 * it (Section G). Every piece of state this touches is durable (RawJob/IngestRun columns) — a
 * killed invocation just leaves rows for the next tick's claim queries to pick back up.
 */
export async function runTick(report?: ImportProgressReporter, options: TickOptions = {}): Promise<TickResult> {
  const startedAt = Date.now();
  const sourceRuns: SimpleImportResult[] = [];
  const maximum = options.maxPublications ?? Number.POSITIVE_INFINITY;
  const runningRunIds = timeBudget(startedAt) ? await findRunningRunIds() : [];
  const dueSourceIds = timeBudget(startedAt) ? await findDueSourceIds() : [];
  const runIds = new Set(runningRunIds);
  const newlyDiscoveredRunIds: string[] = [];

  // Discover first. Processing a large source can consume the rest of this invocation, but it
  // must not prevent the other selected sources from being checked and durably queued.
  for (const sourceId of dueSourceIds) {
    if (!timeBudget(startedAt)) break;
    const alreadyActive = await prisma.ingestRun.findFirst({
      where: { sourceId, status: { in: ["RUNNING", "PAUSED"] } },
      select: { id: true, status: true },
    });
    if (alreadyActive) {
      if (alreadyActive.status === "RUNNING") runIds.add(alreadyActive.id);
      continue;
    }
    const source = await prisma.source.findUnique({ where: { id: sourceId }, select: { name: true, enabled: true } });
    if (source?.enabled) {
      report?.({ type: "progress", stage: "discovering", message: `Checking ${source.name} for new jobs…`, sourceName: source.name, found: 0, processed: 0, published: 0, skipped: 0, failed: 0 });
    }
    const runId = await discoverSource(sourceId);
    if (runId) {
      runIds.add(runId);
      newlyDiscoveredRunIds.push(runId);
    }
  }

  for (const runId of runIds) {
    if (!timeBudget(startedAt)) break;
    const published = sourceRuns.reduce((sum, run) => sum + run.published, 0);
    sourceRuns.push(await processRunJobs(runId, startedAt, report, Math.max(0, maximum - published)));
  }

  return {
    discoveryRunIds: newlyDiscoveredRunIds,
    acquisitionProcessed: sourceRuns.reduce((sum, run) => sum + run.processed, 0),
    aggregationProcessed: sourceRuns.reduce((sum, run) => sum + run.published, 0),
    sourceRuns,
    elapsedMs: Date.now() - startedAt,
  };
}
