import type { Metadata } from "next";
import { site } from "@/config";
import { prisma } from "@/lib/prisma";
import { JobsShell } from "./JobsShell";

interface JobsPageProps {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}

export async function generateMetadata({ searchParams }: JobsPageProps): Promise<Metadata> {
  const raw = await searchParams;
  const isFiltered = Object.values(raw).some((value) => value !== undefined && value !== "");
  const hasJobs = isFiltered || (await prisma.job.count({ where: { status: "PUBLISHED" } })) > 0;

  return {
    title: isFiltered ? "Search jobs" : "Jobs",
    description: "Browse current jobs, internships, learnerships, funding and early-career opportunities.",
    alternates: { canonical: `${site.url.replace(/\/$/, "")}/jobs` },
    robots: { index: !isFiltered && hasJobs, follow: true },
  };
}

export default async function JobsPage({ searchParams }: JobsPageProps) {
  return <JobsShell searchParams={await searchParams} />;
}
