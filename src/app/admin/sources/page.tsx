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
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div><h1 className="text-title font-semibold">Careers sources</h1><p className="mt-2 text-body text-ink-muted">Companies checked automatically for new jobs.</p></div>
        <Link
          href="/admin/sources/new"
          className="focus-ring flex h-10 items-center rounded-pill bg-ink px-4 text-meta font-medium text-surface"
        >
          Add source
        </Link>
      </div>

      {sources.length === 0 ? (
        <div className="rounded-xl border border-dashed border-line-strong bg-surface/60 px-6 py-14 text-center">
          <p className="text-title font-semibold">Add your first careers page</p>
          <p className="mt-2 text-meta text-ink-muted">We’ll check it for jobs and publish new listings automatically.</p>
          <Link href="/admin/sources/new" className="focus-ring mt-5 inline-flex h-11 items-center rounded-pill bg-ink px-5 text-meta font-semibold text-surface">Add source</Link>
        </div>
      ) : (
        <div className="grid gap-3">
          {sources.map((source) => (
            <article key={source.id} className="rounded-lg border border-line bg-surface p-4 md:flex md:items-center md:justify-between md:gap-6">
              <div className="min-w-0">
                <div className="flex items-center gap-2">
                  <span className={`size-2 rounded-full ${source.enabled ? "bg-accent-mint" : "bg-line-strong"}`} aria-hidden="true" />
                  <Link href={`/admin/sources/${source.id}`} className="focus-ring truncate rounded-sm text-body font-semibold hover:underline">{source.name}</Link>
                  <span className="text-[11px] text-ink-muted">{source.enabled ? "Active" : "Paused"}</span>
                </div>
                <p className="mt-1 truncate text-meta text-ink-muted">{source.baseUrl}</p>
                <p className="mt-2 text-[12px] text-ink-muted">Last checked {source.lastRunAt ? new Date(source.lastRunAt).toLocaleString() : "never"}</p>
              </div>
              <div className="mt-4 md:mt-0"><SourceRowActions sourceId={source.id} initiallyEnabled={source.enabled} /></div>
            </article>
          ))}
        </div>
      )}
    </div>
  );
}
