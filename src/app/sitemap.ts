import type { MetadataRoute } from "next";
import { site } from "@/config";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const baseUrl = site.url.replace(/\/$/, "");
  const [jobs, articles, courses] = await Promise.all([
    prisma.job.findMany({
      where: { status: "PUBLISHED" },
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
  ]);

  const staticPages: MetadataRoute.Sitemap = [
    { url: `${baseUrl}/about`, changeFrequency: "monthly", priority: 0.6 },
    { url: `${baseUrl}/contact`, changeFrequency: "yearly", priority: 0.4 },
    { url: `${baseUrl}/editorial-policy`, changeFrequency: "monthly", priority: 0.5 },
    { url: `${baseUrl}/privacy`, changeFrequency: "yearly", priority: 0.3 },
    { url: `${baseUrl}/terms`, changeFrequency: "yearly", priority: 0.3 },
  ];

  if (jobs.length > 0) {
    staticPages.unshift({ url: `${baseUrl}/jobs`, changeFrequency: "daily", priority: 1 });
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
