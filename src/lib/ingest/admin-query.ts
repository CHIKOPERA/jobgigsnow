import "server-only";
import { prisma } from "@/lib/prisma";
import type { ListFailuresQuery, ListRunsQuery } from "@/lib/validation/admin";

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
      select: { id: true, stage: true, url: true, message: true, createdAt: true, rawJobId: true },
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

export async function listReviewJobs() {
  const [pending, recentlyPublished] = await Promise.all([
    prisma.job.findMany({
      where: { status: { in: ["READY", "IMPROVING"] } },
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
    }),
    prisma.job.findMany({
      where: { status: "PUBLISHED" },
      orderBy: { updatedAt: "desc" },
      take: 12,
      select: { id: true, slug: true, title: true, updatedAt: true, company: { select: { name: true } } },
    }),
  ]);
  return { pending, recentlyPublished };
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

  if (row.fetchStatus === "FETCHED") {
    await prisma.rawJob.update({ where: { id }, data: { needsAggregation: true, aggregationClaimedAt: null } });
    return "requeued_aggregation";
  }

  await prisma.rawJob.update({ where: { id }, data: { fetchStatus: "PENDING" } });
  return "requeued_fetch";
}
