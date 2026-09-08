"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

export function RunTickButton() {
  const router = useRouter();
  const [state, setState] = useState<"idle" | "running" | "done" | "error">("idle");
  const [result, setResult] = useState<string | null>(null);

  async function handleClick() {
    setState("running");
    setResult(null);
    try {
      const res = await fetch("/api/admin/tick", { method: "POST" });
      const json = await res.json();
      if (!res.ok) throw new Error(json?.error?.message ?? `HTTP ${res.status}`);
      const published = json.sourceRuns?.reduce((sum: number, run: { published?: number }) => sum + (run.published ?? 0), 0) ?? json.aggregationProcessed ?? 0;
      const failed = json.sourceRuns?.reduce((sum: number, run: { failed?: number }) => sum + (run.failed ?? 0), 0) ?? 0;
      setResult(
        published > 0
          ? `Published ${published} ${published === 1 ? "job" : "jobs"}${failed > 0 ? ` · ${failed} failed` : ""}.`
          : failed > 0 ? `No jobs published · ${failed} failed.` : "Everything is up to date.",
      );
      setState("done");
      router.refresh();
    } catch (err) {
      setResult(err instanceof Error ? err.message : "Unknown error");
      setState("error");
    }
  }

  return (
    <div className="flex flex-col items-start gap-3 sm:flex-row sm:items-center">
      <button
        onClick={handleClick}
        disabled={state === "running"}
        className="focus-ring flex h-12 items-center rounded-pill bg-accent-mint px-6 text-meta font-semibold text-ink transition-transform hover:-translate-y-0.5 disabled:pointer-events-none disabled:opacity-50"
        style={{ transitionDuration: "var(--dur-state)" }}
      >
        {state === "running" ? "Importing jobs…" : "Import latest jobs"}
      </button>
      {result && (
        <span className={`text-meta ${state === "error" ? "text-danger" : "text-surface/70"}`}>{result}</span>
      )}
    </div>
  );
}
