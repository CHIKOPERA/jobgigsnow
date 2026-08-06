import type { Metadata } from "next";
import Link from "next/link";
import { listRuns } from "@/lib/ingest/admin-query";
import { RunStatusBadge } from "@/components/admin/RunStatusBadge";

export const metadata: Metadata = { title: "Admin — Runs" };
export const dynamic = "force-dynamic";

export default async function AdminRunsPage() {
  const { runs } = await listRuns({ limit: 50 });

  return (
    <div className="flex flex-col gap-6">
      <h1 className="text-title font-semibold">Ingest runs</h1>

      <div className="overflow-x-auto rounded-md border border-line">
        <table className="w-full min-w-[720px] text-meta">
          <thead>
            <tr className="border-b border-line bg-surface-sunk text-left text-label uppercase text-ink-muted">
              <th className="px-3 py-2">Source</th>
              <th className="px-3 py-2">Status</th>
              <th className="px-3 py-2">Started</th>
              <th className="px-3 py-2">New</th>
              <th className="px-3 py-2">Changed</th>
              <th className="px-3 py-2">Unchanged</th>
              <th className="px-3 py-2">Missing</th>
              <th className="px-3 py-2">Inactive</th>
              <th className="px-3 py-2">Failed</th>
            </tr>
          </thead>
          <tbody>
            {runs.length === 0 && (
              <tr>
                <td colSpan={9} className="px-3 py-6 text-center text-ink-muted">
                  No runs yet.
                </td>
              </tr>
            )}
            {runs.map((run) => (
              <tr key={run.id} className="border-b border-line last:border-0 hover:bg-surface-sunk">
                <td className="px-3 py-2">
                  <Link href={`/admin/sources/${run.sourceId}`} className="focus-ring rounded-sm font-medium text-ink">
                    {run.source.name}
                  </Link>
                </td>
                <td className="px-3 py-2">
                  <Link href={`/admin/runs/${run.id}`} className="focus-ring rounded-sm">
                    <RunStatusBadge status={run.status} />
                  </Link>
                </td>
                <td className="px-3 py-2 text-ink-muted">{new Date(run.startedAt).toLocaleString()}</td>
                <td className="px-3 py-2">{run.newCount}</td>
                <td className="px-3 py-2">{run.changedCount}</td>
                <td className="px-3 py-2">{run.unchangedCount}</td>
                <td className="px-3 py-2">{run.missingCount}</td>
                <td className="px-3 py-2">{run.inactiveCount}</td>
                <td className="px-3 py-2">{run.failedCount + run.validationFailedCount + run.aiFailedCount}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
