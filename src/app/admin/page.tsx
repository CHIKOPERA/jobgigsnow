import type { Metadata } from "next";
import Link from "next/link";
import { getDashboardStats } from "@/lib/ingest/admin-query";
import { RunStatusBadge } from "@/components/admin/RunStatusBadge";
import { RunTickButton } from "@/components/admin/RunTickButton";
import { StatTile } from "@/components/admin/StatTile";
import { StopRunButton } from "@/components/admin/StopRunButton";

export const metadata: Metadata = { title: "Admin — Dashboard" };
export const dynamic = "force-dynamic";

export default async function AdminDashboardPage() {
  const stats = await getDashboardStats();

  return (
    <div className="flex flex-col gap-8">
      <div className="flex items-center justify-between">
        <h1 className="text-title font-semibold">Ingestion dashboard</h1>
        <RunTickButton />
      </div>

      <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
        <StatTile label="Active sources" value={stats.activeSources} />
        <StatTile label="Runs today" value={stats.runsToday} />
        <StatTile label="Jobs discovered today" value={stats.jobsDiscoveredToday} />
        <StatTile label="Failures today" value={stats.openFailuresToday} />
      </div>

      <section className="flex flex-col gap-3">
        <div className="flex items-center justify-between">
          <h2 className="text-body font-semibold">Recent runs</h2>
          <Link href="/admin/runs" className="focus-ring rounded-sm text-meta font-medium text-ink-muted hover:text-ink">
            View all →
          </Link>
        </div>
        <div className="overflow-x-auto rounded-md border border-line">
          <table className="w-full min-w-[640px] text-meta">
            <thead>
              <tr className="border-b border-line bg-surface-sunk text-left text-label uppercase text-ink-muted">
                <th className="px-3 py-2">Source</th>
                <th className="px-3 py-2">Status</th>
                <th className="px-3 py-2">Started</th>
                <th className="px-3 py-2">New</th>
                <th className="px-3 py-2">Changed</th>
                <th className="px-3 py-2">Failed</th>
                <th className="px-3 py-2"><span className="sr-only">Actions</span></th>
              </tr>
            </thead>
            <tbody>
              {stats.recentRuns.length === 0 && (
                <tr>
                  <td colSpan={7} className="px-3 py-6 text-center text-ink-muted">
                    No runs yet.
                  </td>
                </tr>
              )}
              {stats.recentRuns.map((run) => (
                <tr key={run.id} className="border-b border-line last:border-0 hover:bg-surface-sunk">
                  <td className="px-3 py-2">
                    <Link href={`/admin/runs/${run.id}`} className="focus-ring rounded-sm font-medium text-ink">
                      {run.source.name}
                    </Link>
                  </td>
                  <td className="px-3 py-2">
                    <RunStatusBadge status={run.status} />
                  </td>
                  <td className="px-3 py-2 text-ink-muted">{new Date(run.startedAt).toLocaleString()}</td>
                  <td className="px-3 py-2">{run.newCount}</td>
                  <td className="px-3 py-2">{run.changedCount}</td>
                  <td className="px-3 py-2">{run.failedCount}</td>
                  <td className="px-3 py-2 text-right">
                    {run.status === "RUNNING" && <StopRunButton runId={run.id} />}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>

      <section className="flex flex-col gap-3">
        <div className="flex items-center justify-between">
          <h2 className="text-body font-semibold">Recent failures</h2>
          <Link href="/admin/failures" className="focus-ring rounded-sm text-meta font-medium text-ink-muted hover:text-ink">
            View all →
          </Link>
        </div>
        <div className="flex flex-col gap-2">
          {stats.recentFailures.length === 0 && <p className="text-meta text-ink-muted">No failures recorded.</p>}
          {stats.recentFailures.map((failure) => (
            <div key={failure.id} className="rounded-md border border-line bg-surface p-3">
              <div className="flex items-center gap-2 text-label uppercase text-ink-muted">
                <span>{failure.stage}</span>
                <span aria-hidden="true">·</span>
                <span>{failure.ingestRun.source.name}</span>
                <span aria-hidden="true">·</span>
                <span>{new Date(failure.createdAt).toLocaleString()}</span>
              </div>
              <p className="mt-1 text-meta text-ink">{failure.message}</p>
            </div>
          ))}
        </div>
      </section>
    </div>
  );
}
