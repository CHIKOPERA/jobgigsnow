"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

export function QuickCrawlForm() {
  const router = useRouter();
  const [url, setUrl] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<string | null>(null);

  async function submit(event: React.FormEvent) {
    event.preventDefault();
    setSubmitting(true);
    setError(null);
    setResult(null);

    try {
      const response = await fetch("/api/admin/crawl", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ url }),
      });
      let payload: { ingestRunId?: string; outcome?: "published" | "failed" | "skipped"; error?: { message?: string } } = {};
      try { payload = await response.json(); } catch { /* non-JSON body */ }
      if (!response.ok) throw new Error(payload?.error?.message ?? "The job could not be imported.");
      setResult(payload.outcome === "published" ? "Published." : payload.outcome === "failed" ? "Import failed." : "No changes needed.");
      router.refresh();
      setSubmitting(false);
    } catch (err) {
      setError(err instanceof Error ? err.message : "The job could not be imported.");
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
          {submitting ? "Importing…" : "Import job"}
        </button>
      </div>
      {error && <p className="mt-3 text-meta text-danger">{error}</p>}
      {result && <p className="mt-3 text-meta text-ink-muted">{result}</p>}
      <p className="mt-4 text-meta text-ink-muted">
        The job will be published automatically. An image is added when one is available.
      </p>
    </form>
  );
}
