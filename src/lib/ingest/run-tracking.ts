import "server-only";
import type { IngestFailureStage, Prisma } from "@/generated/prisma/client";
import { prisma } from "@/lib/prisma";

export async function startIngestRun(sourceId: string) {
  return prisma.ingestRun.create({ data: { sourceId }, select: { id: true } });
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
  const outstanding = await prisma.rawJob.count({
    where: {
      ingestRunId: runId,
      OR: [{ fetchStatus: { in: ["PENDING", "FETCHING"] } }, { needsAggregation: true }],
    },
  });
  if (outstanding > 0) return;

  await prisma.ingestRun.updateMany({
    where: { id: runId, status: "RUNNING" },
    data: { status: "COMPLETED", finishedAt: new Date() },
  });
}

export async function failRun(runId: string) {
  await prisma.ingestRun.updateMany({
    where: { id: runId, status: "RUNNING" },
    data: { status: "FAILED", finishedAt: new Date() },
  });
}
