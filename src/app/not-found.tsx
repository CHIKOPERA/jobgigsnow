import Link from "next/link";

export default function NotFound() {
  return (
    <div className="mx-auto flex w-full max-w-2xl flex-col items-center px-4 py-20 text-center md:px-6">
      <p className="text-label font-medium uppercase tracking-[0.08em] text-ink-muted">404</p>
      <h1 className="mt-3 text-h2">This page is no longer here</h1>
      <p className="mt-4 max-w-lg text-body leading-relaxed text-ink-muted">
        The opportunity may have closed, or the address may be incorrect. Browse the latest listings or read a career guide instead.
      </p>
      <div className="mt-7 flex flex-wrap justify-center gap-3">
        <Link
          href="/jobs"
          className="focus-ring inline-flex min-h-12 items-center rounded-pill bg-ink px-6 text-meta font-medium text-surface"
        >
          Browse jobs
        </Link>
        <Link
          href="/articles"
          className="focus-ring inline-flex min-h-12 items-center rounded-pill border border-line-strong px-6 text-meta font-medium"
        >
          Career guides
        </Link>
      </div>
    </div>
  );
}
