"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { readImportProgress } from "./read-import-progress";

type RunStatus = "RUNNING" | "PAUSED" | "COMPLETED" | "FAILED" | "CANCELLED";

export function RunControls({ runId, initialStatus, compact = false }: { runId: string; initialStatus: RunStatus; compact?: boolean }) {
  const router = useRouter();
  const [status, setStatus] = useState(initialStatus);
  const [pending, setPending] = useState<"pause" | "resume" | "stop" | null>(null);
  const [message, setMessage] = useState<string | null>(null);

  async function pause() {
    setPending("pause");
    setMessage("Finishing the current job before pausing…");
    try {
      const response = await fetch(`/api/admin/runs/${runId}/pause`, { method: "POST" });
      if (!response.ok) throw new Error("The run could not be paused.");
      setStatus("PAUSED");
      setMessage("Paused. No new job will start.");
      router.refresh();
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "The run could not be paused.");
    } finally {
      setPending(null);
    }
  }

  async function resume() {
    setPending("resume");
    setStatus("RUNNING");
    setMessage("Resuming…");
    try {
      const response = await fetch(`/api/admin/runs/${runId}/resume`, { method: "POST" });
      await readImportProgress(response, (event) => setMessage(event.message), "The run could not be resumed.");
      setMessage("Run resumed successfully.");
      router.refresh();
    } catch (error) {
      setStatus("PAUSED");
      setMessage(error instanceof Error ? error.message : "The run could not be resumed.");
    } finally {
      setPending(null);
    }
  }

  async function stop() {
    if (!window.confirm("Stop this run permanently? Work already in progress may finish.")) return;
    setPending("stop");
    setMessage(null);
    try {
      const response = await fetch(`/api/admin/runs/${runId}/stop`, { method: "POST" });
      if (!response.ok) throw new Error("The run could not be stopped.");
      setStatus("CANCELLED");
      router.refresh();
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "The run could not be stopped.");
    } finally {
      setPending(null);
    }
  }

  if (status !== "RUNNING" && status !== "PAUSED") return null;
  const buttonClass = compact
    ? "focus-ring min-h-8 rounded-pill border border-line px-3 text-[12px] font-semibold disabled:opacity-50"
    : "focus-ring min-h-10 rounded-pill border border-line-strong px-4 text-meta font-semibold disabled:opacity-50";

  return (
    <div className="flex flex-col items-end gap-1.5">
      <div className="flex flex-wrap justify-end gap-2">
        {status === "RUNNING" ? (
          <button type="button" onClick={pause} disabled={pending !== null} className={buttonClass}>
            {pending === "pause" ? "Pausing…" : "Pause after this job"}
          </button>
        ) : (
          <button type="button" onClick={resume} disabled={pending !== null} className={`${buttonClass} bg-ink text-surface`}>
            {pending === "resume" ? "Resuming…" : "Resume"}
          </button>
        )}
        <button type="button" onClick={stop} disabled={pending !== null} className={`${buttonClass} text-danger`}>
          {pending === "stop" ? "Stopping…" : "Stop"}
        </button>
      </div>
      {message && <p aria-live="polite" className="max-w-80 text-right text-[11px] text-ink-muted">{message}</p>}
    </div>
  );
}
