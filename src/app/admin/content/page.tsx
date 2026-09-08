import type { Metadata } from "next";
import type { JobStatus } from "@/generated/prisma/client";
import Link from "next/link";
import { JobsTable } from "@/components/admin/JobsTable";
import { opportunityCategories } from "@/config/categories";
import { listAdminJobs } from "@/lib/ingest/admin-query";

export const metadata: Metadata = { title: "Admin — Jobs" };
export const dynamic = "force-dynamic";

type Category = keyof typeof opportunityCategories;
const STATUSES = ["DISCOVERED", "IMPROVING", "READY", "PUBLISHED", "CLOSED", "ARCHIVED", "REJECTED"] as const;
const TABS: Array<{ value?: JobStatus; label: string }> = [
  { label: "All" },
  { value: "READY", label: "Ready" },
  { value: "PUBLISHED", label: "Published" },
  { value: "CLOSED", label: "Closed" },
  { value: "ARCHIVED", label: "Archived" },
  { value: "REJECTED", label: "Rejected" },
];

export default async function AdminJobsPage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string; category?: string; status?: string; page?: string }>;
}) {
  const params = await searchParams;
  const query = params.q?.trim().slice(0, 200) ?? "";
  const category = params.category && params.category in opportunityCategories ? params.category as Category : undefined;
  const status = STATUSES.includes(params.status as typeof STATUSES[number]) ? params.status as JobStatus : undefined;
  const requestedPage = Number.parseInt(params.page ?? "1", 10);
  const page = Number.isFinite(requestedPage) && requestedPage > 0 ? requestedPage : 1;
  const result = await listAdminJobs({ query, category, status, page });

  const href = (values: { page?: number; status?: JobStatus }) => {
    const next = new URLSearchParams();
    if (query) next.set("q", query);
    if (category) next.set("category", category);
    const nextStatus = Object.hasOwn(values, "status") ? values.status : status;
    if (nextStatus) next.set("status", nextStatus);
    if (values.page && values.page > 1) next.set("page", String(values.page));
    const queryString = next.toString();
    return `/admin/content${queryString ? `?${queryString}` : ""}`;
  };

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <p className="text-label uppercase tracking-[0.1em] text-ink-muted">Content operations</p>
          <h1 className="mt-2 text-h2 font-medium">Jobs</h1>
          <p className="mt-2 text-body text-ink-muted">Review, publish and manage every job from one place.</p>
        </div>
        <Link href="/admin/content/new" className="focus-ring inline-flex h-11 items-center rounded-pill bg-ink px-5 text-meta font-semibold text-surface">Add job manually</Link>
      </div>

      <nav aria-label="Job status" className="flex gap-1 overflow-x-auto border-b border-line pb-2">
        {TABS.map((tab) => {
          const active = status === tab.value || (!status && !tab.value);
          const count = tab.value ? result.counts[tab.value] ?? 0 : Object.values(result.counts).reduce((sum, value) => sum + (value ?? 0), 0);
          return <Link key={tab.label} href={href({ status: tab.value })} aria-current={active ? "page" : undefined} className={`focus-ring whitespace-nowrap rounded-pill px-3 py-2 text-meta font-semibold ${active ? "bg-ink text-surface" : "text-ink-muted hover:bg-surface"}`}>{tab.label} <span className={active ? "text-surface/60" : "text-ink-muted"}>{count}</span></Link>;
        })}
      </nav>

      <form className="grid gap-3 rounded-lg border border-line bg-surface p-4 sm:grid-cols-[minmax(0,1fr)_240px_auto]">
        {status && <input type="hidden" name="status" value={status} />}
        <input name="q" defaultValue={query} placeholder="Search title, company or location" className="focus-ring h-11 rounded-md border border-line bg-bg px-3 text-meta" />
        <select name="category" defaultValue={category ?? ""} className="focus-ring h-11 rounded-md border border-line bg-bg px-3 text-meta">
          <option value="">All categories</option>
          {Object.values(opportunityCategories).map((item) => <option key={item.value} value={item.value}>{item.label}</option>)}
        </select>
        <button className="focus-ring h-11 rounded-pill border border-line-strong px-5 text-meta font-semibold">Filter</button>
      </form>

      <div className="flex items-center justify-between text-meta text-ink-muted"><p>{result.total} {result.total === 1 ? "job" : "jobs"}</p>{result.total > 0 && <p>Page {result.page} of {result.pageCount}</p>}</div>

      <JobsTable
        filteredStatus={status}
        jobs={result.jobs.map((job) => ({
          id: job.id,
          slug: job.slug,
          title: job.title,
          companyName: job.company.name,
          categoryLabel: opportunityCategories[job.category].label,
          location: job.location,
          status: job.status,
          sourceName: job.rawJob?.source.name ?? "Manual",
          updatedAt: job.updatedAt.toISOString(),
          hasImage: Boolean(job.socialImageUrl),
        }))}
      />

      {result.pageCount > 1 && <nav aria-label="Job pages" className="flex justify-end gap-2">{result.page > 1 && <Link href={href({ page: result.page - 1 })} className="focus-ring rounded-pill border border-line px-4 py-2 text-meta">← Previous</Link>}{result.page < result.pageCount && <Link href={href({ page: result.page + 1 })} className="focus-ring rounded-pill border border-line px-4 py-2 text-meta">Next →</Link>}</nav>}
    </div>
  );
}
