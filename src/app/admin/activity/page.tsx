import type { Metadata } from "next";
import Link from "next/link";
import { AdminAutoRefresh } from "@/components/admin/AdminAutoRefresh";
import { IssueList } from "@/components/admin/IssueList";
import { RunControls } from "@/components/admin/RunControls";
import { RunStatusBadge } from "@/components/admin/RunStatusBadge";
import { listActiveRunsWithProgress, listIssueGroups, listRuns } from "@/lib/ingest/admin-query";

export const metadata: Metadata = { title: "Admin — Activity" };
export const dynamic = "force-dynamic";

export default async function AdminActivityPage() {
  const [{ runs }, issues, active] = await Promise.all([listRuns({ limit: 40 }), listIssueGroups(), listActiveRunsWithProgress()]);

  return (
    <div className="flex flex-col gap-8">
      <AdminAutoRefresh active={active.some((run) => run.status === "RUNNING")} />
      <header>
        <p className="text-label uppercase tracking-[0.1em] text-ink-muted">Operations</p>
        <h1 className="mt-2 text-h2 font-medium">Activity</h1>
        <p className="mt-2 max-w-2xl text-body text-ink-muted">Follow imports, recover failed jobs and inspect earlier runs.</p>
      </header>

      {active.length > 0 && <section className="flex flex-col gap-3"><div className="flex items-center justify-between"><h2 className="text-body font-semibold">Active imports</h2><span className="text-meta text-ink-muted">Updates automatically</span></div>{active.map((run) => {
        return <article key={run.id} className="rounded-xl border border-line bg-surface p-5"><div className="flex flex-wrap items-start justify-between gap-4"><div><div className="flex items-center gap-2"><Link href={`/admin/runs/${run.id}`} className="focus-ring rounded-sm text-body font-semibold hover:underline">{run.source.name}</Link><RunStatusBadge status={run.status} /></div><p className="mt-1 text-meta text-ink-muted">Started {new Date(run.startedAt).toLocaleString()}</p></div><RunControls runId={run.id} initialStatus={run.status} /></div><div className="mt-5 h-2 overflow-hidden rounded-pill bg-surface-sunk"><div className="h-full rounded-pill bg-accent-mint" style={{ width: `${run.total > 0 ? Math.min(100, Math.round((run.processed / run.total) * 100)) : 0}%` }} /></div><div className="mt-2 flex flex-wrap justify-between gap-2 text-[12px] text-ink-muted"><span>{run.status === "PAUSED" ? "Paused safely" : run.currentStage ? `${run.currentStage.toLowerCase()}${run.currentJobTitle ? ` · ${run.currentJobTitle}` : ""}` : "Preparing next job"}</span><span>{run.processed}/{run.total} processed · {run.published} published · {run.failed} failed</span></div></article>;
      })}</section>}

      <section id="issues" className="flex scroll-mt-24 flex-col gap-3">
        <div className="flex flex-wrap items-end justify-between gap-3"><div><h2 className="text-body font-semibold">Open issues</h2><p className="mt-1 text-meta text-ink-muted">Repeated errors are grouped by source and cause.</p></div>{issues.length > 0 && <span className="rounded-pill bg-danger/10 px-3 py-1.5 text-meta font-semibold text-danger">{issues.length} {issues.length === 1 ? "group" : "groups"}</span>}</div>
        <IssueList issues={issues.map((issue) => ({ ...issue, latestAt: issue.latestAt.toISOString() }))} />
      </section>

      <section className="flex flex-col gap-3"><div><h2 className="text-body font-semibold">Run history</h2><p className="mt-1 text-meta text-ink-muted">Technical counters are available inside each run.</p></div><div className="overflow-x-auto rounded-lg border border-line bg-surface"><table className="w-full min-w-[700px] text-meta"><thead><tr className="border-b border-line bg-surface-sunk text-left text-label uppercase text-ink-muted"><th className="px-4 py-3">Source</th><th className="px-4 py-3">Status</th><th className="px-4 py-3">Started</th><th className="px-4 py-3">Outcome</th><th className="px-4 py-3 text-right">Details</th></tr></thead><tbody>{runs.map((run) => { const failed = run.failedCount + run.validationFailedCount + run.aiFailedCount; return <tr key={run.id} className="border-b border-line last:border-0 hover:bg-surface-sunk/60"><td className="px-4 py-3 font-semibold">{run.source.name}</td><td className="px-4 py-3"><RunStatusBadge status={run.status} /></td><td className="px-4 py-3 whitespace-nowrap text-ink-muted">{new Date(run.startedAt).toLocaleString()}</td><td className="px-4 py-3 text-ink-muted">{run.newCount} new · {failed} failed</td><td className="px-4 py-3 text-right"><Link href={`/admin/runs/${run.id}`} className="focus-ring rounded-pill px-3 py-2 font-semibold">Open →</Link></td></tr>; })}{runs.length === 0 && <tr><td colSpan={5} className="px-4 py-8 text-center text-ink-muted">No imports yet.</td></tr>}</tbody></table></div></section>
    </div>
  );
}
