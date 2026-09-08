"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";

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
  const [advanced, setAdvanced] = useState(false);
  const [crawlConfigText, setCrawlConfigText] = useState(
    initial ? JSON.stringify(initial.crawlConfig, null, 2) : "",
  );
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  async function handleSubmit(event: React.FormEvent) {
    event.preventDefault();
    setError(null);

    let crawlConfig: unknown;
    try {
      crawlConfig = initial || advanced
        ? JSON.parse(crawlConfigText)
        : { provider: "html", listingUrls: [baseUrl], linkSelector: "a[href]", linkAttr: "href" };

      if (initial && crawlConfig && typeof crawlConfig === "object" && "provider" in crawlConfig && crawlConfig.provider === "html" && "listingUrls" in crawlConfig && Array.isArray(crawlConfig.listingUrls) && crawlConfig.listingUrls[0] === initial.baseUrl) {
        crawlConfig = { ...crawlConfig, listingUrls: [baseUrl, ...crawlConfig.listingUrls.slice(1)] };
      }
    } catch {
      setError("Check the advanced configuration: it must be valid JSON.");
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

  async function removeSource() {
    if (!sourceId || !window.confirm(`Remove ${name}? Published jobs will stay live.`)) return;
    setSubmitting(true);
    setError(null);
    try {
      const response = await fetch(`/api/admin/sources/${sourceId}`, { method: "DELETE" });
      if (!response.ok) {
        const payload = await response.json().catch(() => null);
        throw new Error(payload?.error?.message ?? "The source could not be removed.");
      }
      router.push("/admin/sources");
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : "The source could not be removed.");
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
        <span className="text-label uppercase tracking-[0.05em] text-ink-muted">Careers page URL</span>
        <input
          required
          type="url"
          value={baseUrl}
          onChange={(e) => setBaseUrl(e.target.value)}
          placeholder="https://example.com/careers"
          className="focus-ring h-11 rounded-md border border-line bg-surface px-3 text-body"
        />
      </label>

      <p className="rounded-md bg-accent-mint/25 px-4 py-3 text-meta text-ink-muted">
        That’s enough for most careers pages. We’ll find the job links automatically.
      </p>

      <details className="rounded-md border border-line bg-surface p-3">
        <summary className="cursor-pointer text-meta font-medium">Technical setup</summary>
        {mode === "create" && (
          <label className="mt-3 flex items-center gap-2 text-meta">
            <input type="checkbox" checked={advanced} onChange={(event) => {
              if (event.target.checked && !crawlConfigText) {
                setCrawlConfigText(JSON.stringify({ provider: "html", listingUrls: [baseUrl], linkSelector: "a[href]", linkAttr: "href" }, null, 2));
              }
              setAdvanced(event.target.checked);
            }} />
            Use a custom source configuration
          </label>
        )}
        {(mode === "edit" || advanced) && (
          <label className="mt-3 flex flex-col gap-1">
            <span className="text-label uppercase tracking-[0.05em] text-ink-muted">Source configuration (JSON)</span>
            <textarea required value={crawlConfigText} onChange={(event) => setCrawlConfigText(event.target.value)} rows={14} spellCheck={false}
              className="focus-ring rounded-md border border-line bg-surface-sunk p-3 font-mono text-[13px] leading-relaxed text-ink" />
            <span className="text-[12px] text-ink-muted">Only change this for Workday or another supported hiring platform.</span>
          </label>
        )}
      </details>

      <details className="rounded-md border border-line p-3">
        <summary className="cursor-pointer text-meta font-medium">Schedule</summary>
        <label className="mt-3 flex flex-col gap-1 text-meta">
          Check every (minutes)
          <input required type="number" min={5} value={cadenceMinutes}
            onChange={(event) => setCadenceMinutes(event.target.value)}
            className="focus-ring h-11 w-40 rounded-md border border-line bg-surface px-3" />
        </label>
        <label className="mt-3 flex items-center gap-2 text-meta">
          <input type="checkbox" checked={enabled} onChange={(event) => setEnabled(event.target.checked)} />
          Automatically check this source
        </label>
      </details>

      {error && <p className="text-meta text-danger">{error}</p>}

      <button
        type="submit"
        disabled={submitting}
        className="focus-ring flex h-11 w-fit items-center rounded-pill bg-ink px-5 text-meta font-medium text-surface transition-transform hover:-translate-y-0.5 disabled:pointer-events-none disabled:opacity-60"
        style={{ transitionDuration: "var(--dur-state)" }}
      >
        {submitting ? "Saving…" : mode === "create" ? "Create source" : "Save changes"}
      </button>

      {mode === "edit" && (
        <details className="mt-4 border-t border-line pt-4">
          <summary className="cursor-pointer text-meta text-ink-muted">Remove this source</summary>
          <p className="mt-3 text-meta text-ink-muted">Its published jobs will stay live.</p>
          <button type="button" onClick={removeSource} disabled={submitting} className="focus-ring mt-3 rounded-pill border border-danger/30 px-4 py-2 text-meta font-semibold text-danger hover:bg-danger/10 disabled:opacity-50">
            Remove source
          </button>
        </details>
      )}
    </form>
  );
}
