import type { Metadata } from "next";
import Link from "next/link";
import { SourceRowActions } from "@/components/admin/SourceRowActions";
import { listSources } from "@/lib/ingest/source-service";

export const metadata: Metadata = { title: "Admin — Sources" };
export const dynamic = "force-dynamic";

export default async function AdminSourcesPage() {
  const sources = await listSources();

  return (
    <div className="flex flex-col gap-6">
      <div className="flex items-center justify-between">
        <h1 className="text-title font-semibold">Sources</h1>
        <Link
          href="/admin/sources/new"
          className="focus-ring flex h-10 items-center rounded-pill bg-ink px-4 text-meta font-medium text-surface"
        >
          New source
        </Link>
      </div>

      <div className="overflow-x-auto rounded-md border border-line">
        <table className="w-full min-w-[900px] text-meta">
          <thead>
            <tr className="border-b border-line bg-surface-sunk text-left text-label uppercase text-ink-muted">
              <th className="px-3 py-2">Name</th>
              <th className="px-3 py-2">Base URL</th>
              <th className="px-3 py-2">Cadence</th>
              <th className="px-3 py-2">Enabled</th>
              <th className="px-3 py-2">Last run</th>
              <th className="px-3 py-2 text-right">Actions</th>
            </tr>
          </thead>
          <tbody>
            {sources.length === 0 && (
              <tr>
                <td colSpan={6} className="px-3 py-6 text-center text-ink-muted">
                  No sources yet — create one to start crawling.
                </td>
              </tr>
            )}
            {sources.map((source) => (
              <tr key={source.id} className="border-b border-line last:border-0 hover:bg-surface-sunk">
                <td className="px-3 py-2">
                  <Link href={`/admin/sources/${source.id}`} className="focus-ring rounded-sm font-medium text-ink">
                    {source.name}
                  </Link>
                </td>
                <td className="px-3 py-2 text-ink-muted">{source.baseUrl}</td>
                <td className="px-3 py-2">{source.cadenceMinutes}m</td>
                <td className="px-3 py-2">{source.enabled ? "Yes" : "No"}</td>
                <td className="px-3 py-2 text-ink-muted">
                  {source.lastRunAt ? new Date(source.lastRunAt).toLocaleString() : "Never"}
                </td>
                <td className="px-3 py-2">
                  <SourceRowActions sourceId={source.id} sourceName={source.name} initiallyEnabled={source.enabled} />
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
