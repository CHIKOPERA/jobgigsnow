"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

const CATEGORIES = [
  ["JOB", "Job"],
  ["INTERNSHIP", "Internship"],
  ["LEARNERSHIP", "Learnership"],
  ["APPRENTICESHIP", "Apprenticeship"],
  ["GRADUATE_PROGRAMME", "Graduate programme"],
  ["CALL_FOR_APPLICATIONS", "Call for applications"],
  ["FUNDING", "Funding"],
] as const;

export function NewJobForm() {
  const router = useRouter();
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const fieldClass = "focus-ring mt-1.5 h-11 w-full rounded-md border border-line bg-surface px-3 text-meta";

  async function submit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setBusy(true);
    setError(null);
    const form = new FormData(event.currentTarget);
    try {
      const response = await fetch("/api/admin/jobs", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title: form.get("title"),
          companyName: form.get("companyName"),
          category: form.get("category"),
          location: form.get("location"),
          remoteType: form.get("remoteType"),
          employmentType: form.get("employmentType"),
          applyUrl: form.get("applyUrl"),
          description: form.get("description"),
          highlights: String(form.get("highlights") ?? "").split("\n").map((item) => item.trim()).filter(Boolean),
        }),
      });
      const result = await response.json();
      if (!response.ok) throw new Error(result?.error?.message ?? "The job could not be created.");
      router.push(`/admin/review/${result.id}`);
    } catch (err) {
      setError(err instanceof Error ? err.message : "The job could not be created.");
      setBusy(false);
    }
  }

  return (
    <form onSubmit={submit} className="rounded-lg border border-line bg-surface p-5 md:p-7">
      <div className="grid gap-4 sm:grid-cols-2">
        <label className="text-label uppercase tracking-[0.06em] text-ink-muted sm:col-span-2">
          Job title
          <input name="title" required minLength={2} maxLength={200} className={fieldClass} />
        </label>
        <label className="text-label uppercase tracking-[0.06em] text-ink-muted">
          Company
          <input name="companyName" required maxLength={160} className={fieldClass} />
        </label>
        <label className="text-label uppercase tracking-[0.06em] text-ink-muted">
          Location
          <input name="location" required maxLength={240} placeholder="Johannesburg, Gauteng" className={fieldClass} />
        </label>
        <label className="text-label uppercase tracking-[0.06em] text-ink-muted">
          Category
          <select name="category" defaultValue="JOB" className={fieldClass}>
            {CATEGORIES.map(([value, label]) => <option key={value} value={value}>{label}</option>)}
          </select>
        </label>
        <label className="text-label uppercase tracking-[0.06em] text-ink-muted">
          Work arrangement
          <select name="remoteType" defaultValue="ONSITE" className={fieldClass}>
            <option value="ONSITE">On-site</option><option value="HYBRID">Hybrid</option><option value="REMOTE">Remote</option>
          </select>
        </label>
        <label className="text-label uppercase tracking-[0.06em] text-ink-muted">
          Employment type
          <select name="employmentType" defaultValue="FULL_TIME" className={fieldClass}>
            <option value="FULL_TIME">Full-time</option><option value="PART_TIME">Part-time</option><option value="CONTRACT">Contract</option><option value="INTERNSHIP">Internship</option><option value="TEMPORARY">Temporary</option>
          </select>
        </label>
        <label className="text-label uppercase tracking-[0.06em] text-ink-muted sm:col-span-2">
          Apply URL
          <input name="applyUrl" type="url" placeholder="https://…" className={fieldClass} />
        </label>
        <label className="text-label uppercase tracking-[0.06em] text-ink-muted sm:col-span-2">
          Description
          <textarea name="description" required rows={14} className="focus-ring mt-1.5 w-full rounded-md border border-line bg-surface px-3 py-3 text-meta normal-case tracking-normal" />
        </label>
        <label className="text-label uppercase tracking-[0.06em] text-ink-muted sm:col-span-2">
          Highlights · one per line
          <textarea name="highlights" rows={5} className="focus-ring mt-1.5 w-full rounded-md border border-line bg-surface px-3 py-3 text-meta normal-case tracking-normal" />
        </label>
      </div>
      {error && <p className="mt-4 rounded-md bg-danger/10 p-3 text-meta text-danger">{error}</p>}
      <div className="mt-6 flex justify-end">
        <button type="submit" disabled={busy} className="focus-ring h-11 rounded-pill bg-ink px-6 text-meta font-semibold text-surface disabled:opacity-50">
          {busy ? "Creating…" : "Create and review"}
        </button>
      </div>
    </form>
  );
}
