import type { MetadataRoute } from "next";
import { site } from "@/config";
import { prisma } from "@/lib/prisma";
import { opportunityCategories } from "@/config/categories";
import { getAgentSettings } from "@/lib/ingest/settings";
import { activePublishedJobWhere } from "@/lib/job-filters";

export const dynamic = "force-dynamic";

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const baseUrl = site.url.replace(/\/$/, "");
  const activeJobs = activePublishedJobWhere();
  const [jobs, articles, courses, categoryRows, settings] = await Promise.all([
    prisma.job.findMany({
      where: activeJobs,
      select: { slug: true, updatedAt: true },
      orderBy: { updatedAt: "desc" },
      take: 45_000,
    }),
    prisma.article.findMany({
      where: { published: true },
      select: { slug: true, updatedAt: true },
      orderBy: { updatedAt: "desc" },
      take: 2_500,
    }),
    prisma.course.findMany({
      where: { published: true },
      select: { slug: true, updatedAt: true },
      orderBy: { updatedAt: "desc" },
      take: 2_500,
    }),
    prisma.job.groupBy({ by: ["category"], where: activeJobs, _count: { _all: true } }),
    getAgentSettings(),
  ]);

  const staticPages: MetadataRoute.Sitemap = [
    { url: baseUrl, changeFrequency: "daily", priority: 1 },
    { url: `${baseUrl}/about`, changeFrequency: "monthly", priority: 0.6 },
    { url: `${baseUrl}/contact`, changeFrequency: "yearly", priority: 0.4 },
    { url: `${baseUrl}/editorial-policy`, changeFrequency: "monthly", priority: 0.5 },
    { url: `${baseUrl}/privacy`, changeFrequency: "yearly", priority: 0.3 },
    { url: `${baseUrl}/terms`, changeFrequency: "yearly", priority: 0.3 },
  ];

  if (jobs.length > 0) {
    staticPages.unshift({ url: `${baseUrl}/jobs`, changeFrequency: "daily", priority: 1 });
    for (const row of categoryRows) {
      if (row._count._all < settings.categoryMinimum) continue;
      staticPages.push({
        url: `${baseUrl}/jobs?category=${row.category}`,
        changeFrequency: "daily",
        priority: opportunityCategories[row.category] ? 0.85 : 0.7,
      });
    }
  }
  if (articles.length > 0) {
    staticPages.push({ url: `${baseUrl}/articles`, changeFrequency: "weekly", priority: 0.8 });
  }
  if (courses.length > 0) {
    staticPages.push({ url: `${baseUrl}/courses`, changeFrequency: "weekly", priority: 0.7 });
  }

  return [
    ...staticPages,
    ...jobs.map((job) => ({
      url: `${baseUrl}/jobs/${job.slug}`,
      lastModified: job.updatedAt,
      changeFrequency: "weekly" as const,
      priority: 0.8,
    })),
    ...articles.map((article) => ({
      url: `${baseUrl}/articles/${article.slug}`,
      lastModified: article.updatedAt,
      changeFrequency: "monthly" as const,
      priority: 0.7,
    })),
    ...courses.map((course) => ({
      url: `${baseUrl}/courses/${course.slug}`,
      lastModified: course.updatedAt,
      changeFrequency: "monthly" as const,
      priority: 0.6,
    })),
  ];
}
