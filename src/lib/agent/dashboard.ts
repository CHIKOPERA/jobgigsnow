import "server-only";
import type { JobIndustry, OpportunityCategory } from "@/generated/prisma/client";
import { opportunityCategories } from "@/config/categories";
import { jobIndustries } from "@/config/job-taxonomy";
import { prisma } from "@/lib/prisma";
import { getAgentSettings } from "@/lib/ingest/settings";
import { johannesburgDateKey, johannesburgDayBounds } from "./time";

export async function getAgentDashboard() {
  const now = new Date();
  const { start, end } = johannesburgDayBounds(now);
  const [settings, latestMetric, recentMetrics, latestRun, insights, experiments, categoryRows, industryRows, publishedToday, sources] = await Promise.all([
    getAgentSettings(),
    prisma.dailySiteMetric.findFirst({ orderBy: { dateKey: "desc" } }),
    prisma.dailySiteMetric.findMany({
      where: { pageViews: { not: null } },
      orderBy: { dateKey: "desc" },
      take: 7,
      select: { pageViews: true },
    }),
    prisma.dailyAgentRun.findFirst({ orderBy: { startedAt: "desc" } }),
    prisma.agentInsight.findMany({ where: { status: "ACTIVE" }, orderBy: [{ confidence: "desc" }, { lastSeenAt: "desc" }], take: 12 }),
    prisma.agentExperiment.findMany({ where: { status: { in: ["PROPOSED", "RUNNING"] } }, orderBy: { createdAt: "desc" }, take: 5 }),
    prisma.job.groupBy({
      by: ["category"],
      where: { status: "PUBLISHED", OR: [{ closesAt: null }, { closesAt: { gte: now } }] },
      _count: { _all: true },
    }),
    prisma.job.groupBy({
      by: ["industry"],
      where: { status: "PUBLISHED", OR: [{ closesAt: null }, { closesAt: { gte: now } }] },
      _count: { _all: true },
    }),
    prisma.job.count({ where: { publishedAt: { gte: start, lt: end } } }),
    prisma.source.findMany({
      where: { enabled: true },
      orderBy: [{ agentPriority: "desc" }, { name: "asc" }],
      take: 8,
      select: { id: true, name: true, agentPriority: true, agentReason: true, agentProfile: true },
    }),
  ]);
  const counts = new Map(categoryRows.map((row) => [row.category, row._count._all]));
  const categories = (Object.keys(opportunityCategories) as OpportunityCategory[]).map((category) => ({
    category,
    label: opportunityCategories[category].label,
    count: counts.get(category) ?? 0,
    goal: settings.categoryMinimum,
  }));
  const industryCountMap = new Map(industryRows.map((row) => [row.industry, row._count._all]));
  const industries = (Object.keys(jobIndustries) as JobIndustry[])
    .filter((industry) => industry !== "OTHER")
    .map((industry) => ({
      industry,
      label: jobIndustries[industry],
      count: industryCountMap.get(industry) ?? 0,
      goal: settings.categoryMinimum,
    }));
  const measuredViews = recentMetrics.flatMap((metric) => metric.pageViews === null ? [] : [metric.pageViews]);
  const sevenDayAverage = measuredViews.length > 0
    ? Math.round(measuredViews.reduce((sum, value) => sum + value, 0) / measuredViews.length)
    : null;
  return {
    dateKey: johannesburgDateKey(now),
    settings,
    latestMetric,
    latestRun,
    insights,
    experiments,
    categories,
    industries,
    publishedToday,
    sevenDayAverage,
    sources,
  };
}
