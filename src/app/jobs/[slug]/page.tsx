import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { JobDetail } from "@/components/job/JobDetail";
import { jobDetailSelect, toJobDetail } from "@/lib/dto";
import { prisma } from "@/lib/prisma";
import { getSavedJobIds } from "@/lib/saved";
import { JobsShell } from "../JobsShell";

export const dynamic = "force-dynamic";

interface JobPageProps {
  params: Promise<{ slug: string }>;
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}

async function getJob(slug: string) {
  const row = await prisma.job.findFirst({
    where: { slug, status: "PUBLISHED" },
    select: jobDetailSelect,
  });
  return row ? toJobDetail(row) : null;
}

export async function generateMetadata({ params }: JobPageProps): Promise<Metadata> {
  const { slug } = await params;
  const job = await getJob(slug);
  if (!job) return { title: "Job not found" };
  return { title: `${job.title} at ${job.companyName}` };
}

export default async function JobPage({ params, searchParams }: JobPageProps) {
  const { slug } = await params;
  const job = await getJob(slug);
  if (!job) notFound();

  const savedJobIds = await getSavedJobIds([job.id]);

  return (
    <JobsShell
      searchParams={await searchParams}
      activeSlug={slug}
      detail={<JobDetail job={job} saved={savedJobIds.has(job.id)} />}
    />
  );
}
