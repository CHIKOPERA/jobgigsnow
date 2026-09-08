import type { Metadata } from "next";
import Link from "next/link";
import { AdminAutoRefresh } from "@/components/admin/AdminAutoRefresh";
import { IssueList } from "@/components/admin/IssueList";
import { RunControls } from "@/components/admin/RunControls";
import { RunStatusBadge } from "@/components/admin/RunStatusBadge";
import { RunTickButton } from "@/components/admin/RunTickButton";
import { getOperationsDashboard } from "@/lib/ingest/admin-query";

export const metadata: Metadata = { title: "Admin — Dashboard" };
export const dynamic = "force-dynamic";

function runOutcome(run: { newCount: number; failedCount: number; validationFailedCount: number; aiFailedCount: number } | null) {
  if (!run) return "Not checked yet";
  const failed = run.failedCount + run.validationFailedCount + run.aiFailedCount;
  if (failed > 0) return `${failed} ${failed === 1 ? "issue" : "issues"}`;
  if (run.newCount > 0) return `${run.newCount} new ${run.newCount === 1 ? "job" : "jobs"}`;
  return "Up to date";
}

export default async function AdminDashboardPage() {
  const dashboard = await getOperationsDashboard();
  const { metrics, activeRuns, issueGroups, sources } = dashboard;

  return (
    <div className="flex flex-col gap-8">
      <AdminAutoRefresh active={activeRuns.some((run) => run.status === "RUNNING")} />
      <header className="flex flex-wrap items-end justify-between gap-4">
        <div><p className="text-label uppercase tracking-[0.1em] text-ink-muted">Publishing overview</p><h1 className="mt-2 text-title font-semibold">Dashboard</h1><p className="mt-2 text-body text-ink-muted">See what is running, what needs action and what went live today.</p></div>
        <div className="flex gap-2"><Link href="/admin/sources/new" className="focus-ring inline-flex h-10 items-center rounded-pill border border-line-strong px-4 text-meta font-semibold">Add source</Link><Link href="/admin/crawl" className="focus-ring inline-flex h-10 items-center rounded-pill bg-ink px-4 text-meta font-semibold text-surface">Import one job</Link></div>
      </header>

      <section aria-label="Today’s outcomes" className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        <div className="rounded-lg border border-line bg-surface p-4"><p className="text-[12px] text-ink-muted">Found today</p><p className="mt-1 text-h2 font-medium">{metrics.foundToday}</p></div>
        <Link href="/admin/content?status=PUBLISHED" className="focus-ring rounded-lg border border-line bg-surface p-4 hover:border-line-strong"><p className="text-[12px] text-ink-muted">Published today</p><p className="mt-1 text-h2 font-medium">{metrics.publishedToday}</p></Link>
        <Link href="/admin/content?status=READY" className="focus-ring rounded-lg border border-line bg-surface p-4 hover:border-line-strong"><p className="text-[12px] text-ink-muted">Ready to publish</p><p className="mt-1 text-h2 font-medium">{metrics.readyToPublish}</p></Link>
        <Link href="/admin/activity#issues" className={`focus-ring rounded-lg border bg-surface p-4 hover:border-line-strong ${metrics.openIssues > 0 ? "border-danger/35" : "border-line"}`}><p className="text-[12px] text-ink-muted">Open issues</p><p className={`mt-1 text-h2 font-medium ${metrics.openIssues > 0 ? "text-danger" : ""}`}>{metrics.openIssues}</p></Link>
      </section>

      <section className="flex flex-col gap-3">
        <div className="flex items-center justify-between gap-3"><div><h2 className="text-body font-semibold">Current imports</h2><p className="mt-1 text-meta text-ink-muted">Progress is saved and continues to appear after refresh.</p></div>{activeRuns.length > 0 && <Link href="/admin/activity" className="focus-ring rounded-pill px-3 py-2 text-meta font-semibold">View activity →</Link>}</div>
        {activeRuns.length === 0 ? <div className="rounded-xl bg-ink p-6 text-surface md:p-7"><p className="text-label uppercase tracking-[0.1em] text-surface/55">Ready</p><h3 className="mt-2 text-h2 font-medium">Import from all active sources</h3><p className="mt-2 max-w-xl text-body text-surface/65">Check each careers page and publish valid new jobs.</p><div className="mt-5"><RunTickButton /></div></div> : activeRuns.map((run) => {
          const percent = run.total > 0 ? Math.min(100, Math.round((run.processed / run.total) * 100)) : 0;
          return <article key={run.id} className="rounded-xl border border-line bg-surface p-5 md:p-6"><div className="flex flex-wrap items-start justify-between gap-4"><div><div className="flex items-center gap-2"><Link href={`/admin/runs/${run.id}`} className="focus-ring rounded-sm text-body font-semibold hover:underline">{run.source.name}</Link><RunStatusBadge status={run.status} /></div><p className="mt-1 text-meta text-ink-muted">Started {new Date(run.startedAt).toLocaleString()}</p></div><RunControls runId={run.id} initialStatus={run.status} /></div><div className="mt-5 h-2 overflow-hidden rounded-pill bg-surface-sunk"><div className="h-full rounded-pill bg-accent-mint transition-[width]" style={{ width: `${percent}%` }} /></div><div className="mt-2 flex flex-wrap justify-between gap-2 text-[12px] text-ink-muted"><span>{run.status === "PAUSED" ? "Paused safely" : run.currentStage ? `${run.currentStage.toLowerCase()}${run.currentJobTitle ? ` · ${run.currentJobTitle}` : ""}` : "Preparing next job"}</span><span>{run.processed}/{run.total} processed · {run.published} published · {run.failed} failed</span></div></article>;
        })}
      </section>

      <section className="grid gap-4 lg:grid-cols-[minmax(0,1.55fr)_minmax(280px,.8fr)]">
        <div className="flex flex-col gap-3"><div className="flex items-end justify-between gap-3"><div><h2 className="text-body font-semibold">Latest issues</h2><p className="mt-1 text-meta text-ink-muted">Repeated failures are grouped into one problem.</p></div>{issueGroups.length > 0 && <Link href="/admin/activity#issues" className="focus-ring rounded-pill px-3 py-2 text-meta font-semibold">View all →</Link>}</div><IssueList compact issues={issueGroups.map((issue) => ({ ...issue, latestAt: issue.latestAt.toISOString() }))} /></div>
        <aside className="rounded-xl border border-line bg-surface"><div className="border-b border-line p-4"><h2 className="text-body font-semibold">Needs action</h2></div><Link href="/admin/content?status=READY" className="focus-ring flex items-center justify-between gap-3 border-b border-line p-4 hover:bg-surface-sunk"><div><p className="text-meta font-semibold">{metrics.readyToPublish} jobs ready</p><p className="mt-1 text-[12px] text-ink-muted">Processing complete</p></div><span aria-hidden="true">→</span></Link><Link href="/admin/activity#issues" className="focus-ring flex items-center justify-between gap-3 border-b border-line p-4 hover:bg-surface-sunk"><div><p className="text-meta font-semibold">{metrics.openIssues} open issues</p><p className="mt-1 text-[12px] text-ink-muted">Retry or dismiss</p></div><span aria-hidden="true">→</span></Link><Link href="/admin/sources" className="focus-ring flex items-center justify-between gap-3 p-4 hover:bg-surface-sunk"><div><p className="text-meta font-semibold">{metrics.pausedSources} paused sources</p><p className="mt-1 text-[12px] text-ink-muted">{metrics.activeSources} currently active</p></div><span aria-hidden="true">→</span></Link></aside>
      </section>

      <section className="flex flex-col gap-3"><div className="flex items-center justify-between gap-3"><div><h2 className="text-body font-semibold">Source health</h2><p className="mt-1 text-meta text-ink-muted">Latest outcome and next scheduled check.</p></div><Link href="/admin/sources" className="focus-ring rounded-pill px-3 py-2 text-meta font-semibold">Manage sources →</Link></div><div className="divide-y divide-line rounded-lg border border-line bg-surface">{sources.map((source) => { const nextCheck = source.enabled && source.lastRunAt ? new Date(source.lastRunAt.getTime() + source.cadenceMinutes * 60_000) : null; return <Link key={source.id} href={`/admin/sources/${source.id}`} className="focus-ring grid gap-2 p-4 hover:bg-surface-sunk sm:grid-cols-[minmax(0,1fr)_auto] sm:items-center"><div><div className="flex items-center gap-2"><span className={`size-2 rounded-full ${source.enabled ? source.issueCount > 0 ? "bg-danger" : "bg-accent-mint" : "bg-line-strong"}`} /><p className="text-meta font-semibold">{source.name}</p><span className="text-[11px] text-ink-muted">{source.enabled ? "Active" : "Paused"}</span></div><p className="mt-1 text-[12px] text-ink-muted">Last checked {source.lastRunAt ? new Date(source.lastRunAt).toLocaleString() : "never"}{nextCheck ? ` · Next ${nextCheck.toLocaleString()}` : ""}</p></div><div className="text-left sm:text-right"><p className={`text-[12px] font-semibold ${source.issueCount > 0 ? "text-danger" : ""}`}>{source.issueCount > 0 ? `${source.issueCount} ${source.issueCount === 1 ? "issue" : "issues"}` : runOutcome(source.latestRun)}</p></div></Link>; })}{sources.length === 0 && <p className="p-6 text-meta text-ink-muted">Add a careers source to start importing jobs.</p>}</div></section>
    </div>
  );
}
