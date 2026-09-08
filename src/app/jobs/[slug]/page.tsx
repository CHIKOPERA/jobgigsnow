import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { cache } from "react";
import { JobDetail } from "@/components/job/JobDetail";
import { ContentAd } from "@/components/ads/ContentAd";
import { jobDetailSelect, toJobDetail } from "@/lib/dto";
import { prisma } from "@/lib/prisma";
import { getSavedJobIds } from "@/lib/saved";
import { site } from "@/config";
import {
  buildJobBreadcrumbSchema,
  buildJobMetaDescription,
  buildJobPostingSchema,
  serializeJsonLd,
} from "@/lib/job-seo";
import { JobsShell } from "../JobsShell";

export const dynamic = "force-dynamic";

interface JobPageProps {
  params: Promise<{ slug: string }>;
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}

const getJob = cache(async (slug: string) => {
  const row = await prisma.job.findFirst({
    where: { slug, status: "PUBLISHED" },
    select: {
      ...jobDetailSelect,
      socialImageUrl: true,
      socialImageAlt: true,
      socialImageCredit: true,
      socialImageSourceUrl: true,
    },
  });
  return row ? {
    detail: toJobDetail(row),
    socialImageUrl: row.socialImageUrl,
    socialImageAlt: row.socialImageAlt,
    socialImageCredit: row.socialImageCredit,
    socialImageSourceUrl: row.socialImageSourceUrl,
  } : null;
});

export async function generateMetadata({ params }: JobPageProps): Promise<Metadata> {
  const { slug } = await params;
  const job = await getJob(slug);
  if (!job) return { title: "Job not found", robots: { index: false, follow: false } };
  const title = `${job.detail.title} at ${job.detail.companyName}`;
  const description = buildJobMetaDescription({ ...job.detail, slug, socialImageUrl: job.socialImageUrl });
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
    robots: {
      index: true,
      follow: true,
      googleBot: { index: true, follow: true, "max-image-preview": "large", "max-snippet": -1 },
    },
    openGraph: { type: "website", title, description, url, siteName: site.name, images },
    twitter: { card: "summary_large_image", title, description, images },
  };
}

export default async function JobPage({ params, searchParams }: JobPageProps) {
  const { slug } = await params;
  const job = await getJob(slug);
  if (!job) notFound();

  const savedJobIds = await getSavedJobIds([job.detail.id]);
  const seoJob = { ...job.detail, slug, socialImageUrl: job.socialImageUrl };
  const jobPosting = buildJobPostingSchema(seoJob, site.url);
  const breadcrumbs = buildJobBreadcrumbSchema(seoJob, site.url);

  return (
    <>
      {jobPosting && (
        <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: serializeJsonLd(jobPosting) }} />
      )}
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: serializeJsonLd(breadcrumbs) }} />
      <JobsShell
        searchParams={await searchParams}
        activeSlug={slug}
        detail={
          <div>
            <JobDetail
              job={job.detail}
              saved={savedJobIds.has(job.detail.id)}
              image={job.socialImageUrl ? {
                url: job.socialImageUrl,
                alt: job.socialImageAlt ?? `${job.detail.title} at ${job.detail.companyName}`,
                credit: job.socialImageCredit,
                sourceUrl: job.socialImageSourceUrl,
              } : null}
            />
            <ContentAd kind="job" pageKey={slug} text={job.detail.description} />
          </div>
        }
      />
    </>
  );
}
