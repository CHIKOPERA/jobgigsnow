import type { AgentInsightKind, JobIndustry, OpportunityCategory, Prisma, SouthAfricanProvince } from "@/generated/prisma/client";
import { opportunityCategories } from "@/config/categories";
import { jobIndustries, provinces } from "@/config/job-taxonomy";
import { prisma } from "@/lib/prisma";
import { runTick } from "@/lib/ingest/tick";
import { getAgentSettings } from "@/lib/ingest/settings";
import { publishReadyJobs } from "@/lib/ingest/publication-queue";
import type { CrawlConfig } from "@/lib/validation/source";
import { collectGoogleMetrics } from "./google-metrics";
import {
  buildLearningInsights,
  coverageMatchesForDeclaredCategories,
  scoreSources,
  type LearningInsight,
} from "./learning-policy";
import { johannesburgDateKey, johannesburgDayBounds } from "./time";

const categoryKeys = Object.keys(opportunityCategories) as OpportunityCategory[];
const industryKeys = Object.keys(jobIndustries) as JobIndustry[];
const provinceKeys = Object.keys(provinces) as SouthAfricanProvince[];

export async function collectDailySnapshot(agentRunId: string) {
  "use step";
  await prisma.dailyAgentRun.update({ where: { id: agentRunId }, data: { currentStage: "MEASURING" } });
  const now = new Date();
  const dateKey = johannesburgDateKey(now);
  const { start, end } = johannesburgDayBounds(now);
  const activeWhere = { status: "PUBLISHED" as const, OR: [{ closesAt: null }, { closesAt: { gte: now } }] };
  const [google, categoryRows, industryRows, provinceRows, savedJobs, publishedJobs] = await Promise.all([
    collectGoogleMetrics(now),
    prisma.job.groupBy({
      by: ["category"],
      where: activeWhere,
      _count: { _all: true },
    }),
    prisma.job.groupBy({
      by: ["industry"],
      where: activeWhere,
      _count: { _all: true },
    }),
    prisma.job.groupBy({
      by: ["province"],
      where: activeWhere,
      _count: { _all: true },
    }),
    prisma.savedJob.count({ where: { createdAt: { gte: start, lt: end } } }),
    prisma.job.count({ where: { publishedAt: { gte: start, lt: end } } }),
  ]);
  const categoryCounts = Object.fromEntries(categoryKeys.map((key) => [key, 0])) as Record<string, number>;
  for (const row of categoryRows) categoryCounts[row.category] = row._count._all;
  const industryCounts = Object.fromEntries(industryKeys.map((key) => [key, 0])) as Record<string, number>;
  for (const row of industryRows) industryCounts[row.industry] = row._count._all;
  const provinceCounts = Object.fromEntries(provinceKeys.map((key) => [key, 0])) as Record<string, number>;
  for (const row of provinceRows) provinceCounts[row.province] = row._count._all;

  await prisma.dailySiteMetric.upsert({
    where: { dateKey },
    create: {
      dateKey,
      measuredDate: google.measuredDate,
      pageViews: google.pageViews,
      activeUsers: google.activeUsers,
      engagedSessions: google.engagedSessions,
      applyClicks: google.applyClicks,
      searchClicks: google.searchClicks,
      searchImpressions: google.searchImpressions,
      searchCtr: google.searchCtr,
      searchPosition: google.searchPosition,
      savedJobs,
      publishedJobs,
      categoryCounts: categoryCounts as Prisma.InputJsonValue,
      industryCounts: industryCounts as Prisma.InputJsonValue,
      provinceCounts: provinceCounts as Prisma.InputJsonValue,
      topPages: google.topPages as unknown as Prisma.InputJsonValue,
      speed: google.speed as Prisma.InputJsonValue | undefined,
      integrations: google.integrations as Prisma.InputJsonValue,
    },
    update: {
      measuredDate: google.measuredDate,
      pageViews: google.pageViews,
      activeUsers: google.activeUsers,
      engagedSessions: google.engagedSessions,
      applyClicks: google.applyClicks,
      searchClicks: google.searchClicks,
      searchImpressions: google.searchImpressions,
      searchCtr: google.searchCtr,
      searchPosition: google.searchPosition,
      savedJobs,
      publishedJobs,
      categoryCounts: categoryCounts as Prisma.InputJsonValue,
      industryCounts: industryCounts as Prisma.InputJsonValue,
      provinceCounts: provinceCounts as Prisma.InputJsonValue,
      topPages: google.topPages as unknown as Prisma.InputJsonValue,
      speed: google.speed === null ? undefined : google.speed as Prisma.InputJsonValue,
      integrations: google.integrations as Prisma.InputJsonValue,
      collectedAt: now,
    },
  });
  return { dateKey, categoryCounts, industryCounts, provinceCounts, ...google, savedJobs, publishedJobs };
}

async function upsertInsights(insights: LearningInsight[]) {
  const seen = insights.map((insight) => insight.fingerprint);
  await Promise.all(insights.map((insight) => prisma.agentInsight.upsert({
    where: { fingerprint: insight.fingerprint },
    create: {
      ...insight,
      kind: insight.kind as AgentInsightKind,
      evidence: insight.evidence as Prisma.InputJsonValue,
    },
    update: {
      kind: insight.kind as AgentInsightKind,
      status: "ACTIVE",
      title: insight.title,
      detail: insight.detail,
      action: insight.action,
      confidence: insight.confidence,
      evidence: insight.evidence as Prisma.InputJsonValue,
      lastSeenAt: new Date(),
      resolvedAt: null,
    },
  })));
  await prisma.agentInsight.updateMany({
    where: { status: "ACTIVE", ...(seen.length > 0 && { fingerprint: { notIn: seen } }) },
    data: { status: "RESOLVED", resolvedAt: new Date() },
  });
}

export async function learnFromDailySnapshot(agentRunId: string, dateKey: string) {
  "use step";
  await prisma.dailyAgentRun.update({ where: { id: agentRunId }, data: { currentStage: "LEARNING" } });
  const [metric, settings, sources] = await Promise.all([
    prisma.dailySiteMetric.findUniqueOrThrow({ where: { dateKey } }),
    getAgentSettings(),
    prisma.source.findMany({
      where: { enabled: true },
      select: {
        id: true,
        name: true,
        crawlConfig: true,
        ingestRuns: {
          where: { startedAt: { gte: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000) } },
          select: { discoveredCount: true, failedCount: true, validationFailedCount: true, aiFailedCount: true },
        },
        rawJobs: {
          where: { discoveredAt: { gte: new Date(Date.now() - 90 * 24 * 60 * 60 * 1000) } },
          select: { job: { select: { category: true, industry: true, province: true, status: true, publishedAt: true } } },
        },
      },
    }),
  ]);
  const categoryCounts = metric.categoryCounts as Record<string, number>;
  const industryCounts = metric.industryCounts as Record<string, number>;
  const categoryLabels = Object.fromEntries(categoryKeys.map((key) => [key, opportunityCategories[key].label]));
  const profiles = new Map<string, Prisma.InputJsonValue>();
  const sourceInputs = sources.map((source) => {
    const crawlConfig = source.crawlConfig as unknown as CrawlConfig;
    const declaredCategories = [...new Set([
      ...(crawlConfig.categoryHint ? [crawlConfig.categoryHint] : []),
      ...(crawlConfig.coverageHints ?? []),
    ])];
    const jobs = source.rawJobs.flatMap((raw) => raw.job ? [raw.job] : []);
    const specialtiesFor = (
      dimension: "industry" | "opportunityType" | "province",
      values: string[],
      labelFor: (value: string) => string,
    ) => values.map((value) => ({
      dimension,
      value,
      label: labelFor(value),
      count: jobs.filter((job) => job[dimension === "industry" ? "industry" : dimension === "province" ? "province" : "category"] === value).length,
      published: jobs.filter((job) => job[dimension === "industry" ? "industry" : dimension === "province" ? "province" : "category"] === value && job.status === "PUBLISHED").length,
    })).filter((item) => item.count > 0).sort((a, b) => b.count - a.count || b.published - a.published);
    const industries = specialtiesFor("industry", industryKeys, (value) => jobIndustries[value as JobIndustry]);
    const opportunityTypes = specialtiesFor("opportunityType", categoryKeys, (value) => opportunityCategories[value as OpportunityCategory].label);
    const sourceProvinces = specialtiesFor("province", provinceKeys, (value) => provinces[value as SouthAfricanProvince]);
    const specialties = [...industries.slice(0, 4), ...opportunityTypes.slice(0, 3), ...sourceProvinces.slice(0, 3)];
    const historicalCoverageMatches = [
      ...industries.filter((item) => item.value !== "OTHER" && (industryCounts[item.value] ?? 0) < settings.categoryMinimum),
      ...opportunityTypes.filter((item) => (categoryCounts[item.value] ?? 0) < settings.categoryMinimum),
    ].sort((a, b) => b.count - a.count).map((item) => item.label);
    const coverageMatches = [...new Set([
      ...historicalCoverageMatches,
      ...coverageMatchesForDeclaredCategories(
        declaredCategories,
        categoryCounts,
        settings.categoryMinimum,
        categoryLabels,
      ),
    ])].slice(0, 3);
    profiles.set(source.id, {
      sampleSize: jobs.length,
      declaredOpportunityTypes: declaredCategories,
      industries: industries.slice(0, 4),
      opportunityTypes: opportunityTypes.slice(0, 3),
      provinces: sourceProvinces.slice(0, 3),
      updatedAt: new Date().toISOString(),
    } as unknown as Prisma.InputJsonValue);
    return {
      id: source.id,
      name: source.name,
      runs: source.ingestRuns.length,
      discovered: source.ingestRuns.reduce((sum, run) => sum + run.discoveredCount, 0),
      failures: source.ingestRuns.reduce(
        (sum, run) => sum + run.failedCount + run.validationFailedCount + run.aiFailedCount,
        0,
      ),
      published: source.rawJobs.filter((raw) => raw.job?.status === "PUBLISHED" && raw.job.publishedAt !== null).length,
      coverageMatches,
      specialties,
    };
  });
  const learnedSources = scoreSources(sourceInputs);
  await Promise.all(learnedSources.map((source) => prisma.source.update({
    where: { id: source.id },
    data: { agentPriority: source.score, agentReason: source.reason, agentProfile: profiles.get(source.id) },
  })));

  const integrations = metric.integrations as Record<string, { connected: boolean }>;
  const speed = metric.speed as Record<string, number> | null;
  const insights = buildLearningInsights({
    pageViews: metric.pageViews,
    dailyViewGoal: settings.dailyViewGoal,
    categoryCounts,
    industryCounts,
    categoryMinimum: settings.categoryMinimum,
    sources: learnedSources,
    speed,
    integrations,
  });
  const topPages = (metric.topPages ?? []) as unknown as Array<{ page: string; impressions: number; ctr: number; position: number }>;
  const ctrOpportunity = topPages.find((page) => page.impressions >= 20 && page.ctr < 0.03 && page.position <= 20);
  if (ctrOpportunity) {
    const pagePath = new URL(ctrOpportunity.page).pathname;
    insights.push({
      fingerprint: `content:low-ctr:${pagePath}`,
      kind: "CONTENT",
      title: "A visible page is earning few clicks",
      detail: `${new URL(ctrOpportunity.page).pathname} has ${ctrOpportunity.impressions} impressions and ${(ctrOpportunity.ctr * 100).toFixed(1)}% CTR.`,
      action: "Review its search description, opening paragraph and internal links while preserving the official opportunity title.",
      confidence: Math.min(1, ctrOpportunity.impressions / 200),
      evidence: { page: ctrOpportunity.page, impressions: ctrOpportunity.impressions, ctr: ctrOpportunity.ctr, position: ctrOpportunity.position },
    });
    const hypothesis = `Improving the search description and opening guidance for ${pagePath} will increase its search click-through rate.`;
    const existingExperiment = await prisma.agentExperiment.findFirst({
      where: { hypothesis, status: { in: ["PROPOSED", "RUNNING"] } },
      select: { id: true },
    });
    if (!existingExperiment) {
      await prisma.agentExperiment.create({
        data: {
          hypothesis,
          metric: "Search click-through rate after 7 and 28 days",
          change: "Review the meta description, opening paragraph and internal links; preserve all official facts and the official title.",
          baseline: { impressions: ctrOpportunity.impressions, ctr: ctrOpportunity.ctr, position: ctrOpportunity.position } as Prisma.InputJsonValue,
        },
      });
    }
  }
  await upsertInsights(insights);
  await prisma.dailySiteMetric.update({
    where: { dateKey },
    data: { sourceScores: learnedSources as unknown as Prisma.InputJsonValue },
  });
  return { insightCount: insights.length, sourceCount: learnedSources.length };
}

export async function runGoalManagedPublishing(agentRunId: string, cycle: number) {
  "use step";
  await prisma.dailyAgentRun.update({ where: { id: agentRunId }, data: { currentStage: "PUBLISHING" } });
  const settings = await getAgentSettings();
  if (!settings.agentEnabled) return { cycle, skipped: true, reason: "The daily manager is paused.", published: 0 };
  const { start, end } = johannesburgDayBounds();
  const alreadyPublished = await prisma.job.count({ where: { publishedAt: { gte: start, lt: end } } });
  const remaining = Math.max(0, settings.dailyPublishMax - alreadyPublished);
  const ready = await publishReadyJobs(remaining);
  const result = await runTick(undefined, { maxPublications: Math.max(0, remaining - ready.published) });
  return {
    cycle,
    skipped: false,
    published: ready.published + result.aggregationProcessed,
    publishedFromQueue: ready.published,
    expiredInQueue: ready.expired,
    queued: result.sourceRuns.reduce((sum, run) => sum + run.queued, 0),
    processed: result.acquisitionProcessed,
    sourcesChecked: result.discoveryRunIds.length,
  };
}

export async function finishAgentRun(agentRunId: string, dateKey: string, learning: unknown, publishing: unknown, indexing: unknown) {
  "use step";
  const { start, end } = johannesburgDayBounds();
  const publishedJobs = await prisma.job.count({ where: { publishedAt: { gte: start, lt: end } } });
  await prisma.dailySiteMetric.update({ where: { dateKey }, data: { publishedJobs } });
  await prisma.dailyAgentRun.update({
    where: { id: agentRunId },
    data: {
      status: "COMPLETED",
      currentStage: "COMPLETED",
      summary: { learning, publishing, indexing, publishedJobs } as Prisma.InputJsonValue,
      finishedAt: new Date(),
    },
  });
  return { publishedJobs };
}

export async function failAgentRun(agentRunId: string, message: string) {
  "use step";
  await prisma.dailyAgentRun.update({
    where: { id: agentRunId },
    data: { status: "FAILED", currentStage: "FAILED", error: message.slice(0, 1_000), finishedAt: new Date() },
  });
}
