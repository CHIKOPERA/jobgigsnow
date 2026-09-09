import type { Metadata } from "next";
import { site } from "@/config";
import { prisma } from "@/lib/prisma";
import { opportunityCategories } from "@/config/categories";
import { getAgentSettings } from "@/lib/ingest/settings";
import { JobsShell } from "./JobsShell";

interface JobsPageProps {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}

export async function generateMetadata({ searchParams }: JobsPageProps): Promise<Metadata> {
  const raw = await searchParams;
  const isFiltered = Object.values(raw).some((value) => value !== undefined && value !== "");
  const category = typeof raw.category === "string" && raw.category in opportunityCategories
    ? raw.category as keyof typeof opportunityCategories
    : null;
  const categoryOnly = category !== null && Object.entries(raw).every(([key, value]) => key === "category" || value === undefined || value === "");
  const [publishedCount, settings] = await Promise.all([
    prisma.job.count({ where: { status: "PUBLISHED", ...(categoryOnly && { category }) } }),
    getAgentSettings(),
  ]);
  const categoryIsReady = categoryOnly && publishedCount >= settings.categoryMinimum;
  const label = category ? opportunityCategories[category].label : null;
  const canonical = categoryIsReady
    ? `${site.url.replace(/\/$/, "")}/jobs?category=${category}`
    : `${site.url.replace(/\/$/, "")}/jobs`;

  return {
    title: categoryIsReady ? label : isFiltered ? "Search jobs" : "Jobs",
    description: categoryIsReady
      ? `Browse current ${label?.toLowerCase()} with requirements, deadlines and official application links.`
      : "Browse current jobs, internships, learnerships, funding and early-career opportunities.",
    alternates: { canonical },
    robots: { index: (!isFiltered && publishedCount > 0) || categoryIsReady, follow: true },
  };
}

export default async function JobsPage({ searchParams }: JobsPageProps) {
  return <JobsShell searchParams={await searchParams} />;
}
