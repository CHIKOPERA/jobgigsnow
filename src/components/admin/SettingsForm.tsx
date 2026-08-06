"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

const PLACEHOLDERS = [
  ["{{title}}", "Job title"],
  ["{{company}}", "Company name"],
  ["{{location}}", "Location"],
  ["{{remoteType}}", "ONSITE / HYBRID / REMOTE"],
  ["{{employmentType}}", "FULL_TIME / PART_TIME / etc."],
  ["{{description}}", "Current (pre-rewrite) description"],
  ["{{tags}}", "Current tags, comma-separated"],
] as const;

export function SettingsForm({ initialPrompt }: { initialPrompt: string }) {
  const router = useRouter();
  const [prompt, setPrompt] = useState(initialPrompt);
  const [busy, setBusy] = useState(false);
  const [notice, setNotice] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit(event: React.FormEvent) {
    event.preventDefault();
    setBusy(true);
    setError(null);
    setNotice(null);
    try {
      const res = await fetch("/api/admin/settings", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ seoRewritePrompt: prompt }),
      });
      const result = await res.json();
      if (!res.ok) throw new Error(result?.error?.message ?? "The setting could not be saved.");
      setNotice("Saved — every job aggregated from now on uses this prompt.");
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : "The setting could not be saved.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="flex max-w-3xl flex-col gap-4">
      <label className="flex flex-col gap-1">
        <span className="text-label uppercase tracking-[0.05em] text-ink-muted">
          SEO rewrite prompt template
        </span>
        <textarea
          required
          value={prompt}
          onChange={(e) => setPrompt(e.target.value)}
          rows={16}
          spellCheck={false}
          className="focus-ring rounded-md border border-line bg-surface-sunk p-3 font-mono text-[13px] leading-relaxed text-ink"
        />
      </label>

      <div className="rounded-md border border-line bg-surface p-3">
        <p className="text-label uppercase tracking-[0.05em] text-ink-muted">Available placeholders</p>
        <dl className="mt-2 grid gap-1.5 sm:grid-cols-2">
          {PLACEHOLDERS.map(([token, label]) => (
            <div key={token} className="flex items-baseline gap-2 text-meta">
              <dt className="shrink-0 rounded-sm bg-surface-sunk px-1.5 py-0.5 font-mono text-[12px] text-ink">{token}</dt>
              <dd className="text-ink-muted">{label}</dd>
            </div>
          ))}
        </dl>
      </div>

      {error && <p className="text-meta text-danger">{error}</p>}
      {notice && <p className="text-meta text-ink">{notice}</p>}

      <button
        type="submit"
        disabled={busy}
        className="focus-ring flex h-11 w-fit items-center rounded-pill bg-ink px-5 text-meta font-medium text-surface transition-transform hover:-translate-y-0.5 disabled:pointer-events-none disabled:opacity-60"
        style={{ transitionDuration: "var(--dur-state)" }}
      >
        {busy ? "Saving…" : "Save prompt"}
      </button>
    </form>
  );
}
