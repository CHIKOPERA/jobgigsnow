"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";

type JobStatus = "DISCOVERED" | "IMPROVING" | "READY" | "PUBLISHED" | "CLOSED" | "ARCHIVED" | "REJECTED";
type BulkAction = "PUBLISH" | "ARCHIVE" | "CLOSE" | "REJECT";

interface AdminJobRow {
  id: string;
  slug: string;
  title: string;
  companyName: string;
  categoryLabel: string;
  location: string;
  status: JobStatus;
  sourceName: string;
  updatedAt: string;
  hasImage: boolean;
}

const STATUS_STYLE: Record<JobStatus, string> = {
  DISCOVERED: "bg-surface-sunk text-ink-muted",
  IMPROVING: "bg-accent-iris text-ink",
  READY: "bg-accent-mint text-ink",
  PUBLISHED: "bg-ink text-surface",
  CLOSED: "bg-surface-sunk text-ink-muted",
  ARCHIVED: "bg-surface-sunk text-ink-muted",
  REJECTED: "bg-danger/10 text-danger",
};

function actionsFor(status?: JobStatus): Array<{ action: BulkAction; label: string; danger?: boolean }> {
  if (status === "READY") return [{ action: "PUBLISH", label: "Publish" }, { action: "ARCHIVE", label: "Archive" }, { action: "REJECT", label: "Reject", danger: true }];
  if (status === "PUBLISHED") return [{ action: "CLOSE", label: "Close" }, { action: "ARCHIVE", label: "Archive" }];
  if (status === "CLOSED" || status === "ARCHIVED" || status === "REJECTED") return [{ action: "PUBLISH", label: "Publish" }];
  return [{ action: "PUBLISH", label: "Publish" }, { action: "ARCHIVE", label: "Archive" }];
}

export function JobsTable({ jobs, filteredStatus }: { jobs: AdminJobRow[]; filteredStatus?: JobStatus }) {
  const router = useRouter();
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [pending, setPending] = useState<BulkAction | null>(null);
  const [message, setMessage] = useState<string | null>(null);
  const allSelected = jobs.length > 0 && jobs.every((job) => selected.has(job.id));

  function toggle(id: string) {
    setSelected((current) => {
      const next = new Set(current);
      if (next.has(id)) next.delete(id); else next.add(id);
      return next;
    });
  }

  async function apply(action: BulkAction) {
    if (selected.size === 0) return;
    const verb = action === "PUBLISH" ? "publish" : action === "REJECT" ? "reject" : action === "CLOSE" ? "close" : "archive";
    if ((action === "PUBLISH" || action === "REJECT") && !window.confirm(`${verb[0].toUpperCase()}${verb.slice(1)} ${selected.size} selected ${selected.size === 1 ? "job" : "jobs"}?`)) return;
    setPending(action);
    setMessage(null);
    try {
      const response = await fetch("/api/admin/jobs/bulk", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ids: [...selected], action }),
      });
      const result = await response.json();
      if (!response.ok) throw new Error(result?.error?.message ?? "The jobs could not be updated.");
      setMessage(`${result.updated} ${result.updated === 1 ? "job" : "jobs"} updated${result.skipped > 0 ? ` · ${result.skipped} skipped because the action did not apply` : ""}.`);
      setSelected(new Set());
      router.refresh();
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "The jobs could not be updated.");
    } finally {
      setPending(null);
    }
  }

  if (jobs.length === 0) return (
    <div className="rounded-lg border border-dashed border-line-strong bg-surface/60 px-6 py-14 text-center">
      <p className="text-title font-semibold">No jobs found</p>
      <p className="mt-2 text-meta text-ink-muted">Try another status or search.</p>
    </div>
  );

  return (
    <>
      <div className="overflow-x-auto rounded-lg border border-line bg-surface">
        <table className="w-full min-w-[850px] text-meta">
          <thead><tr className="border-b border-line bg-surface-sunk text-left text-label uppercase text-ink-muted">
            <th className="w-12 px-4 py-3"><input type="checkbox" aria-label="Select all jobs on this page" checked={allSelected} onChange={() => setSelected(allSelected ? new Set() : new Set(jobs.map((job) => job.id)))} /></th>
            <th className="px-2 py-3">Job</th><th className="px-4 py-3">Status</th><th className="px-4 py-3">Location</th><th className="px-4 py-3">Source</th><th className="px-4 py-3">Updated</th><th className="px-4 py-3 text-right">Actions</th>
          </tr></thead>
          <tbody>{jobs.map((job) => (
            <tr key={job.id} className={`border-b border-line last:border-0 hover:bg-surface-sunk/60 ${selected.has(job.id) ? "bg-accent-mint/15" : ""}`}>
              <td className="px-4 py-3"><input type="checkbox" aria-label={`Select ${job.title}`} checked={selected.has(job.id)} onChange={() => toggle(job.id)} /></td>
              <td className="px-2 py-3"><Link href={`/admin/review/${job.id}`} className="focus-ring rounded-sm font-semibold hover:underline">{job.title}</Link><p className="mt-0.5 text-[12px] text-ink-muted">{job.companyName} · {job.categoryLabel}{job.hasImage ? " · Image set" : ""}</p></td>
              <td className="px-4 py-3"><span className={`rounded-pill px-2.5 py-1 text-[11px] font-semibold ${STATUS_STYLE[job.status]}`}>{job.status.toLowerCase()}</span></td>
              <td className="px-4 py-3 text-ink-muted">{job.location}</td>
              <td className="px-4 py-3 text-ink-muted">{job.sourceName}</td>
              <td className="px-4 py-3 whitespace-nowrap text-ink-muted">{new Date(job.updatedAt).toLocaleDateString()}</td>
              <td className="px-4 py-3"><div className="flex justify-end gap-2"><Link href={`/admin/review/${job.id}`} className="focus-ring rounded-pill px-3 py-1.5 text-[12px] font-semibold hover:bg-bg">Edit</Link>{job.status === "PUBLISHED" && <Link href={`/jobs/${job.slug}`} target="_blank" className="focus-ring rounded-pill bg-bg px-3 py-1.5 text-[12px]">View ↗</Link>}</div></td>
            </tr>
          ))}</tbody>
        </table>
      </div>

      {selected.size > 0 && (
        <div className="sticky bottom-4 z-20 flex flex-wrap items-center gap-2 rounded-xl border border-line-strong bg-ink px-4 py-3 text-surface shadow-lg">
          <strong className="mr-auto text-meta">{selected.size} selected</strong>
          {actionsFor(filteredStatus).map(({ action, label, danger }) => (
            <button key={action} type="button" disabled={pending !== null} onClick={() => apply(action)} className={`focus-ring min-h-9 rounded-pill px-4 text-[12px] font-semibold disabled:opacity-50 ${danger ? "text-[#f2b5b5]" : action === "PUBLISH" ? "bg-accent-mint text-ink" : "border border-white/20"}`}>
              {pending === action ? `${label}ing…` : label}
            </button>
          ))}
          <button type="button" onClick={() => setSelected(new Set())} className="focus-ring min-h-9 rounded-pill px-3 text-[12px] text-surface/65">Clear</button>
        </div>
      )}
      {message && <p aria-live="polite" className="text-meta text-ink-muted">{message}</p>}
    </>
  );
}
