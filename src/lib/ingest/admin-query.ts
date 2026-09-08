import "server-only";
import type { JobStatus } from "@/generated/prisma/client";
import { prisma } from "@/lib/prisma";
import type { ListFailuresQuery, ListRunsQuery } from "@/lib/validation/admin";
import { groupFailures } from "./issue-groups";
import { queueRawJobs } from "./admin-operations";

const runListSelect = {
  id: true,
  sourceId: true,
  status: true,
  startedAt: true,
  finishedAt: true,
  discoveredCount: true,
  newCount: true,
  changedCount: true,
  unchangedCount: true,
  missingCount: true,
  inactiveCount: true,
  failedCount: true,
  validationFailedCount: true,
  aiFailedCount: true,
  currentStage: true,
  currentJobTitle: true,
  heartbeatAt: true,
  source: { select: { id: true, name: true } },
} as const;

export async function listRuns(query: ListRunsQuery) {
  const rows = await prisma.ingestRun.findMany({
    where: {
      ...(query.sourceId && { sourceId: query.sourceId }),
      ...(query.status && { status: query.status }),
    },
    select: runListSelect,
    orderBy: [{ startedAt: "desc" }, { id: "desc" }],
    take: query.limit + 1,
    ...(query.cursor && { cursor: { id: query.cursor }, skip: 1 }),
  });

  const hasMore = rows.length > query.limit;
  const page = hasMore ? rows.slice(0, query.limit) : rows;
  return { runs: page, nextCursor: hasMore ? page[page.length - 1].id : null };
}

export async function getRunDetail(id: string) {
  const run = await prisma.ingestRun.findUnique({
    where: { id },
    select: { ...runListSelect, source: { select: { id: true, name: true, baseUrl: true } } },
  });
  if (!run) return null;

  const [rawJobs, failures, rawTotal, fetched, fetchFailed, aggregationComplete, reviewReady, published] = await Promise.all([
    prisma.rawJob.findMany({
      where: { ingestRunId: id },
      orderBy: { updatedAt: "desc" },
      take: 100,
      select: {
        id: true,
        externalUrl: true,
        fetchStatus: true,
        active: true,
        needsAggregation: true,
        httpStatus: true,
        lastCrawledAt: true,
        job: { select: { id: true, slug: true, status: true } },
      },
    }),
    prisma.ingestFailure.findMany({
      where: { ingestRunId: id },
      orderBy: { createdAt: "desc" },
      take: 100,
      select: { id: true, stage: true, url: true, message: true, createdAt: true, rawJobId: true, status: true },
    }),
    prisma.rawJob.count({ where: { ingestRunId: id } }),
    prisma.rawJob.count({ where: { ingestRunId: id, fetchStatus: "FETCHED" } }),
    prisma.rawJob.count({ where: { ingestRunId: id, fetchStatus: "FAILED" } }),
    prisma.rawJob.count({ where: { ingestRunId: id, fetchStatus: "FETCHED", needsAggregation: false } }),
    prisma.rawJob.count({ where: { ingestRunId: id, job: { status: "READY" } } }),
    prisma.rawJob.count({ where: { ingestRunId: id, job: { status: "PUBLISHED" } } }),
  ]);

  return {
    run,
    rawJobs,
    failures,
    progress: {
      rawTotal,
      acquisitionComplete: fetched + fetchFailed,
      acquisitionFailed: fetchFailed,
      aggregationTotal: fetched,
      aggregationComplete,
      reviewReady,
      published,
    },
  };
}

export async function getRawJobDetail(id: string) {
  return prisma.rawJob.findUnique({
    where: { id },
    select: {
      id: true,
      sourceId: true,
      source: { select: { id: true, name: true } },
      externalId: true,
      externalUrl: true,
      canonicalUrl: true,
      httpStatus: true,
      fetchStatus: true,
      contentHash: true,
      active: true,
      needsAggregation: true,
      consecutiveMissingRuns: true,
      discoveredAt: true,
      lastSeenAt: true,
      lastCrawledAt: true,
      lastChangedAt: true,
      payload: true,
      job: { select: { id: true, slug: true, title: true, status: true } },
      improvementRuns: {
        orderBy: { createdAt: "desc" },
        take: 20,
        select: {
          id: true,
          model: true,
          promptVersion: true,
          status: true,
          inputTokens: true,
          outputTokens: true,
          diff: true,
          createdAt: true,
        },
      },
      ingestFailures: {
        orderBy: { createdAt: "desc" },
        take: 20,
        select: { id: true, stage: true, message: true, detail: true, createdAt: true },
      },
    },
  });
}

export async function listFailures(query: ListFailuresQuery) {
  const rows = await prisma.ingestFailure.findMany({
    where: {
      ...(query.stage && { stage: query.stage }),
      ...(query.sourceId && { ingestRun: { sourceId: query.sourceId } }),
      ...(query.status && { status: query.status }),
    },
    orderBy: [{ createdAt: "desc" }, { id: "desc" }],
    take: query.limit + 1,
    ...(query.cursor && { cursor: { id: query.cursor }, skip: 1 }),
    select: {
      id: true,
      stage: true,
      url: true,
      message: true,
      createdAt: true,
      rawJobId: true,
      status: true,
      ingestRun: { select: { id: true, sourceId: true, source: { select: { name: true } } } },
    },
  });

  const hasMore = rows.length > query.limit;
  const page = hasMore ? rows.slice(0, query.limit) : rows;
  return { failures: page, nextCursor: hasMore ? page[page.length - 1].id : null };
}

export async function getDashboardStats() {
  const startOfDay = new Date();
  startOfDay.setHours(0, 0, 0, 0);

  const [activeSources, runsToday, discoveredToday, openFailures, recentRuns, recentFailures] = await Promise.all([
    prisma.source.count({ where: { enabled: true } }),
    prisma.ingestRun.count({ where: { startedAt: { gte: startOfDay } } }),
    prisma.ingestRun.aggregate({
      where: { startedAt: { gte: startOfDay } },
      _sum: { newCount: true },
    }),
    prisma.ingestFailure.count({ where: { createdAt: { gte: startOfDay } } }),
    prisma.ingestRun.findMany({
      orderBy: { startedAt: "desc" },
      take: 10,
      select: { ...runListSelect },
    }),
    prisma.ingestFailure.findMany({
      orderBy: { createdAt: "desc" },
      take: 10,
      select: {
        id: true,
        stage: true,
        url: true,
        message: true,
        createdAt: true,
        ingestRun: { select: { source: { select: { name: true } } } },
      },
    }),
  ]);

  return {
    activeSources,
    runsToday,
    jobsDiscoveredToday: discoveredToday._sum.newCount ?? 0,
    openFailuresToday: openFailures,
    recentRuns,
    recentFailures,
  };
}

export async function listIssueGroups({ includeResolved = false, limit = 250 }: { includeResolved?: boolean; limit?: number } = {}) {
  const failures = await prisma.ingestFailure.findMany({
    where: includeResolved ? undefined : { status: { in: ["OPEN", "RETRYING"] } },
    orderBy: { createdAt: "desc" },
    take: limit,
    select: {
      id: true,
      stage: true,
      message: true,
      url: true,
      rawJobId: true,
      createdAt: true,
      status: true,
      ingestRun: { select: { sourceId: true, source: { select: { name: true } } } },
    },
  });
  return groupFailures(failures);
}

export async function listActiveRunsWithProgress() {
  const runs = await prisma.ingestRun.findMany({
    where: { status: { in: ["RUNNING", "PAUSED"] } },
    orderBy: { startedAt: "asc" },
    take: 10,
    select: runListSelect,
  });
  return Promise.all(runs.map(async (run) => {
    const rows = await prisma.rawJob.findMany({
      where: { ingestRunId: run.id, active: true },
      select: { fetchStatus: true, needsAggregation: true, job: { select: { status: true } } },
    });
    return {
      ...run,
      total: rows.length,
      processed: rows.filter((row) => row.fetchStatus === "FAILED" || (row.fetchStatus === "FETCHED" && !row.needsAggregation)).length,
      published: rows.filter((row) => row.job?.status === "PUBLISHED").length,
      failed: run.failedCount + run.validationFailedCount + run.aiFailedCount,
    };
  }));
}

export async function getOperationsDashboard() {
  const startOfDay = new Date();
  startOfDay.setHours(0, 0, 0, 0);

  const [activeSources, pausedSources, readyToPublish, publishedToday, foundToday, activeRuns, failures, sources] = await Promise.all([
    prisma.source.count({ where: { enabled: true } }),
    prisma.source.count({ where: { enabled: false } }),
    prisma.job.count({ where: { status: "READY", OR: [{ rawJobId: null }, { rawJob: { needsAggregation: false } }] } }),
    prisma.job.count({ where: { status: "PUBLISHED", postedAt: { gte: startOfDay } } }),
    prisma.ingestRun.aggregate({ where: { startedAt: { gte: startOfDay } }, _sum: { newCount: true } }),
    listActiveRunsWithProgress(),
    prisma.ingestFailure.findMany({
      where: { status: { in: ["OPEN", "RETRYING"] } },
      orderBy: { createdAt: "desc" },
      take: 250,
      select: {
        id: true, stage: true, message: true, url: true, rawJobId: true, createdAt: true, status: true,
        ingestRun: { select: { sourceId: true, source: { select: { name: true } } } },
      },
    }),
    prisma.source.findMany({
      orderBy: [{ enabled: "desc" }, { name: "asc" }],
      take: 8,
      select: {
        id: true, name: true, enabled: true, lastRunAt: true, cadenceMinutes: true,
        ingestRuns: { orderBy: { startedAt: "desc" }, take: 1, select: runListSelect },
      },
    }),
  ]);

  const issueGroups = groupFailures(failures);
  const openIssueCount = issueGroups.reduce((sum, issue) => sum + issue.affectedCount, 0);
  const issuesBySource = new Map<string, number>();
  for (const issue of issueGroups) issuesBySource.set(issue.sourceId, (issuesBySource.get(issue.sourceId) ?? 0) + issue.affectedCount);

  return {
    metrics: {
      foundToday: foundToday._sum.newCount ?? 0,
      publishedToday,
      readyToPublish,
      openIssues: openIssueCount,
      activeSources,
      pausedSources,
    },
    activeRuns,
    issueGroups: issueGroups.slice(0, 3),
    sources: sources.map((source) => ({
      id: source.id,
      name: source.name,
      enabled: source.enabled,
      lastRunAt: source.lastRunAt,
      cadenceMinutes: source.cadenceMinutes,
      issueCount: issuesBySource.get(source.id) ?? 0,
      latestRun: source.ingestRuns[0] ?? null,
    })),
  };
}

export async function listAdminJobs({
  query = "",
  category,
  status,
  page = 1,
  pageSize = 30,
}: {
  query?: string;
  category?: "JOB" | "INTERNSHIP" | "LEARNERSHIP" | "APPRENTICESHIP" | "GRADUATE_PROGRAMME" | "CALL_FOR_APPLICATIONS" | "FUNDING";
  status?: JobStatus;
  page?: number;
  pageSize?: number;
}) {
  const where = {
    ...(status && { status }),
    ...(category && { category }),
    ...(query && {
      OR: [
        { title: { contains: query, mode: "insensitive" as const } },
        { company: { name: { contains: query, mode: "insensitive" as const } } },
        { location: { contains: query, mode: "insensitive" as const } },
      ],
    }),
  };
  const [jobs, total, grouped] = await Promise.all([
    prisma.job.findMany({
      where,
      orderBy: [{ updatedAt: "desc" }, { id: "desc" }],
      skip: (page - 1) * pageSize,
      take: pageSize,
      select: {
        id: true, slug: true, title: true, category: true, location: true, status: true,
        postedAt: true, updatedAt: true, socialImageUrl: true,
        company: { select: { name: true } },
        rawJob: { select: { source: { select: { name: true } } } },
      },
    }),
    prisma.job.count({ where }),
    prisma.job.groupBy({ by: ["status"], _count: { _all: true } }),
  ]);
  return {
    jobs,
    total,
    page,
    pageSize,
    pageCount: Math.max(1, Math.ceil(total / pageSize)),
    counts: Object.fromEntries(grouped.map((row) => [row.status, row._count._all])) as Partial<Record<JobStatus, number>>,
  };
}

export async function listSourcesWithHealth() {
  const [sources, failures] = await Promise.all([
    prisma.source.findMany({
      orderBy: { name: "asc" },
      select: {
        id: true, name: true, baseUrl: true, enabled: true, lastRunAt: true, cadenceMinutes: true,
        ingestRuns: {
          orderBy: { startedAt: "desc" },
          take: 1,
          select: {
            id: true, status: true, startedAt: true, newCount: true, failedCount: true,
            validationFailedCount: true, aiFailedCount: true,
          },
        },
      },
    }),
    prisma.ingestFailure.findMany({
      where: { status: { in: ["OPEN", "RETRYING"] } },
      select: { id: true, rawJobId: true, ingestRun: { select: { sourceId: true } } },
      take: 500,
    }),
  ]);
  const uniqueBySource = new Map<string, Set<string>>();
  for (const failure of failures) {
    const sourceId = failure.ingestRun.sourceId;
    const ids = uniqueBySource.get(sourceId) ?? new Set<string>();
    ids.add(failure.rawJobId ?? failure.id);
    uniqueBySource.set(sourceId, ids);
  }
  return sources.map((source) => ({
    ...source,
    latestRun: source.ingestRuns[0] ?? null,
    issueCount: uniqueBySource.get(source.id)?.size ?? 0,
  }));
}

export async function listReviewJobs() {
  const pending = await prisma.job.findMany({
    where: {
      status: "READY",
      OR: [{ rawJobId: null }, { rawJob: { needsAggregation: false } }],
    },
    orderBy: { updatedAt: "desc" },
    take: 100,
    select: {
      id: true,
      title: true,
      status: true,
      location: true,
      updatedAt: true,
      company: { select: { name: true } },
      rawJob: { select: { source: { select: { name: true } } } },
    },
  });
  return { pending };
}

export async function listPublishedJobs({
  query = "",
  category,
  page = 1,
  pageSize = 30,
}: {
  query?: string;
  category?: "JOB" | "INTERNSHIP" | "LEARNERSHIP" | "APPRENTICESHIP" | "GRADUATE_PROGRAMME" | "CALL_FOR_APPLICATIONS" | "FUNDING";
  page?: number;
  pageSize?: number;
}) {
  const where = {
    status: "PUBLISHED" as const,
    ...(category && { category }),
    ...(query && {
      OR: [
        { title: { contains: query, mode: "insensitive" as const } },
        { company: { name: { contains: query, mode: "insensitive" as const } } },
        { location: { contains: query, mode: "insensitive" as const } },
      ],
    }),
  };
  const [jobs, total] = await Promise.all([
    prisma.job.findMany({
      where,
      orderBy: [{ postedAt: "desc" }, { updatedAt: "desc" }],
      skip: (page - 1) * pageSize,
      take: pageSize,
      select: {
        id: true,
        slug: true,
        title: true,
        category: true,
        location: true,
        postedAt: true,
        updatedAt: true,
        socialImageUrl: true,
        company: { select: { name: true } },
      },
    }),
    prisma.job.count({ where }),
  ]);
  return { jobs, total, page, pageSize, pageCount: Math.max(1, Math.ceil(total / pageSize)) };
}

export async function getReviewJob(id: string) {
  return prisma.job.findUnique({
    where: { id },
    select: {
      id: true,
      slug: true,
      title: true,
      status: true,
      category: true,
      location: true,
      remoteType: true,
      employmentType: true,
      description: true,
      highlights: true,
      applyUrl: true,
      rewritePrompt: true,
      socialImageUrl: true,
      socialImageAlt: true,
      socialImageCredit: true,
      socialImageSourceUrl: true,
      updatedAt: true,
      company: { select: { name: true } },
      rawJob: { select: { id: true, externalUrl: true, source: { select: { name: true } } } },
    },
  });
}

export type ReprocessOutcome = "requeued_fetch" | "requeued_aggregation" | "not_found";

/** Resets a RawJob so the next cron tick retries it — fetch if it never succeeded, aggregation
 *  otherwise (Section E's admin raw-job "Reprocess" action). */
export async function reprocessRawJob(id: string): Promise<ReprocessOutcome> {
  const row = await prisma.rawJob.findUnique({ where: { id }, select: { fetchStatus: true } });
  if (!row) return "not_found";
  await queueRawJobs([id]);
  await prisma.ingestFailure.updateMany({
    where: { rawJobId: id, status: { in: ["OPEN", "RETRYING"] } },
    data: { status: "RETRYING", resolvedAt: null },
  });
  return row.fetchStatus === "FETCHED" ? "requeued_aggregation" : "requeued_fetch";
}
