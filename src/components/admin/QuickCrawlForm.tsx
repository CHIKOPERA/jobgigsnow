"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

export function QuickCrawlForm() {
  const router = useRouter();
  const [url, setUrl] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function submit(event: React.FormEvent) {
    event.preventDefault();
    setSubmitting(true);
    setError(null);

    try {
      const response = await fetch("/api/admin/crawl", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ url }),
      });
      let payload: { ingestRunId?: string; error?: { message?: string } } = {};
      try { payload = await response.json(); } catch { /* non-JSON body */ }
      if (!response.ok) throw new Error(payload?.error?.message ?? "The crawl could not be started.");
      if (!payload.ingestRunId) throw new Error("The crawl could not be started.");
      router.push(`/admin/runs/${payload.ingestRunId}`);
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : "The crawl could not be started.");
      setSubmitting(false);
    }
  }

  return (
    <form onSubmit={submit} className="rounded-lg border border-line bg-surface p-5 shadow-[0_18px_50px_rgb(20_21_15/0.06)] md:p-7">
      <label htmlFor="crawl-url" className="text-label uppercase tracking-[0.08em] text-ink-muted">
        Public job detail URL
      </label>
      <div className="mt-3 flex flex-col gap-3 sm:flex-row">
        <input
          id="crawl-url"
          type="url"
          required
          autoFocus
          value={url}
          onChange={(event) => setUrl(event.target.value)}
          placeholder="https://company.com/careers/job-name"
          className="focus-ring h-12 min-w-0 flex-1 rounded-md border border-line bg-surface-sunk px-4 text-body placeholder:text-ink-muted/60"
        />
        <button
          type="submit"
          disabled={submitting}
          className="focus-ring h-12 shrink-0 rounded-pill bg-ink px-6 text-meta font-semibold text-surface transition-transform hover:-translate-y-0.5 disabled:opacity-60"
        >
          {submitting ? "Starting…" : "Start crawl"}
        </button>
      </div>
      {error && <p className="mt-3 text-meta text-danger">{error}</p>}
      <p className="mt-4 text-meta text-ink-muted">
        Paste one public job page. It is fetched once, extracted, sent through AI aggregation, then added to Review.
      </p>
    </form>
  );
}
