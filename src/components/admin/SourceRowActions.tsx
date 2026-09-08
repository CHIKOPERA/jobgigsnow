"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { readImportProgress } from "./read-import-progress";

interface SourceRowActionsProps {
  sourceId: string;
  initiallyEnabled: boolean;
}

type PendingAction = "toggle" | "run" | null;

async function responseError(response: Response, fallback: string) {
  const payload = await response.json().catch(() => null);
  return payload?.error?.message ?? fallback;
}

export function SourceRowActions({ sourceId, initiallyEnabled }: SourceRowActionsProps) {
  const router = useRouter();
  const [enabled, setEnabled] = useState(initiallyEnabled);
  const [pending, setPending] = useState<PendingAction>(null);
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<string | null>(null);

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
    setResult(null);
    try {
      const response = await fetch(`/api/admin/sources/${sourceId}/run`, { method: "POST" });
      const json = await readImportProgress<{ published?: number; skipped?: number; failed?: number }>(response, (event) => {
        setResult(event.message);
      }, "The source could not be imported.");
      setResult(`Published ${json.published ?? 0}. Skipped ${json.skipped ?? 0}. Failed ${json.failed ?? 0}.`);
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : "The source could not be imported.");
    } finally {
      setPending(null);
    }
  }

  const buttonClass = "focus-ring rounded-pill border border-line px-3 py-1.5 text-[12px] font-semibold whitespace-nowrap hover:bg-bg disabled:pointer-events-none disabled:opacity-45";

  return (
    <div className="flex min-w-max flex-col items-end gap-1.5">
      <div className="flex gap-1.5">
        <button type="button" onClick={run} disabled={pending !== null || !enabled} title={enabled ? "Fetch and rewrite jobs from this source" : "Enable this source before running it"} className={`${buttonClass} bg-ink text-surface hover:bg-ink/85`}>
          {pending === "run" ? "Importing…" : "Import now"}
        </button>
        <button type="button" onClick={toggle} disabled={pending !== null} className={buttonClass}>
          {pending === "toggle" ? "Saving…" : enabled ? "Pause" : "Resume"}
        </button>
      </div>
      {error && <p className="max-w-72 text-right text-[11px] leading-snug text-danger">{error}</p>}
      {result && <p className="max-w-72 text-right text-[11px] leading-snug text-ink-muted">{result}</p>}
    </div>
  );
}
