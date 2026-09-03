"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";

export function StopRunButton({ runId }: { runId: string }) {
  const router = useRouter();
  const [state, setState] = useState<"idle" | "stopping" | "error">("idle");

  async function stopRun() {
    if (!window.confirm("Stop this run? Queued jobs will no longer be processed.")) return;

    setState("stopping");
    try {
      const response = await fetch(`/api/admin/runs/${runId}/stop`, { method: "POST" });
      if (!response.ok) throw new Error(`Request failed (${response.status})`);
      router.refresh();
    } catch {
      setState("error");
    }
  }

  return (
    <button
      type="button"
      onClick={stopRun}
      disabled={state === "stopping"}
      className="focus-ring inline-flex h-9 items-center rounded-pill border border-danger px-4 text-meta font-medium text-danger transition-colors hover:bg-danger hover:text-white disabled:pointer-events-none disabled:opacity-60"
    >
      {state === "stopping" ? "Stopping…" : state === "error" ? "Failed — try again" : "Stop run"}
    </button>
  );
}
