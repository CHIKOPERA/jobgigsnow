import type { Metadata } from "next";
import { notFound } from "next/navigation";
import Link from "next/link";
import { getRunDetail } from "@/lib/ingest/admin-query";
import { RunStatusBadge } from "@/components/admin/RunStatusBadge";
import { StatTile } from "@/components/admin/StatTile";
import { RunProgress } from "@/components/admin/RunProgress";

export const metadata: Metadata = { title: "Admin — Run detail" };
export const dynamic = "force-dynamic";

export default async function AdminRunDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const detail = await getRunDetail(id);
  if (!detail) notFound();

  const { run, rawJobs, failures, progress } = detail;

  return (
    <div className="flex flex-col gap-8">
      <div className="flex items-center gap-3">
        <h1 className="text-title font-semibold">
          <Link href={`/admin/sources/${run.sourceId}`} className="focus-ring rounded-sm hover:underline">
            {run.source.name}
          </Link>{" "}
          run
        </h1>
        <RunStatusBadge status={run.status} />
      </div>

      <p className="text-meta text-ink-muted">
        Started {new Date(run.startedAt).toLocaleString()}
        {run.finishedAt && ` · Finished ${new Date(run.finishedAt).toLocaleString()}`}
      </p>

      <RunProgress
        runId={run.id}
        initial={{
          status: run.status,
          discoveredCount: run.discoveredCount,
          progress,
        }}
      />

      <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
        <StatTile label="Discovered" value={run.discoveredCount} />
        <StatTile label="New" value={run.newCount} />
        <StatTile label="Changed" value={run.changedCount} />
        <StatTile label="Unchanged" value={run.unchangedCount} />
        <StatTile label="Missing" value={run.missingCount} />
        <StatTile label="Inactive" value={run.inactiveCount} />
        <StatTile label="Failed pages" value={run.failedCount} />
        <StatTile label="Validation failed" value={run.validationFailedCount} />
        <StatTile label="AI failed" value={run.aiFailedCount} />
      </div>

      <section className="flex flex-col gap-3">
        <h2 className="text-body font-semibold">Raw jobs in this run</h2>
        <div className="overflow-x-auto rounded-md border border-line">
          <table className="w-full min-w-[640px] text-meta">
            <thead>
              <tr className="border-b border-line bg-surface-sunk text-left text-label uppercase text-ink-muted">
                <th className="px-3 py-2">URL</th>
                <th className="px-3 py-2">Fetch status</th>
                <th className="px-3 py-2">Active</th>
                <th className="px-3 py-2">Needs aggregation</th>
                <th className="px-3 py-2">Job</th>
              </tr>
            </thead>
            <tbody>
              {rawJobs.length === 0 && (
                <tr>
                  <td colSpan={5} className="px-3 py-6 text-center text-ink-muted">
                    No raw jobs touched by this run.
                  </td>
                </tr>
              )}
              {rawJobs.map((rawJob) => (
                <tr key={rawJob.id} className="border-b border-line last:border-0 hover:bg-surface-sunk">
                  <td className="max-w-xs truncate px-3 py-2">
                    <Link href={`/admin/raw-jobs/${rawJob.id}`} className="focus-ring rounded-sm font-medium text-ink">
                      {rawJob.externalUrl}
                    </Link>
                  </td>
                  <td className="px-3 py-2">{rawJob.fetchStatus}</td>
                  <td className="px-3 py-2">{rawJob.active ? "Yes" : "No"}</td>
                  <td className="px-3 py-2">{rawJob.needsAggregation ? "Yes" : "No"}</td>
                  <td className="px-3 py-2">
                    {rawJob.job ? (
                      <Link href={`/admin/review/${rawJob.job.id}`} className="focus-ring rounded-sm text-ink-muted hover:text-ink">
                        {rawJob.job.status} →
                      </Link>
                    ) : (
                      <span className="text-ink-muted">—</span>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>

      <section className="flex flex-col gap-3">
        <h2 className="text-body font-semibold">Failures in this run</h2>
        {failures.length === 0 && <p className="text-meta text-ink-muted">No failures.</p>}
        <div className="flex flex-col gap-2">
          {failures.map((failure) => (
            <div key={failure.id} className="rounded-md border border-line bg-surface p-3">
              <div className="flex items-center gap-2 text-label uppercase text-ink-muted">
                <span>{failure.stage}</span>
                <span aria-hidden="true">·</span>
                <span>{new Date(failure.createdAt).toLocaleString()}</span>
              </div>
              <p className="mt-1 text-meta text-ink">{failure.message}</p>
              {failure.rawJobId && (
                <Link href={`/admin/raw-jobs/${failure.rawJobId}`} className="focus-ring mt-1 inline-block rounded-sm text-meta text-ink-muted hover:text-ink">
                  View raw job →
                </Link>
              )}
            </div>
          ))}
        </div>
      </section>
    </div>
  );
}
