import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { JobDetail } from "@/components/job/JobDetail";
import { ContentAd } from "@/components/ads/ContentAd";
import { jobDetailSelect, toJobDetail } from "@/lib/dto";
import { prisma } from "@/lib/prisma";
import { getSavedJobIds } from "@/lib/saved";
import { site } from "@/config";
import { JobsShell } from "../JobsShell";

export const dynamic = "force-dynamic";

interface JobPageProps {
  params: Promise<{ slug: string }>;
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}

async function getJob(slug: string) {
  const row = await prisma.job.findFirst({
    where: { slug, status: "PUBLISHED" },
    select: {
      ...jobDetailSelect,
      socialImageUrl: true,
      socialImageAlt: true,
    },
  });
  return row ? {
    detail: toJobDetail(row),
    socialImageUrl: row.socialImageUrl,
    socialImageAlt: row.socialImageAlt,
  } : null;
}

export async function generateMetadata({ params }: JobPageProps): Promise<Metadata> {
  const { slug } = await params;
  const job = await getJob(slug);
  if (!job) return { title: "Job not found", robots: { index: false, follow: false } };
  const title = `${job.detail.title} at ${job.detail.companyName}`;
  const description = `${job.detail.title} opportunity at ${job.detail.companyName} in ${job.detail.location}. View the details and apply on JobGigsNow.`;
  const url = `${site.url.replace(/\/$/, "")}/jobs/${slug}`;
  const images = job.socialImageUrl ? [{
    url: job.socialImageUrl,
    width: 1200,
    height: 630,
    alt: job.socialImageAlt ?? title,
    type: "image/jpeg",
  }] : undefined;
  return {
    title,
    description,
    alternates: { canonical: url },
    openGraph: { type: "website", title, description, url, siteName: site.name, images },
    twitter: { card: "summary_large_image", title, description, images },
  };
}

export default async function JobPage({ params, searchParams }: JobPageProps) {
  const { slug } = await params;
  const job = await getJob(slug);
  if (!job) notFound();

  const savedJobIds = await getSavedJobIds([job.detail.id]);

  return (
    <JobsShell
      searchParams={await searchParams}
      activeSlug={slug}
      detail={
        <div>
          <JobDetail job={job.detail} saved={savedJobIds.has(job.detail.id)} />
          <ContentAd kind="job" pageKey={slug} text={job.detail.description} />
        </div>
      }
    />
  );
}
