"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";

const CRAWL_CONFIG_TEMPLATE = JSON.stringify(
  {
    provider: "html",
    listingUrls: ["https://example.com/careers"],
    linkSelector: "a.job-link",
    linkAttr: "href",
    detailSelectors: {
      title: "h1",
      company: ".company-name",
      location: ".job-location",
      description: ".job-description",
    },
  },
  null,
  2,
);

interface SourceFormProps {
  mode: "create" | "edit";
  sourceId?: string;
  initial?: {
    name: string;
    baseUrl: string;
    cadenceMinutes: number;
    enabled: boolean;
    crawlConfig: unknown;
  };
}

export function SourceForm({ mode, sourceId, initial }: SourceFormProps) {
  const router = useRouter();
  const [name, setName] = useState(initial?.name ?? "");
  const [baseUrl, setBaseUrl] = useState(initial?.baseUrl ?? "");
  const [cadenceMinutes, setCadenceMinutes] = useState(String(initial?.cadenceMinutes ?? 360));
  const [enabled, setEnabled] = useState(initial?.enabled ?? true);
  const [crawlConfigText, setCrawlConfigText] = useState(
    initial ? JSON.stringify(initial.crawlConfig, null, 2) : CRAWL_CONFIG_TEMPLATE,
  );
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  async function handleSubmit(event: React.FormEvent) {
    event.preventDefault();
    setError(null);

    let crawlConfig: unknown;
    try {
      crawlConfig = JSON.parse(crawlConfigText);
    } catch {
      setError("crawlConfig is not valid JSON.");
      return;
    }

    setSubmitting(true);
    const body = { name, baseUrl, cadenceMinutes: Number(cadenceMinutes), enabled, crawlConfig };
    const url = mode === "create" ? "/api/admin/sources" : `/api/admin/sources/${sourceId}`;
    const method = mode === "create" ? "POST" : "PATCH";

    try {
      const res = await fetch(url, { method, headers: { "Content-Type": "application/json" }, body: JSON.stringify(body) });
      if (!res.ok) {
        const payload = await res.json().catch(() => null);
        throw new Error(payload?.error?.message ?? `Request failed (${res.status})`);
      }
      const saved = await res.json();
      router.push(`/admin/sources/${saved.id ?? sourceId}`);
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong.");
      setSubmitting(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="flex max-w-2xl flex-col gap-4">
      <label className="flex flex-col gap-1">
        <span className="text-label uppercase tracking-[0.05em] text-ink-muted">Name</span>
        <input
          required
          value={name}
          onChange={(e) => setName(e.target.value)}
          className="focus-ring h-11 rounded-md border border-line bg-surface px-3 text-body"
        />
      </label>

      <label className="flex flex-col gap-1">
        <span className="text-label uppercase tracking-[0.05em] text-ink-muted">Base URL</span>
        <input
          required
          type="url"
          value={baseUrl}
          onChange={(e) => setBaseUrl(e.target.value)}
          placeholder="https://example.com"
          className="focus-ring h-11 rounded-md border border-line bg-surface px-3 text-body"
        />
      </label>

      <label className="flex flex-col gap-1">
        <span className="text-label uppercase tracking-[0.05em] text-ink-muted">Cadence (minutes)</span>
        <input
          required
          type="number"
          min={5}
          value={cadenceMinutes}
          onChange={(e) => setCadenceMinutes(e.target.value)}
          className="focus-ring h-11 w-40 rounded-md border border-line bg-surface px-3 text-body"
        />
      </label>

      <label className="flex items-center gap-2">
        <input
          type="checkbox"
          checked={enabled}
          onChange={(e) => setEnabled(e.target.checked)}
          className="focus-ring size-5 rounded-sm border border-line-strong"
        />
        <span className="text-meta text-ink">Enabled</span>
      </label>

      <label className="flex flex-col gap-1">
        <span className="text-label uppercase tracking-[0.05em] text-ink-muted">
          Crawl config (JSON — discovery selectors, owned entirely by the crawler)
        </span>
        <textarea
          required
          value={crawlConfigText}
          onChange={(e) => setCrawlConfigText(e.target.value)}
          rows={14}
          spellCheck={false}
          className="focus-ring rounded-md border border-line bg-surface-sunk p-3 font-mono text-[13px] leading-relaxed text-ink"
        />
      </label>

      {error && <p className="text-meta text-danger">{error}</p>}

      <button
        type="submit"
        disabled={submitting}
        className="focus-ring flex h-11 w-fit items-center rounded-pill bg-ink px-5 text-meta font-medium text-surface transition-transform hover:-translate-y-0.5 disabled:pointer-events-none disabled:opacity-60"
        style={{ transitionDuration: "var(--dur-state)" }}
      >
        {submitting ? "Saving…" : mode === "create" ? "Create source" : "Save changes"}
      </button>
    </form>
  );
}
