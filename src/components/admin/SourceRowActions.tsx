"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

interface SourceRowActionsProps {
  sourceId: string;
  sourceName: string;
  initiallyEnabled: boolean;
}

type PendingAction = "toggle" | "run" | "delete" | null;

async function responseError(response: Response, fallback: string) {
  const payload = await response.json().catch(() => null);
  return payload?.error?.message ?? fallback;
}

export function SourceRowActions({ sourceId, sourceName, initiallyEnabled }: SourceRowActionsProps) {
  const router = useRouter();
  const [enabled, setEnabled] = useState(initiallyEnabled);
  const [pending, setPending] = useState<PendingAction>(null);
  const [error, setError] = useState<string | null>(null);

  async function toggle() {
    setPending("toggle");
    setError(null);
    try {
      const response = await fetch(`/api/admin/sources/${sourceId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ enabled: !enabled }),
      });
      if (!response.ok) throw new Error(await responseError(response, "The source could not be updated."));
      const source = await response.json();
      setEnabled(source.enabled);
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : "The source could not be updated.");
    } finally {
      setPending(null);
    }
  }

  async function run() {
    setPending("run");
    setError(null);
    try {
      const response = await fetch(`/api/admin/sources/${sourceId}/run`, { method: "POST" });
      if (!response.ok) throw new Error(await responseError(response, "The crawl could not be started."));
      const result = await response.json();
      router.push(`/admin/runs/${result.ingestRunId}`);
    } catch (err) {
      setError(err instanceof Error ? err.message : "The crawl could not be started.");
      setPending(null);
    }
  }

  async function remove() {
    const confirmed = window.confirm(
      `Delete ${sourceName}? This permanently removes its crawl history and raw jobs. Published jobs will remain.`,
    );
    if (!confirmed) return;

    setPending("delete");
    setError(null);
    try {
      const response = await fetch(`/api/admin/sources/${sourceId}`, { method: "DELETE" });
      if (!response.ok) throw new Error(await responseError(response, "The source could not be deleted."));
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : "The source could not be deleted.");
      setPending(null);
    }
  }

  const buttonClass = "focus-ring rounded-pill border border-line px-3 py-1.5 text-[12px] font-semibold whitespace-nowrap hover:bg-bg disabled:pointer-events-none disabled:opacity-45";

  return (
    <div className="flex min-w-max flex-col items-end gap-1.5">
      <div className="flex gap-1.5">
        <button type="button" onClick={toggle} disabled={pending !== null} className={buttonClass}>
          {pending === "toggle" ? "Saving…" : enabled ? "Disable" : "Enable"}
        </button>
        <button type="button" onClick={run} disabled={pending !== null || !enabled} title={enabled ? "Run this source now" : "Enable this source before running it"} className={`${buttonClass} bg-ink text-surface hover:bg-ink/85`}>
          {pending === "run" ? "Starting…" : "Run"}
        </button>
        <button type="button" onClick={remove} disabled={pending !== null} className={`${buttonClass} border-danger/30 text-danger hover:bg-danger/10`}>
          {pending === "delete" ? "Deleting…" : "Delete"}
        </button>
      </div>
      {error && <p className="max-w-72 text-right text-[11px] leading-snug text-danger">{error}</p>}
    </div>
  );
}
