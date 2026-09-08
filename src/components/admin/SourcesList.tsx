"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { SourceRowActions } from "./SourceRowActions";

interface SourceRow {
  id: string;
  name: string;
  baseUrl: string;
  enabled: boolean;
  lastRunAt: string | null;
  cadenceMinutes: number;
  issueCount: number;
  latestRun: null | {
    status: string;
    newCount: number;
    failedCount: number;
    validationFailedCount: number;
    aiFailedCount: number;
  };
}

export function SourcesList({ sources }: { sources: SourceRow[] }) {
  const router = useRouter();
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [pending, setPending] = useState<"PAUSE" | "RESUME" | null>(null);
  const [message, setMessage] = useState<string | null>(null);

  async function apply(action: "PAUSE" | "RESUME") {
    setPending(action);
    setMessage(null);
    try {
      const response = await fetch("/api/admin/sources/bulk", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ ids: [...selected], action }) });
      const result = await response.json();
      if (!response.ok) throw new Error(result?.error?.message ?? "The sources could not be updated.");
      setMessage(`${result.updated} ${result.updated === 1 ? "source" : "sources"} updated.`);
      setSelected(new Set());
      router.refresh();
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "The sources could not be updated.");
    } finally {
      setPending(null);
    }
  }

  return (
    <>
      <div className="mb-3 flex items-center justify-between gap-3"><label className="flex items-center gap-2 text-meta text-ink-muted"><input type="checkbox" checked={sources.length > 0 && selected.size === sources.length} onChange={() => setSelected(selected.size === sources.length ? new Set() : new Set(sources.map((source) => source.id)))} /> Select all</label><span className="text-[12px] text-ink-muted">{sources.filter((source) => source.enabled).length} active · {sources.filter((source) => !source.enabled).length} paused</span></div>
      <div className="grid gap-3">
        {sources.map((source) => {
          const failed = source.latestRun ? source.latestRun.failedCount + source.latestRun.validationFailedCount + source.latestRun.aiFailedCount : 0;
          const nextCheck = source.enabled && source.lastRunAt ? new Date(new Date(source.lastRunAt).getTime() + source.cadenceMinutes * 60_000) : null;
          return <article key={source.id} className={`rounded-lg border bg-surface p-4 md:flex md:items-center md:justify-between md:gap-5 ${selected.has(source.id) ? "border-line-strong bg-accent-mint/10" : "border-line"}`}><div className="flex min-w-0 items-start gap-3"><input type="checkbox" className="mt-1" aria-label={`Select ${source.name}`} checked={selected.has(source.id)} onChange={() => setSelected((current) => { const next = new Set(current); if (next.has(source.id)) next.delete(source.id); else next.add(source.id); return next; })} /><div className="min-w-0"><div className="flex flex-wrap items-center gap-2"><span className={`size-2 rounded-full ${source.enabled ? source.issueCount > 0 ? "bg-danger" : "bg-accent-mint" : "bg-line-strong"}`} aria-hidden="true" /><Link href={`/admin/sources/${source.id}`} className="focus-ring truncate rounded-sm text-body font-semibold hover:underline">{source.name}</Link><span className="text-[11px] text-ink-muted">{source.enabled ? "Active" : "Paused"}</span>{source.issueCount > 0 && <Link href="/admin/activity#issues" className="rounded-pill bg-danger/10 px-2 py-1 text-[11px] font-semibold text-danger">{source.issueCount} {source.issueCount === 1 ? "issue" : "issues"}</Link>}</div><p className="mt-1 truncate text-meta text-ink-muted">{source.baseUrl}</p><p className="mt-2 text-[12px] text-ink-muted">Last checked {source.lastRunAt ? new Date(source.lastRunAt).toLocaleString() : "never"}{nextCheck ? ` · Next ${nextCheck.toLocaleString()}` : ""}</p><p className="mt-1 text-[12px] text-ink-muted">{source.latestRun ? `${source.latestRun.newCount} new · ${failed} failed · ${source.latestRun.status.toLowerCase()}` : "No runs yet"}</p></div></div><div className="mt-4 md:mt-0"><SourceRowActions sourceId={source.id} initiallyEnabled={source.enabled} /></div></article>;
        })}
      </div>
      {selected.size > 0 && <div className="sticky bottom-4 z-20 flex flex-wrap items-center gap-2 rounded-xl bg-ink px-4 py-3 text-surface shadow-lg"><strong className="mr-auto text-meta">{selected.size} selected</strong><button type="button" disabled={pending !== null} onClick={() => apply("RESUME")} className="focus-ring min-h-9 rounded-pill bg-accent-mint px-4 text-[12px] font-semibold text-ink disabled:opacity-50">{pending === "RESUME" ? "Resuming…" : "Resume"}</button><button type="button" disabled={pending !== null} onClick={() => apply("PAUSE")} className="focus-ring min-h-9 rounded-pill border border-white/20 px-4 text-[12px] font-semibold disabled:opacity-50">{pending === "PAUSE" ? "Pausing…" : "Pause"}</button><button type="button" onClick={() => setSelected(new Set())} className="focus-ring min-h-9 rounded-pill px-3 text-[12px] text-surface/65">Clear</button></div>}
      {message && <p aria-live="polite" className="text-meta text-ink-muted">{message}</p>}
    </>
  );
}
