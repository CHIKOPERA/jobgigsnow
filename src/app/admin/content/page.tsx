import type { Metadata } from "next";
import Link from "next/link";
import { opportunityCategories } from "@/config/categories";
import { listPublishedJobs } from "@/lib/ingest/admin-query";

export const metadata: Metadata = { title: "Admin — Published content" };
export const dynamic = "force-dynamic";

type Category = keyof typeof opportunityCategories;

export default async function PublishedContentPage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string; category?: string; page?: string }>;
}) {
  const params = await searchParams;
  const query = params.q?.trim().slice(0, 200) ?? "";
  const category = params.category && params.category in opportunityCategories ? params.category as Category : undefined;
  const requestedPage = Number.parseInt(params.page ?? "1", 10);
  const page = Number.isFinite(requestedPage) && requestedPage > 0 ? requestedPage : 1;
  const result = await listPublishedJobs({ query, category, page });
  const pageHref = (nextPage: number) => {
    const values = new URLSearchParams();
    if (query) values.set("q", query);
    if (category) values.set("category", category);
    values.set("page", String(nextPage));
    return `/admin/content?${values}`;
  };

  return (
    <div className="flex flex-col gap-7">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <p className="text-label uppercase tracking-[0.1em] text-ink-muted">Content library</p>
          <h1 className="mt-2 text-h2 font-medium">Published content</h1>
          <p className="mt-2 text-body text-ink-muted">Browse and manage every job currently visible on the public site.</p>
        </div>
        <Link href="/admin/content/new" className="focus-ring inline-flex h-11 items-center rounded-pill bg-ink px-5 text-meta font-semibold text-surface">Add new content</Link>
      </div>

      <form className="grid gap-3 rounded-lg border border-line bg-surface p-4 sm:grid-cols-[minmax(0,1fr)_240px_auto]">
        <input name="q" defaultValue={query} placeholder="Search title, company or location" className="focus-ring h-11 rounded-md border border-line bg-bg px-3 text-meta" />
        <select name="category" defaultValue={category ?? ""} className="focus-ring h-11 rounded-md border border-line bg-bg px-3 text-meta">
          <option value="">All categories</option>
          {Object.values(opportunityCategories).map((item) => <option key={item.value} value={item.value}>{item.label}</option>)}
        </select>
        <button className="focus-ring h-11 rounded-pill border border-line-strong px-5 text-meta font-semibold">Filter</button>
      </form>

      <div className="flex items-center justify-between text-meta text-ink-muted">
        <p>{result.total} published {result.total === 1 ? "item" : "items"}</p>
        {result.total > 0 && <p>Page {result.page} of {result.pageCount}</p>}
      </div>

      {result.jobs.length === 0 ? (
        <div className="rounded-lg border border-dashed border-line-strong bg-surface/60 px-6 py-14 text-center">
          <p className="text-title font-semibold">No published content found</p>
          <p className="mt-2 text-meta text-ink-muted">Try another filter or add a new job.</p>
        </div>
      ) : (
        <div className="overflow-x-auto rounded-lg border border-line bg-surface">
          <table className="w-full min-w-[760px] text-meta">
            <thead><tr className="border-b border-line bg-surface-sunk text-left text-label uppercase text-ink-muted"><th className="px-4 py-3">Content</th><th className="px-4 py-3">Category</th><th className="px-4 py-3">Location</th><th className="px-4 py-3">Published</th><th className="px-4 py-3 text-right">Actions</th></tr></thead>
            <tbody>
              {result.jobs.map((job) => (
                <tr key={job.id} className="border-b border-line last:border-0 hover:bg-surface-sunk/60">
                  <td className="px-4 py-3"><p className="font-semibold text-ink">{job.title}</p><p className="mt-0.5 text-[12px] text-ink-muted">{job.company.name}{job.socialImageUrl ? " · Preview image set" : " · No preview image"}</p></td>
                  <td className="px-4 py-3">{opportunityCategories[job.category].label}</td>
                  <td className="px-4 py-3 text-ink-muted">{job.location}</td>
                  <td className="px-4 py-3 text-ink-muted">{new Date(job.postedAt ?? job.updatedAt).toLocaleDateString()}</td>
                  <td className="px-4 py-3"><div className="flex justify-end gap-2"><Link href={`/admin/review/${job.id}`} className="focus-ring rounded-pill px-3 py-1.5 text-[12px] font-semibold hover:bg-bg">Edit</Link><Link href={`/jobs/${job.slug}`} target="_blank" className="focus-ring rounded-pill bg-bg px-3 py-1.5 text-[12px]">View ↗</Link></div></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {result.pageCount > 1 && (
        <nav aria-label="Published content pages" className="flex justify-end gap-2">
          {result.page > 1 && <Link href={pageHref(result.page - 1)} className="focus-ring rounded-pill border border-line px-4 py-2 text-meta">← Previous</Link>}
          {result.page < result.pageCount && <Link href={pageHref(result.page + 1)} className="focus-ring rounded-pill border border-line px-4 py-2 text-meta">Next →</Link>}
        </nav>
      )}
    </div>
  );
}
