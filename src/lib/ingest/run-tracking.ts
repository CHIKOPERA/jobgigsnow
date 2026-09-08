import "server-only";
import type { IngestFailureStage, Prisma } from "@/generated/prisma/client";
import { ingest } from "@/config/ingest";
import { prisma } from "@/lib/prisma";

export async function startIngestRun(sourceId: string) {
  return prisma.ingestRun.create({
    data: { sourceId, currentStage: "QUEUED", heartbeatAt: new Date() },
    select: { id: true },
  });
}

export async function updateRunActivity(runId: string, stage: string, jobTitle?: string | null) {
  await prisma.ingestRun.updateMany({
    where: { id: runId, status: "RUNNING" },
    data: {
      currentStage: stage,
      currentJobTitle: jobTitle === undefined ? undefined : jobTitle,
      heartbeatAt: new Date(),
    },
  });
}

type RunCounterField =
  | "discoveredCount"
  | "newCount"
  | "changedCount"
  | "unchangedCount"
  | "missingCount"
  | "inactiveCount"
  | "failedCount"
  | "validationFailedCount"
  | "aiFailedCount";

export async function incrementRunCounters(runId: string, counters: Partial<Record<RunCounterField, number>>) {
  const entries = Object.entries(counters).filter(([, value]) => value !== undefined && value !== 0);
  if (entries.length === 0) return;

  await prisma.ingestRun.update({
    where: { id: runId },
    data: Object.fromEntries(entries.map(([field, value]) => [field, { increment: value }])),
  });
}

export async function recordFailure(params: {
  ingestRunId: string;
  rawJobId?: string | null;
  stage: IngestFailureStage;
  url?: string | null;
  message: string;
  detail?: unknown;
}) {
  await prisma.ingestFailure.create({
    data: {
      ingestRunId: params.ingestRunId,
      rawJobId: params.rawJobId ?? null,
      stage: params.stage,
      url: params.url ?? null,
      message: params.message,
      detail: (params.detail as Prisma.InputJsonValue) ?? undefined,
    },
  });
}

/** Marks a run COMPLETED once none of its RawJobs are still awaiting acquisition or aggregation. */
export async function finalizeRunIfComplete(runId: string) {
  const recrawlCutoff = new Date(Date.now() - ingest.recrawlAfterMs);
  const outstanding = await prisma.rawJob.count({
    where: {
      ingestRunId: runId,
      OR: [
        { fetchStatus: { in: ["PENDING", "FETCHING"] } },
        { needsAggregation: true },
        {
          fetchStatus: "FETCHED",
          active: true,
          OR: [{ lastCrawledAt: null }, { lastCrawledAt: { lt: recrawlCutoff } }],
        },
      ],
    },
  });
  if (outstanding > 0) return;

  await prisma.ingestRun.updateMany({
    where: { id: runId, status: "RUNNING" },
    data: {
      status: "COMPLETED",
      finishedAt: new Date(),
      currentStage: null,
      currentJobTitle: null,
      heartbeatAt: new Date(),
    },
  });
}

export async function failRun(runId: string) {
  await prisma.ingestRun.updateMany({
    where: { id: runId, status: "RUNNING" },
    data: {
      status: "FAILED",
      finishedAt: new Date(),
      currentStage: null,
      currentJobTitle: null,
      heartbeatAt: new Date(),
    },
  });
}

/** Requests a cooperative pause. The current external request may finish, then no new job starts. */
export async function pauseRun(runId: string) {
  const result = await prisma.ingestRun.updateMany({
    where: { id: runId, status: "RUNNING" },
    data: { status: "PAUSED", heartbeatAt: new Date() },
  });
  return result.count > 0;
}

export async function resumeRun(runId: string) {
  const result = await prisma.ingestRun.updateMany({
    where: { id: runId, status: "PAUSED" },
    data: { status: "RUNNING", finishedAt: null, heartbeatAt: new Date() },
  });
  return result.count > 0;
}

/** Cooperatively stops a run. Work already inside an external request may finish, but tick
 * candidate queries will not claim any more of the run's queued work. */
export async function cancelRun(runId: string) {
  const result = await prisma.ingestRun.updateMany({
    where: { id: runId, status: { in: ["RUNNING", "PAUSED"] } },
    data: {
      status: "CANCELLED",
      finishedAt: new Date(),
      currentStage: null,
      currentJobTitle: null,
      heartbeatAt: new Date(),
    },
  });
  return result.count > 0;
}

export async function resolveFailuresForRawJob(
  rawJobId: string,
  stages?: IngestFailureStage[],
) {
  await prisma.ingestFailure.updateMany({
    where: {
      rawJobId,
      status: { in: ["OPEN", "RETRYING"] },
      ...(stages && { stage: { in: stages } }),
    },
    data: { status: "RESOLVED", resolvedAt: new Date() },
  });
}

export async function resolveDiscoveryFailuresForSource(sourceId: string) {
  await prisma.ingestFailure.updateMany({
    where: {
      stage: "DISCOVERY",
      status: { in: ["OPEN", "RETRYING"] },
      ingestRun: { sourceId },
    },
    data: { status: "RESOLVED", resolvedAt: new Date() },
  });
}
