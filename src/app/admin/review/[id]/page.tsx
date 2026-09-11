import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { JobReviewEditor } from "@/components/admin/review/JobReviewEditor";
import { getReviewJob } from "@/lib/ingest/admin-query";
import { toEditorHtml } from "@/lib/job-rich-text";
import { getSeoRewritePrompt } from "@/lib/ingest/settings";

export const metadata: Metadata = { title: "Admin — Edit job" };
export const dynamic = "force-dynamic";

export default async function ReviewJobPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const [job, defaultRewritePrompt] = await Promise.all([getReviewJob(id), getSeoRewritePrompt()]);
  if (!job) notFound();

  return (
    <JobReviewEditor
      defaultRewritePrompt={defaultRewritePrompt}
      initial={{
        id: job.id,
        slug: job.slug,
        title: job.title,
        companyName: job.company.name,
        status: job.status,
        category: job.category,
        industry: job.industry,
        location: job.location,
        province: job.province,
        remoteType: job.remoteType,
        employmentType: job.employmentType,
        salaryMin: job.salaryMin,
        salaryMax: job.salaryMax,
        salaryPeriod: job.salaryPeriod,
        closesAt: job.closesAt?.toISOString().slice(0, 10) ?? "",
        descriptionHtml: toEditorHtml(job.description),
        applicationGuidance: {
          summary: job.applicationSummary ?? "",
          essentialRequirements: job.essentialRequirements,
          preferredRequirements: job.preferredRequirements,
          qualifications: job.requiredQualifications,
          experience: job.requiredExperience,
          documents: job.documentsToPrepare,
          licences: job.licenceRequirements,
          applicationMethod: job.applicationMethod ?? "",
          referenceNumber: job.referenceNumber ?? "",
          estimatedApplicationMinutes: job.estimatedApplicationMinutes ?? 0,
        },
        highlights: job.highlights,
        applyUrl: job.applyUrl ?? "",
        rewritePrompt: job.rewritePrompt ?? "",
        rawUrl: job.rawJob?.externalUrl ?? null,
        socialImageUrl: job.socialImageUrl,
        socialImageAlt: job.socialImageAlt,
        socialImageCredit: job.socialImageCredit,
        socialImageSourceUrl: job.socialImageSourceUrl,
      }}
    />
  );
}
