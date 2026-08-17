"use client";

import { useState } from "react";

export function RunTickButton() {
  const [state, setState] = useState<"idle" | "running" | "done" | "error">("idle");
  const [result, setResult] = useState<string | null>(null);

  async function handleClick() {
    setState("running");
    setResult(null);
    try {
      const res = await fetch("/api/admin/tick", { method: "POST" });
      const json = await res.json();
      if (!res.ok) throw new Error(json?.error?.message ?? `HTTP ${res.status}`);
      setResult(
        `Done in ${(json.elapsedMs / 1000).toFixed(1)}s — acquired ${json.acquisitionProcessed}, aggregated ${json.aggregationProcessed}`,
      );
      setState("done");
    } catch (err) {
      setResult(err instanceof Error ? err.message : "Unknown error");
      setState("error");
    }
  }

  return (
    <div className="flex items-center gap-3">
      <button
        onClick={handleClick}
        disabled={state === "running"}
        className="focus-ring flex h-9 items-center rounded-pill border border-line bg-surface px-4 text-meta font-medium text-ink transition-transform hover:-translate-y-0.5 disabled:pointer-events-none disabled:opacity-50"
        style={{ transitionDuration: "var(--dur-state)" }}
      >
        {state === "running" ? "Running…" : "Run tick now"}
      </button>
      {result && (
        <span className={`text-meta ${state === "error" ? "text-danger" : "text-ink-muted"}`}>{result}</span>
      )}
    </div>
  );
}
