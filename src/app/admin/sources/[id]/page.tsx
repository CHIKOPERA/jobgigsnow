import type { Metadata } from "next";
import { notFound } from "next/navigation";
import Link from "next/link";
import { getSource } from "@/lib/ingest/source-service";
import { listRuns } from "@/lib/ingest/admin-query";
import { ActionButton } from "@/components/admin/ActionButton";
import { RunStatusBadge } from "@/components/admin/RunStatusBadge";
import { StopRunButton } from "@/components/admin/StopRunButton";
import { SourceForm } from "@/components/admin/SourceForm";

export const metadata: Metadata = { title: "Admin — Source" };
export const dynamic = "force-dynamic";

export default async function AdminSourceDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const source = await getSource(id);
  if (!source) notFound();

  const { runs } = await listRuns({ sourceId: id, limit: 10 });

  return (
    <div className="flex flex-col gap-8">
      <div className="flex items-center justify-between">
        <h1 className="text-title font-semibold">{source.name}</h1>
        <ActionButton label="Run now" pendingLabel="Starting…" method="POST" url={`/api/admin/sources/${id}/run`} />
      </div>

      <SourceForm
        mode="edit"
        sourceId={id}
        initial={{
          name: source.name,
          baseUrl: source.baseUrl,
          cadenceMinutes: source.cadenceMinutes,
          enabled: source.enabled,
          crawlConfig: source.crawlConfig,
        }}
      />

      <section className="flex flex-col gap-3">
        <h2 className="text-body font-semibold">Recent runs</h2>
        <div className="overflow-x-auto rounded-md border border-line">
          <table className="w-full min-w-[560px] text-meta">
            <thead>
              <tr className="border-b border-line bg-surface-sunk text-left text-label uppercase text-ink-muted">
                <th className="px-3 py-2">Status</th>
                <th className="px-3 py-2">Started</th>
                <th className="px-3 py-2">New</th>
                <th className="px-3 py-2">Changed</th>
                <th className="px-3 py-2">Missing</th>
                <th className="px-3 py-2">Failed</th>
                <th className="px-3 py-2"><span className="sr-only">Actions</span></th>
              </tr>
            </thead>
            <tbody>
              {runs.length === 0 && (
                <tr>
                  <td colSpan={7} className="px-3 py-6 text-center text-ink-muted">
                    No runs yet.
                  </td>
                </tr>
              )}
              {runs.map((run) => (
                <tr key={run.id} className="border-b border-line last:border-0 hover:bg-surface-sunk">
                  <td className="px-3 py-2">
                    <Link href={`/admin/runs/${run.id}`} className="focus-ring rounded-sm">
                      <RunStatusBadge status={run.status} />
                    </Link>
                  </td>
                  <td className="px-3 py-2 text-ink-muted">{new Date(run.startedAt).toLocaleString()}</td>
                  <td className="px-3 py-2">{run.newCount}</td>
                  <td className="px-3 py-2">{run.changedCount}</td>
                  <td className="px-3 py-2">{run.missingCount}</td>
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
    </div>
  );
}
