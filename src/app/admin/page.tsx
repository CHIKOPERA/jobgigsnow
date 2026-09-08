import type { Metadata } from "next";
import Link from "next/link";
import { RunTickButton } from "@/components/admin/RunTickButton";
import { prisma } from "@/lib/prisma";

export const metadata: Metadata = { title: "Admin — Publishing" };
export const dynamic = "force-dynamic";

export default async function AdminDashboardPage() {
  const startOfToday = new Date();
  startOfToday.setHours(0, 0, 0, 0);
  const [sources, attention, published, failuresToday, recentJobs] = await Promise.all([
    prisma.source.count({ where: { enabled: true } }),
    prisma.job.count({ where: { status: { in: ["READY", "IMPROVING"] } } }),
    prisma.job.count({ where: { status: "PUBLISHED" } }),
    prisma.ingestFailure.count({ where: { createdAt: { gte: startOfToday } } }),
    prisma.job.findMany({
      where: { status: "PUBLISHED" }, orderBy: { updatedAt: "desc" }, take: 8,
      select: { id: true, title: true, slug: true, company: { select: { name: true } } },
    }),
  ]);

  return (
    <div className="flex flex-col gap-9">
      <header>
        <p className="text-label uppercase tracking-[0.1em] text-ink-muted">Publishing dashboard</p>
        <h1 className="mt-2 text-title font-semibold">Get new jobs live</h1>
        <p className="mt-2 max-w-2xl text-body text-ink-muted">
          Choose where the jobs come from. Capture, rewriting, image selection and publishing happen automatically.
        </p>
      </header>

      <section className="grid gap-4 lg:grid-cols-[minmax(0,1.5fr)_minmax(280px,1fr)]">
        <div className="rounded-xl bg-ink p-6 text-surface md:p-8">
          <p className="text-label uppercase tracking-[0.1em] text-surface/55">Recommended</p>
          <h2 className="mt-3 text-h2 font-medium">{sources > 0 ? "Import from all sources" : "Add your first careers source"}</h2>
          <p className="mt-2 max-w-xl text-body text-surface/65">
            {sources > 0
              ? "Check every active careers page and publish any new jobs found."
              : "Connect a company careers page once, then check it automatically for new jobs."}
          </p>
          <div className="mt-6">
            {sources > 0 ? <RunTickButton /> : (
              <Link href="/admin/sources/new" className="focus-ring inline-flex h-12 items-center rounded-pill bg-accent-mint px-6 text-meta font-semibold text-ink">Add first source</Link>
            )}
          </div>
        </div>

        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-1">
          <Link href="/admin/sources/new" className="focus-ring group rounded-xl border border-line bg-surface p-5 hover:border-line-strong">
            <p className="text-body font-semibold">{sources > 0 ? "Add another source" : "Add a careers source"} <span aria-hidden="true">→</span></p>
            <p className="mt-1 text-meta text-ink-muted">Set up a company once, then import it automatically.</p>
          </Link>
          <Link href="/admin/crawl" className="focus-ring group rounded-xl border border-line bg-surface p-5 hover:border-line-strong">
            <p className="text-body font-semibold">Import one job <span aria-hidden="true">→</span></p>
            <p className="mt-1 text-meta text-ink-muted">Paste a job URL and publish it immediately.</p>
          </Link>
        </div>
      </section>

      <section aria-label="Publishing status" className="grid gap-3 sm:grid-cols-3">
        <Link href="/admin/content" className="focus-ring rounded-lg border border-line bg-surface p-4 hover:border-line-strong">
          <p className="text-[12px] text-ink-muted">Live jobs</p><p className="mt-1 text-h2 font-medium">{published}</p>
        </Link>
        <Link href="/admin/sources" className="focus-ring rounded-lg border border-line bg-surface p-4 hover:border-line-strong">
          <p className="text-[12px] text-ink-muted">Active sources</p><p className="mt-1 text-h2 font-medium">{sources}</p>
        </Link>
        <Link href="/admin/review" className={`focus-ring rounded-lg border p-4 ${attention > 0 ? "border-danger/30 bg-danger/5" : "border-line bg-surface"}`}>
          <p className="text-[12px] text-ink-muted">Needs attention</p>
          <p className="mt-1 text-h2 font-medium">{attention > 0 ? attention : "All clear"}</p>
        </Link>
      </section>

      {failuresToday > 0 && (
        <Link href="/admin/failures" className="focus-ring flex flex-wrap items-center justify-between gap-3 rounded-lg border border-danger/30 bg-danger/5 px-4 py-3 text-meta">
          <span><strong>{failuresToday} {failuresToday === 1 ? "import issue" : "import issues"} today.</strong> Other jobs can still publish normally.</span>
          <span className="font-semibold">Review issues →</span>
        </Link>
      )}

      <section>
        <div className="flex items-center justify-between gap-3">
          <h2 className="text-body font-semibold">Recently published</h2>
          <Link href="/admin/content" className="focus-ring rounded-pill px-3 py-2 text-meta text-ink-muted hover:bg-surface">Manage all</Link>
        </div>
        <div className="mt-4 divide-y divide-line rounded-lg border border-line bg-surface">
          {recentJobs.length === 0 && <p className="p-6 text-meta text-ink-muted">Add a source to start publishing jobs.</p>}
          {recentJobs.map((job) => (
            <div key={job.id} className="flex items-center justify-between gap-4 p-4">
              <div><Link href={`/admin/review/${job.id}`} className="focus-ring rounded-sm text-meta font-semibold hover:underline">{job.title}</Link><p className="text-meta text-ink-muted">{job.company.name}</p></div>
              <Link href={`/jobs/${job.slug}`} className="focus-ring shrink-0 rounded-pill px-3 py-2 text-meta">View ↗</Link>
            </div>
          ))}
        </div>
      </section>
    </div>
  );
}
