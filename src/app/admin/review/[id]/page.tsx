import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { JobReviewEditor } from "@/components/admin/review/JobReviewEditor";
import { getReviewJob } from "@/lib/ingest/admin-query";
import { toEditorHtml } from "@/lib/job-rich-text";

export const metadata: Metadata = { title: "Admin — Edit job" };
export const dynamic = "force-dynamic";

export default async function ReviewJobPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const job = await getReviewJob(id);
  if (!job) notFound();

  return (
    <JobReviewEditor
      initial={{
        id: job.id,
        slug: job.slug,
        title: job.title,
        companyName: job.company.name,
        status: job.status,
        category: job.category,
        location: job.location,
        remoteType: job.remoteType,
        employmentType: job.employmentType,
        descriptionHtml: toEditorHtml(job.description),
        highlights: job.highlights,
        applyUrl: job.applyUrl ?? "",
        rewritePrompt: job.rewritePrompt ?? "",
        rawUrl: job.rawJob?.externalUrl ?? null,
      }}
    />
  );
}
