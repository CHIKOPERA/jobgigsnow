import type { Metadata } from "next";
import { auth } from "@clerk/nextjs/server";
import { SignInButton } from "@clerk/nextjs";
import { JobList } from "@/components/job/JobList";
import { jobCardSelect, toJobCard } from "@/lib/dto";
import { pagination } from "@/config/pagination";
import { prisma } from "@/lib/prisma";

export const metadata: Metadata = {
  title: "Saved jobs",
  robots: { index: false, follow: false },
};
export const dynamic = "force-dynamic";

export default async function SavedJobsPage() {
  const { userId } = await auth();

  if (!userId) {
    return (
      <div className="mx-auto max-w-6xl px-4 py-12 text-center">
        <h1 className="text-title font-semibold">Sign in to see your saved jobs</h1>
        <p className="mt-2 text-body text-ink-muted">
          Jobs you save will show up here so you can come back to them later.
        </p>
        <div className="mt-6 flex justify-center">
          <SignInButton mode="modal">
            <button
              type="button"
              className="focus-ring inline-flex h-12 items-center rounded-pill bg-ink px-6 text-body font-medium text-[#F6F7F0]"
            >
              Sign in
            </button>
          </SignInButton>
        </div>
      </div>
    );
  }

  const saved = await prisma.savedJob.findMany({
    where: { userId },
    orderBy: { createdAt: "desc" },
    take: pagination.savedJobsPageSize,
    select: { jobId: true, job: { select: jobCardSelect } },
  });

  const jobs = saved.map((s) => toJobCard(s.job));

  return (
    <div className="mx-auto max-w-6xl px-4 py-4 md:px-6">
      <h1 className="text-title font-semibold">Saved jobs</h1>
      <p aria-live="polite" className="mt-2 text-meta text-ink-muted">
        {jobs.length} job{jobs.length === 1 ? "" : "s"} saved
      </p>
      <div className="mt-4">
        <JobList
          jobs={jobs}
          savedJobIds={new Set(jobs.map((j) => j.id))}
          detailHref={(slug) => `/jobs/${slug}`}
        />
      </div>
    </div>
  );
}
