import type { Metadata } from "next";
import Link from "next/link";
import { listReviewJobs } from "@/lib/ingest/admin-query";

export const metadata: Metadata = { title: "Admin — Job review" };
export const dynamic = "force-dynamic";

export default async function ReviewQueuePage() {
  const { pending } = await listReviewJobs();

  return (
    <div className="flex flex-col gap-9">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <p className="text-label uppercase tracking-[0.1em] text-ink-muted">Completed drafts</p>
          <h1 className="mt-2 text-h2 font-medium">Ready to publish</h1>
          <p className="mt-2 text-body text-ink-muted">These jobs finished processing and are waiting for a final manual publish.</p>
        </div>
        {pending.length > 0 && <div className="rounded-pill bg-accent-mint px-4 py-2 text-meta font-semibold">{pending.length} ready</div>}
      </div>

      <section>
        {pending.length === 0 ? (
          <div className="rounded-lg border border-dashed border-line-strong bg-surface/60 px-6 py-14 text-center">
            <p className="text-title font-semibold">Everything is clear</p>
            <p className="mt-2 text-meta text-ink-muted">New jobs are publishing automatically.</p>
            <Link href="/admin" className="focus-ring mt-5 inline-flex h-10 items-center rounded-pill bg-ink px-5 text-meta font-semibold text-surface">Back to dashboard</Link>
          </div>
        ) : (
          <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-3">
            {pending.map((job) => (
              <Link key={job.id} href={`/admin/review/${job.id}`} className="focus-ring group rounded-lg border border-line bg-surface p-5 transition-transform hover:-translate-y-0.5 hover:border-line-strong">
                <div className="flex items-start justify-between gap-3">
                  <span className="rounded-pill bg-accent-mint/60 px-2.5 py-1 text-[11px] font-semibold">Ready</span>
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

    </div>
  );
}
