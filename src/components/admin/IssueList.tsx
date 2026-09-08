"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";

interface Issue {
  key: string;
  sourceName: string;
  stage: string;
  message: string;
  latestAt: string;
  status: "OPEN" | "RETRYING";
  affectedCount: number;
  eventCount: number;
  failureIds: string[];
  rawJobIds: string[];
}

type IssueAction = "RETRY" | "DISMISS" | "RESOLVE";

const ISSUE_TITLES: Record<string, string> = {
  DISCOVERY: "Source could not be checked",
  ACQUISITION: "Job pages could not be captured",
  EXTRACTION: "Job details could not be read",
  AGGREGATION: "Jobs could not be rewritten",
  VALIDATION: "Job details need correction",
  PERSISTENCE: "Jobs could not be saved",
  SEO_REWRITE: "SEO rewrite could not finish",
};

export function IssueList({ issues, compact = false }: { issues: Issue[]; compact?: boolean }) {
  const router = useRouter();
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [pending, setPending] = useState<string | null>(null);
  const [message, setMessage] = useState<string | null>(null);

  async function apply(failureIds: string[], action: IssueAction, key: string) {
    setPending(key + action);
    setMessage(null);
    try {
      const response = await fetch("/api/admin/issues/bulk", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ids: failureIds, action }),
      });
      const result = await response.json();
      if (!response.ok) throw new Error(result?.error?.message ?? "The issues could not be updated.");
      const retryCount = result.queued + result.sourcesQueued;
      setMessage(action === "RETRY" ? `${retryCount} ${retryCount === 1 ? "retry was" : "retries were"} queued for the next import, within 10 minutes.` : `${result.updated} ${result.updated === 1 ? "issue" : "issues"} updated.`);
      setSelected(new Set());
      router.refresh();
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "The issues could not be updated.");
    } finally {
      setPending(null);
    }
  }

  const selectedIssues = issues.filter((issue) => selected.has(issue.key));
  const selectedFailureIds = selectedIssues.flatMap((issue) => issue.failureIds);

  if (issues.length === 0) return <div className="rounded-lg border border-dashed border-line-strong bg-surface/60 px-6 py-10 text-center"><p className="text-body font-semibold">No open issues</p><p className="mt-1 text-meta text-ink-muted">Failed work will appear here with a retry action.</p></div>;

  return (
    <div className="flex flex-col gap-3">
      {!compact && <div className="flex items-center justify-between gap-3"><label className="flex items-center gap-2 text-meta text-ink-muted"><input type="checkbox" checked={selected.size === issues.length} onChange={() => setSelected(selected.size === issues.length ? new Set() : new Set(issues.map((issue) => issue.key)))} /> Select all groups</label><span className="text-[12px] text-ink-muted">{issues.reduce((sum, issue) => sum + issue.affectedCount, 0)} affected jobs</span></div>}
      {issues.map((issue) => (
        <article key={issue.key} className="rounded-lg border border-danger/25 bg-surface p-4">
          <div className="flex flex-wrap items-start gap-3">
            {!compact && <input type="checkbox" className="mt-1" aria-label={`Select ${issue.sourceName} issue`} checked={selected.has(issue.key)} onChange={() => setSelected((current) => { const next = new Set(current); if (next.has(issue.key)) next.delete(issue.key); else next.add(issue.key); return next; })} />}
            <div className="min-w-0 flex-1">
              <p className="text-label uppercase tracking-[0.07em] text-danger">{issue.stage.toLowerCase()} · {issue.affectedCount} {issue.affectedCount === 1 ? "job" : "jobs"} affected</p>
              <h3 className="mt-1 text-body font-semibold">{ISSUE_TITLES[issue.stage] ?? "Import could not finish"}</h3>
              <p className="mt-0.5 text-[12px] font-semibold text-ink-muted">{issue.sourceName}</p>
              <p className="mt-1 text-meta text-ink-muted">{issue.message}</p>
              <p className="mt-2 text-[11px] text-ink-muted">{issue.status === "RETRYING" ? "Queued for retry" : "Open"} · Last seen {new Date(issue.latestAt).toLocaleString()}{issue.eventCount > issue.affectedCount ? ` · ${issue.eventCount} attempts` : ""}</p>
            </div>
            <div className="flex flex-wrap gap-2">
              {issue.rawJobIds.length === 1 && <Link href={`/admin/raw-jobs/${issue.rawJobIds[0]}`} className="focus-ring min-h-9 rounded-pill px-3 py-2 text-[12px] font-semibold">Details</Link>}
              <button type="button" disabled={pending !== null} onClick={() => apply(issue.failureIds, "DISMISS", issue.key)} className="focus-ring min-h-9 rounded-pill border border-line px-3 text-[12px] font-semibold disabled:opacity-50">Dismiss</button>
              <button type="button" disabled={pending !== null} onClick={() => apply(issue.failureIds, "RETRY", issue.key)} className="focus-ring min-h-9 rounded-pill border border-danger px-3 text-[12px] font-semibold text-danger disabled:opacity-50">{pending === issue.key + "RETRY" ? "Queuing…" : `Retry all ${issue.affectedCount}`}</button>
            </div>
          </div>
        </article>
      ))}
      {selected.size > 0 && !compact && <div className="sticky bottom-4 z-20 flex flex-wrap items-center gap-2 rounded-xl bg-ink px-4 py-3 text-surface shadow-lg"><strong className="mr-auto text-meta">{selected.size} groups selected</strong><button type="button" disabled={pending !== null} onClick={() => apply(selectedFailureIds, "RETRY", "bulk")} className="focus-ring min-h-9 rounded-pill bg-accent-mint px-4 text-[12px] font-semibold text-ink">Retry selected</button><button type="button" disabled={pending !== null} onClick={() => apply(selectedFailureIds, "DISMISS", "bulk")} className="focus-ring min-h-9 rounded-pill border border-white/20 px-4 text-[12px] font-semibold">Dismiss selected</button><button type="button" onClick={() => setSelected(new Set())} className="focus-ring min-h-9 rounded-pill px-3 text-[12px] text-surface/65">Clear</button></div>}
      {message && <p aria-live="polite" className="text-meta text-ink-muted">{message}</p>}
    </div>
  );
}
