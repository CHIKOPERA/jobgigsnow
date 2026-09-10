import type { Metadata } from "next";
import Link from "next/link";
import { SourcesList } from "@/components/admin/SourcesList";
import { listSourcesWithHealth } from "@/lib/ingest/admin-query";

export const metadata: Metadata = { title: "Admin — Sources" };
export const dynamic = "force-dynamic";

export default async function AdminSourcesPage() {
  const sources = await listSourcesWithHealth();

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div><h1 className="text-title font-semibold">Careers sources</h1><p className="mt-2 text-body text-ink-muted">Companies checked automatically for new jobs.</p></div>
        <div className="flex flex-wrap items-center gap-2">
          <Link
            href="/api/admin/sources/export"
            download
            prefetch={false}
            className="focus-ring flex h-10 items-center rounded-pill border border-line-strong bg-surface px-4 text-meta font-medium text-ink"
          >
            Export CSV
          </Link>
          <Link
            href="/admin/sources/new"
            className="focus-ring flex h-10 items-center rounded-pill bg-ink px-4 text-meta font-medium text-surface"
          >
            Add source
          </Link>
        </div>
      </div>

      {sources.length === 0 ? (
        <div className="rounded-xl border border-dashed border-line-strong bg-surface/60 px-6 py-14 text-center">
          <p className="text-title font-semibold">Add your first careers page</p>
          <p className="mt-2 text-meta text-ink-muted">We’ll check it for jobs and publish new listings automatically.</p>
          <Link href="/admin/sources/new" className="focus-ring mt-5 inline-flex h-11 items-center rounded-pill bg-ink px-5 text-meta font-semibold text-surface">Add source</Link>
        </div>
      ) : (
        <SourcesList sources={sources.map((source) => ({ ...source, lastRunAt: source.lastRunAt?.toISOString() ?? null }))} />
      )}
    </div>
  );
}
