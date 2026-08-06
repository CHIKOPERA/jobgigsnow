import type { Metadata } from "next";
import Link from "next/link";
import { listReviewJobs } from "@/lib/ingest/admin-query";

export const metadata: Metadata = { title: "Admin — Job review" };
export const dynamic = "force-dynamic";

export default async function ReviewQueuePage() {
  const { pending, recentlyPublished } = await listReviewJobs();

  return (
    <div className="flex flex-col gap-9">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <p className="text-label uppercase tracking-[0.1em] text-ink-muted">Human approval gate</p>
          <h1 className="mt-2 text-h2 font-medium">Job review</h1>
          <p className="mt-2 text-body text-ink-muted">Edit AI-aggregated jobs and publish only when they are ready.</p>
        </div>
        <div className="rounded-pill bg-accent-mint px-4 py-2 text-meta font-semibold">{pending.length} awaiting review</div>
      </div>

      <section>
        {pending.length === 0 ? (
          <div className="rounded-lg border border-dashed border-line-strong bg-surface/60 px-6 py-14 text-center">
            <p className="text-title font-semibold">The review queue is clear</p>
            <p className="mt-2 text-meta text-ink-muted">Newly aggregated jobs will appear here before they can be published.</p>
            <Link href="/admin/crawl" className="focus-ring mt-5 inline-flex h-10 items-center rounded-pill bg-ink px-5 text-meta font-semibold text-surface">Crawl a job</Link>
          </div>
        ) : (
          <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-3">
            {pending.map((job) => (
              <Link key={job.id} href={`/admin/review/${job.id}`} className="focus-ring group rounded-lg border border-line bg-surface p-5 transition-transform hover:-translate-y-0.5 hover:border-line-strong">
                <div className="flex items-start justify-between gap-3">
                  <span className="rounded-pill bg-accent-mint/60 px-2.5 py-1 text-[11px] font-semibold">{job.status}</span>
                  <span className="text-[11px] text-ink-muted">{new Date(job.updatedAt).toLocaleDateString()}</span>
                </div>
                <h2 className="mt-4 text-body font-semibold leading-snug group-hover:underline">{job.title}</h2>
                <p className="mt-1 text-meta text-ink-muted">{job.company.name} · {job.location}</p>
                <p className="mt-4 text-[12px] text-ink-muted">{job.rawJob?.source.name ?? "Manual"} <span aria-hidden="true">→</span></p>
              </Link>
            ))}
          </div>
        )}
      </section>

      {recentlyPublished.length > 0 && (
        <section className="border-t border-line pt-7">
          <h2 className="text-body font-semibold">Recently published</h2>
          <div className="mt-3 divide-y divide-line rounded-lg border border-line bg-surface">
            {recentlyPublished.map((job) => (
              <div key={job.id} className="flex items-center justify-between gap-4 px-4 py-3">
                <div className="min-w-0"><p className="truncate text-meta font-semibold">{job.title}</p><p className="text-[12px] text-ink-muted">{job.company.name}</p></div>
                <div className="flex shrink-0 gap-2"><Link href={`/admin/review/${job.id}`} className="focus-ring rounded-pill px-3 py-1.5 text-[12px] hover:bg-bg">Edit</Link><Link href={`/jobs/${job.slug}`} className="focus-ring rounded-pill bg-bg px-3 py-1.5 text-[12px]">View ↗</Link></div>
              </div>
            ))}
          </div>
        </section>
      )}
    </div>
  );
}
