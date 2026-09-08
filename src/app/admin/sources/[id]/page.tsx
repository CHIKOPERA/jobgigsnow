import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { getSource } from "@/lib/ingest/source-service";
import { ActionButton } from "@/components/admin/ActionButton";
import { SourceForm } from "@/components/admin/SourceForm";

export const metadata: Metadata = { title: "Admin — Source" };
export const dynamic = "force-dynamic";

export default async function AdminSourceDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const source = await getSource(id);
  if (!source) notFound();

  return (
    <div className="flex flex-col gap-8">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div><p className="text-label uppercase tracking-[0.1em] text-ink-muted">Careers source</p><h1 className="mt-2 text-title font-semibold">{source.name}</h1><p className="mt-2 text-meta text-ink-muted">Update how this company is checked, or import its latest jobs now.</p></div>
        <ActionButton label="Import now" pendingLabel="Importing…" method="POST" url={`/api/admin/sources/${id}/run`} />
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
    </div>
  );
}
