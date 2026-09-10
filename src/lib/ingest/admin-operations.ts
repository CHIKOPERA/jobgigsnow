import "server-only";
import type { IngestFailureStatus, JobStatus } from "@/generated/prisma/client";
import { prisma } from "@/lib/prisma";
import { startIngestRun } from "./run-tracking";

export type BulkJobAction = "PUBLISH" | "ARCHIVE" | "CLOSE" | "REJECT";
export type BulkIssueAction = "RETRY" | "DISMISS" | "RESOLVE";
export type BulkSourceAction = "PAUSE" | "RESUME";

const jobStatusForAction: Record<BulkJobAction, JobStatus> = {
  PUBLISH: "PUBLISHED",
  ARCHIVE: "ARCHIVED",
  CLOSE: "CLOSED",
  REJECT: "REJECTED",
};

const allowedJobStatuses: Record<BulkJobAction, JobStatus[]> = {
  PUBLISH: ["READY", "CLOSED", "ARCHIVED", "REJECTED"],
  ARCHIVE: ["READY", "PUBLISHED", "CLOSED", "REJECTED"],
  CLOSE: ["PUBLISHED"],
  REJECT: ["READY"],
};

export async function updateJobsInBulk(ids: string[], action: BulkJobAction) {
  const jobs = await prisma.job.findMany({
    where: {
      id: { in: ids },
      status: { in: allowedJobStatuses[action] },
      ...(action === "PUBLISH" && { OR: [{ closesAt: null }, { closesAt: { gte: new Date() } }] }),
    },
    select: { id: true, postedAt: true, publishedAt: true, status: true },
  });
  const targetStatus = jobStatusForAction[action];

  const results = await prisma.$transaction(
    jobs.map((job) => prisma.job.update({
      where: { id: job.id },
      data: {
        status: targetStatus,
        ...(targetStatus === "PUBLISHED" && {
          postedAt: job.postedAt ?? new Date(),
          publishedAt: job.publishedAt ?? new Date(),
        }),
      },
      select: { id: true },
    })),
  );

  return { requested: ids.length, updated: results.length, skipped: ids.length - results.length, status: targetStatus };
}

export async function queueRawJobs(rawJobIds: string[]) {
  const rows = await prisma.rawJob.findMany({
    where: { id: { in: rawJobIds } },
    select: { id: true, sourceId: true, fetchStatus: true },
  });
  const bySource = new Map<string, typeof rows>();
  for (const row of rows) bySource.set(row.sourceId, [...(bySource.get(row.sourceId) ?? []), row]);

  for (const [sourceId, sourceRows] of bySource) {
    let run = await prisma.ingestRun.findFirst({
      where: { sourceId, status: { in: ["RUNNING", "PAUSED"] } },
      orderBy: { startedAt: "desc" },
      select: { id: true },
    });
    if (!run) run = await startIngestRun(sourceId);

    for (const row of sourceRows) {
      await prisma.rawJob.update({
        where: { id: row.id },
        data: {
          ingestRunId: run.id,
          active: true,
          fetchStatus: row.fetchStatus === "FETCHED" ? "FETCHED" : "PENDING",
          needsAggregation: true,
          aggregationClaimedAt: null,
        },
      });
    }
  }
  return rows.length;
}

export async function updateIssuesInBulk(ids: string[], action: BulkIssueAction) {
  const failures = await prisma.ingestFailure.findMany({
    where: { id: { in: ids }, status: { in: ["OPEN", "RETRYING"] } },
    select: { id: true, rawJobId: true, ingestRun: { select: { sourceId: true } } },
  });

  if (action === "RETRY") {
    const rawJobIds = [...new Set(failures.flatMap((failure) => failure.rawJobId ? [failure.rawJobId] : []))];
    const sourceIds = [...new Set(failures.filter((failure) => !failure.rawJobId).map((failure) => failure.ingestRun.sourceId))];
    const queued = await queueRawJobs(rawJobIds);
    if (sourceIds.length > 0) {
      await prisma.source.updateMany({ where: { id: { in: sourceIds } }, data: { lastRunAt: null } });
    }
    await prisma.ingestFailure.updateMany({
      where: { id: { in: failures.map((failure) => failure.id) } },
      data: { status: "RETRYING", resolvedAt: null },
    });
    return { requested: ids.length, updated: failures.length, queued, sourcesQueued: sourceIds.length, status: "RETRYING" as IngestFailureStatus };
  }

  const status: IngestFailureStatus = action === "DISMISS" ? "DISMISSED" : "RESOLVED";
  const result = await prisma.ingestFailure.updateMany({
    where: { id: { in: failures.map((failure) => failure.id) } },
    data: { status, resolvedAt: new Date() },
  });
  return { requested: ids.length, updated: result.count, queued: 0, sourcesQueued: 0, status };
}

export async function updateSourcesInBulk(ids: string[], action: BulkSourceAction) {
  const result = await prisma.source.updateMany({
    where: { id: { in: ids } },
    data: { enabled: action === "RESUME" },
  });
  return { requested: ids.length, updated: result.count, enabled: action === "RESUME" };
}
