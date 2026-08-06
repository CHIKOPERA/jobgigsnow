import type { Metadata } from "next";
import Link from "next/link";
import { listFailures } from "@/lib/ingest/admin-query";

export const metadata: Metadata = { title: "Admin — Failures" };
export const dynamic = "force-dynamic";

export default async function AdminFailuresPage() {
  const { failures } = await listFailures({ limit: 50 });

  return (
    <div className="flex flex-col gap-6">
      <h1 className="text-title font-semibold">Failures</h1>

      {failures.length === 0 && <p className="text-meta text-ink-muted">No failures recorded.</p>}

      <div className="flex flex-col gap-2">
        {failures.map((failure) => (
          <div key={failure.id} className="rounded-md border border-line bg-surface p-3">
            <div className="flex items-center gap-2 text-label uppercase text-ink-muted">
              <span>{failure.stage}</span>
              <span aria-hidden="true">·</span>
              <span>{failure.ingestRun.source.name}</span>
              <span aria-hidden="true">·</span>
              <span>{new Date(failure.createdAt).toLocaleString()}</span>
            </div>
            <p className="mt-1 break-all text-meta text-ink-muted">{failure.url}</p>
            <p className="mt-1 text-meta text-ink">{failure.message}</p>
            {failure.rawJobId && (
              <Link
                href={`/admin/raw-jobs/${failure.rawJobId}`}
                className="focus-ring mt-1 inline-block rounded-sm text-meta font-medium text-ink-muted hover:text-ink"
              >
                View raw job →
              </Link>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}
