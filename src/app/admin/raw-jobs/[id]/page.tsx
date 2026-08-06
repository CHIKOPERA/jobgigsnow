import type { Metadata } from "next";
import { notFound } from "next/navigation";
import Link from "next/link";
import { getRawJobDetail } from "@/lib/ingest/admin-query";
import { ActionButton } from "@/components/admin/ActionButton";
import { JsonViewer } from "@/components/admin/JsonViewer";
import { StatTile } from "@/components/admin/StatTile";

export const metadata: Metadata = { title: "Admin — Raw job" };
export const dynamic = "force-dynamic";

export default async function AdminRawJobDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const rawJob = await getRawJobDetail(id);
  if (!rawJob) notFound();

  const bundle = rawJob.payload as {
    reconciled?: unknown;
    jsonLd?: unknown;
    selectors?: unknown;
    metadata?: unknown;
    readableText?: string | null;
    markdown?: string | null;
    html?: string;
    htmlTruncated?: boolean;
    errors?: unknown;
  } | null;

  return (
    <div className="flex flex-col gap-8">
      <div className="flex items-start justify-between gap-4">
        <div>
          <h1 className="break-all text-title font-semibold">{rawJob.externalUrl}</h1>
          <p className="mt-1 text-meta text-ink-muted">
            Source:{" "}
            <Link href={`/admin/sources/${rawJob.sourceId}`} className="focus-ring rounded-sm hover:underline">
              {rawJob.source.name}
            </Link>
          </p>
        </div>
        <ActionButton
          label="Reprocess"
          pendingLabel="Queuing…"
          method="POST"
          url={`/api/admin/raw-jobs/${id}/reprocess`}
        />
      </div>

      <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
        <StatTile label="Fetch status" value={rawJob.fetchStatus} />
        <StatTile label="HTTP status" value={rawJob.httpStatus ?? "—"} />
        <StatTile label="Active" value={rawJob.active ? "Yes" : "No"} />
        <StatTile label="Needs aggregation" value={rawJob.needsAggregation ? "Yes" : "No"} />
        <StatTile label="Consecutive missing" value={rawJob.consecutiveMissingRuns} />
        <StatTile label="First seen" value={new Date(rawJob.discoveredAt).toLocaleDateString()} />
        <StatTile label="Last seen" value={rawJob.lastSeenAt ? new Date(rawJob.lastSeenAt).toLocaleDateString() : "—"} />
        <StatTile
          label="Last crawled"
          value={rawJob.lastCrawledAt ? new Date(rawJob.lastCrawledAt).toLocaleDateString() : "—"}
        />
      </div>

      {rawJob.job && (
        <p className="text-meta">
          Linked job:{" "}
          <Link href={`/jobs/${rawJob.job.slug}`} className="focus-ring rounded-sm font-medium text-ink hover:underline">
            {rawJob.job.title}
          </Link>{" "}
          <span className="text-ink-muted">({rawJob.job.status})</span>
        </p>
      )}

      <section className="flex flex-col gap-3">
        <h2 className="text-body font-semibold">Raw extraction bundle</h2>
        <div className="flex flex-col gap-2">
          <JsonViewer label="Reconciled pre-AI candidates" value={bundle?.reconciled ?? null} defaultOpen />
          <JsonViewer label="JSON-LD objects" value={bundle?.jsonLd ?? []} />
          <JsonViewer label="Selector fields" value={bundle?.selectors ?? {}} />
          <JsonViewer label="Page metadata" value={bundle?.metadata ?? {}} />
          <JsonViewer label="Readable text" value={bundle?.readableText ?? null} />
          <JsonViewer label="Markdown" value={bundle?.markdown ?? null} />
          <JsonViewer
            label={`Raw HTML${bundle?.htmlTruncated ? " (truncated)" : ""}`}
            value={bundle?.html ?? null}
          />
        </div>
      </section>

      <section className="flex flex-col gap-3">
        <h2 className="text-body font-semibold">Aggregation attempts</h2>
        {rawJob.improvementRuns.length === 0 && <p className="text-meta text-ink-muted">None yet.</p>}
        <div className="flex flex-col gap-2">
          {rawJob.improvementRuns.map((run) => (
            <div key={run.id} className="rounded-md border border-line bg-surface p-3">
              <div className="flex items-center gap-2 text-label uppercase text-ink-muted">
                <span>{run.status}</span>
                <span aria-hidden="true">·</span>
                <span>{run.model}</span>
                <span aria-hidden="true">·</span>
                <span>{new Date(run.createdAt).toLocaleString()}</span>
                {run.inputTokens !== null && (
                  <>
                    <span aria-hidden="true">·</span>
                    <span>
                      {run.inputTokens}+{run.outputTokens} tokens
                    </span>
                  </>
                )}
              </div>
              <JsonViewer label="Normalized result (field confidence + source)" value={run.diff} />
            </div>
          ))}
        </div>
      </section>

      <section className="flex flex-col gap-3">
        <h2 className="text-body font-semibold">Failures for this raw job</h2>
        {rawJob.ingestFailures.length === 0 && <p className="text-meta text-ink-muted">None.</p>}
        <div className="flex flex-col gap-2">
          {rawJob.ingestFailures.map((failure) => (
            <div key={failure.id} className="rounded-md border border-line bg-surface p-3">
              <div className="flex items-center gap-2 text-label uppercase text-ink-muted">
                <span>{failure.stage}</span>
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
