import "server-only";
import type { Prisma } from "@/generated/prisma/client";
import { prisma } from "@/lib/prisma";
import { ai as aiConfig } from "@/config/ai";
import { ingest } from "@/config/ingest";
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
import { finalizeRunIfComplete, incrementRunCounters, recordFailure } from "./run-tracking";
import { seoRewrite } from "./seo-rewrite";
import type { RawExtractionBundle } from "./types";

function timeBudget(startedAt: number): boolean {
  return Date.now() - startedAt < ingest.tickTimeBudgetMs;
}

async function runWithConcurrency<T>(items: T[], limit: number, worker: (item: T) => Promise<void>): Promise<void> {
  let index = 0;
  async function next(): Promise<void> {
    const current = index++;
    if (current >= items.length) return;
    await worker(items[current]);
    return next();
  }
  await Promise.all(Array.from({ length: Math.min(limit, items.length) }, () => next()));
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

async function runDiscoveryIfDue(): Promise<string[]> {
  const now = Date.now();
  const enabledSources = await prisma.source.findMany({
    where: { enabled: true },
    select: { id: true, cadenceMinutes: true, lastRunAt: true },
  });

  const due = enabledSources
    .filter((s) => !s.lastRunAt || now - s.lastRunAt.getTime() >= s.cadenceMinutes * 60_000)
    .sort((a, b) => (a.lastRunAt?.getTime() ?? 0) - (b.lastRunAt?.getTime() ?? 0))
    .slice(0, ingest.discoveryPerTick);

  const runIds: string[] = [];
  // Run discoveries concurrently — each discoverSource catches its own errors and never throws,
  // so Promise.all is safe. Concurrent discovery prevents HTML sources with long pagination
  // crawls from blocking the budget before acquisition can run.
  await Promise.all(
    due.map(async (source) => {
      const runId = await discoverSource(source.id);
      if (runId) runIds.push(runId);
    }),
  );
  return runIds;
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
  source: { crawlConfig: unknown } | null;
}

async function claimAcquisitionCandidates(limit: number): Promise<AcquisitionCandidate[]> {
  const now = Date.now();
  const staleClaimCutoff = new Date(now - ingest.claimStaleMs);
  const recrawlCutoff = new Date(now - ingest.recrawlAfterMs);

  return prisma.rawJob.findMany({
    where: {
      OR: [
        { fetchStatus: "PENDING" },
        { fetchStatus: "FETCHING", updatedAt: { lt: staleClaimCutoff } },
        {
          fetchStatus: "FETCHED",
          active: true,
          OR: [{ lastCrawledAt: null }, { lastCrawledAt: { lt: recrawlCutoff } }],
        },
      ],
    },
    orderBy: { updatedAt: "asc" },
    take: limit,
    select: { id: true, externalUrl: true, sourceId: true, ingestRunId: true, contentHash: true, source: { select: { crawlConfig: true } } },
  });
}

async function processAcquisition(row: AcquisitionCandidate): Promise<void> {
  await prisma.rawJob.update({ where: { id: row.id }, data: { fetchStatus: "FETCHING" } });

  try {
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
    const markdown = extractMarkdown(html);

    const reconciled = reconcile(jsonLdToCandidates(jsonLdPostings), selectorCandidates, readabilityToCandidates(readable));
    const aggregationContext = markdown ?? readable.text;
    const newHash = hashAggregationInput(reconciled, aggregationContext);
    const isFirstFetch = row.contentHash === "";
    const changed = isFirstFetch || newHash !== row.contentHash;
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
        fetchStatus: "FETCHED",
        httpStatus: acquired.httpStatus,
        canonicalUrl,
        lastCrawledAt: new Date(),
        lastChangedAt: changed ? new Date() : undefined,
        // undefined (not false) when unchanged — leaves whatever needsAggregation already was,
        // which is exactly "skip unchanged": a row already fully aggregated stays that way.
        needsAggregation: changed ? true : undefined,
      },
    });

    // "new" is already counted at discovery time — only changed/unchanged apply to re-fetches.
    if (!isFirstFetch) {
      await maybeIncrementCounters(row.ingestRunId, changed ? { changedCount: 1 } : { unchangedCount: 1 });
    }
    if (row.ingestRunId) await finalizeRunIfComplete(row.ingestRunId);
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
  }
}

async function drainAcquisition(): Promise<number> {
  const candidates = await claimAcquisitionCandidates(ingest.acquisitionPerTick);
  await runWithConcurrency(candidates, ingest.acquisitionConcurrency, processAcquisition);
  return candidates.length;
}

// ---------------------------------------------------------------------------
// AI aggregation
// ---------------------------------------------------------------------------

interface AggregationCandidate {
  id: string;
  externalUrl: string;
  ingestRunId: string | null;
  payload: unknown;
}

async function claimAggregationCandidates(limit: number): Promise<AggregationCandidate[]> {
  const staleCutoff = new Date(Date.now() - ingest.claimStaleMs);
  return prisma.rawJob.findMany({
    where: {
      needsAggregation: true,
      fetchStatus: "FETCHED",
      OR: [{ aggregationClaimedAt: null }, { aggregationClaimedAt: { lt: staleCutoff } }],
    },
    orderBy: { updatedAt: "asc" },
    take: limit,
    select: { id: true, externalUrl: true, ingestRunId: true, payload: true },
  });
}

async function processAggregation(row: AggregationCandidate): Promise<void> {
  await prisma.rawJob.update({ where: { id: row.id }, data: { aggregationClaimedAt: new Date() } });

  try {
    const bundle = row.payload as unknown as RawExtractionBundle;

    const { result, inputTokens, outputTokens } = await aggregate({
      externalUrl: row.externalUrl,
      reconciled: bundle.reconciled,
      markdown: bundle.markdown,
      readableText: bundle.readableText,
    });

    const normalized = await normalize(result, row.id, row.externalUrl);

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
      // SEO rewrite is a text-quality pass on already-valid fields, not a data-extraction step —
      // its failure must never block Job creation. On failure, the pre-rewrite aggregated
      // title/description/tags are used as-is; the reviewer can always re-run "Rewrite with AI"
      // manually from /admin/review afterward.
      let seoOutcome: Awaited<ReturnType<typeof seoRewrite>> | null = null;
      try {
        seoOutcome = await seoRewrite({
          title: normalized.input.title,
          companyName: normalized.input.companyName,
          location: normalized.input.location,
          remoteType: normalized.input.remoteType,
          employmentType: normalized.input.employmentType,
          description: normalized.input.description,
          tags: normalized.input.tags,
          applyUrl: normalized.input.applyUrl ?? null,
        });
        normalized.input.title = seoOutcome.title;
        normalized.input.description = seoOutcome.description;
        normalized.input.tags = seoOutcome.tags;
        normalized.input.rewritePrompt = seoOutcome.promptTemplate;
      } catch (seoError) {
        if (row.ingestRunId) {
          await recordFailure({
            ingestRunId: row.ingestRunId,
            rawJobId: row.id,
            stage: "SEO_REWRITE",
            url: row.externalUrl,
            message: seoError instanceof Error ? seoError.message : String(seoError),
          });
        }
      }

      // Job upsert happens outside the transaction below — if the process crashes between the two,
      // the worst case is one wasted retry next tick (needsAggregation stays true, re-aggregating
      // re-upserts the *same* slug via normalize()'s slug-stability lookup), never a duplicate Job.
      const job = await upsertJob(normalized.input);

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
      if (seoOutcome) {
        improvementRunCreates.push(
          prisma.improvementRun.create({
            data: {
              rawJobId: row.id,
              jobId: job.id,
              model: aiConfig.model,
              promptVersion: "seo-rewrite-v1",
              inputTokens: seoOutcome.inputTokens,
              outputTokens: seoOutcome.outputTokens,
              diff: {
                kind: "seo_rewrite",
                promptTemplate: seoOutcome.promptTemplate,
                after: { title: seoOutcome.title, description: seoOutcome.description, tags: seoOutcome.tags },
              } as Prisma.InputJsonValue,
              status: "SUCCEEDED",
              startedAt: new Date(),
              finishedAt: new Date(),
            },
          }),
        );
      }

      await prisma.$transaction([
        prisma.rawJob.update({ where: { id: row.id }, data: { needsAggregation: false } }),
        ...improvementRunCreates,
      ]);
    }

    if (row.ingestRunId) await finalizeRunIfComplete(row.ingestRunId);
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
  }
}

async function drainAggregation(): Promise<number> {
  const candidates = await claimAggregationCandidates(ingest.aggregationPerTick);
  await runWithConcurrency(candidates, ingest.aggregationConcurrency, processAggregation);
  return candidates.length;
}

/** Processes one explicitly queued detail URL immediately. The durable RawJob/IngestRun rows are
 * created before this runs, so a terminated background task is still picked up by the next cron
 * tick. This is used by the admin one-off crawler. */
export async function processQueuedRawJob(rawJobId: string): Promise<void> {
  const acquisition = await prisma.rawJob.findUnique({
    where: { id: rawJobId },
    select: { id: true, externalUrl: true, sourceId: true, ingestRunId: true, contentHash: true, fetchStatus: true, source: { select: { crawlConfig: true } } },
  });
  if (!acquisition) return;

  if (acquisition.fetchStatus !== "FETCHED") {
    await processAcquisition(acquisition);
  }

  const aggregation = await prisma.rawJob.findUnique({
    where: { id: rawJobId },
    select: { id: true, externalUrl: true, ingestRunId: true, payload: true, fetchStatus: true, needsAggregation: true },
  });
  if (aggregation?.fetchStatus === "FETCHED" && aggregation.needsAggregation) {
    await processAggregation(aggregation);
  }
}

// ---------------------------------------------------------------------------
// Orchestration
// ---------------------------------------------------------------------------

export interface TickResult {
  discoveryRunIds: string[];
  acquisitionProcessed: number;
  aggregationProcessed: number;
  elapsedMs: number;
}

/**
 * One bounded slice of ingestion work, safe to call as often as Vercel Cron is configured to call
 * it (Section G). Every piece of state this touches is durable (RawJob/IngestRun columns) — a
 * killed invocation just leaves rows for the next tick's claim queries to pick back up.
 */
export async function runTick(): Promise<TickResult> {
  const startedAt = Date.now();

  // Drain durable fetch backlog first, then discover a small bounded set of fresh work before the
  // slower AI stage. This prevents either multi-page discovery or AI calls from starving the
  // other stages across repeated ticks.
  const acquisitionProcessed = timeBudget(startedAt) ? await drainAcquisition() : 0;
  const discoveryRunIds = timeBudget(startedAt) ? await runDiscoveryIfDue() : [];
  const aggregationProcessed = timeBudget(startedAt) ? await drainAggregation() : 0;

  return {
    discoveryRunIds,
    acquisitionProcessed,
    aggregationProcessed,
    elapsedMs: Date.now() - startedAt,
  };
}
