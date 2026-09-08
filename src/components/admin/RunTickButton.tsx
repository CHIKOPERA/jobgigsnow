"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { readImportProgress } from "./read-import-progress";
import type { ImportProgressEvent } from "@/lib/ingest/progress-types";

interface TickResponse {
  sourceRuns?: Array<{ published?: number; failed?: number }>;
  aggregationProcessed?: number;
}

const STEPS = ["Discover", "Capture", "Rewrite", "Image", "Publish"] as const;

function stepIndex(event: ImportProgressEvent | undefined) {
  if (!event) return -1;
  if (event.stage === "discovering" || event.stage === "found") return 0;
  if (event.stage === "capturing") return 1;
  if (event.stage === "rewriting") return 2;
  if (event.stage === "image") return 3;
  if (event.stage === "publishing" || event.stage === "published") return 4;
  return -1;
}

export function RunTickButton() {
  const router = useRouter();
  const [state, setState] = useState<"idle" | "running" | "done" | "error">("idle");
  const [result, setResult] = useState<string | null>(null);
  const [progressBySource, setProgressBySource] = useState<Record<string, ImportProgressEvent>>({});

  async function handleClick() {
    setState("running");
    setResult(null);
    setProgressBySource({});
    try {
      const res = await fetch("/api/admin/tick", { method: "POST" });
      const json = await readImportProgress<TickResponse>(res, (event) => {
        const key = event.sourceName ?? event.runId ?? "import";
        setProgressBySource((current) => ({ ...current, [key]: event }));
      }, "The import could not be completed.");
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

  const progress = Object.values(progressBySource);
  const totals = progress.reduce((sum, event) => ({
    found: sum.found + event.found,
    processed: sum.processed + event.processed,
    published: sum.published + event.published,
    failed: sum.failed + event.failed,
  }), { found: 0, processed: 0, published: 0, failed: 0 });
  const latest = progress.at(-1);
  const activeStep = stepIndex(latest);
  const percentage = totals.found > 0 ? Math.min(100, Math.round((totals.processed / totals.found) * 100)) : 0;

  return (
    <div className="flex flex-col items-start gap-4">
      <div className="flex flex-col items-start gap-3 sm:flex-row sm:items-center"><button
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
      {progress.length > 0 && (
        <div className="w-full rounded-lg border border-surface/15 bg-surface/5 p-4" aria-live="polite">
          <div className="grid grid-cols-4 gap-3">
            {[{ label: "Found", value: totals.found }, { label: "Processed", value: totals.processed }, { label: "Published", value: totals.published }, { label: "Failed", value: totals.failed }].map((item) => (
              <div key={item.label}><p className="text-[10px] uppercase tracking-[0.08em] text-surface/45">{item.label}</p><p className="mt-1 text-body font-semibold">{item.value}</p></div>
            ))}
          </div>
          <div className="mt-4 h-1.5 overflow-hidden rounded-pill bg-surface/15"><div className="h-full rounded-pill bg-accent-mint transition-[width]" style={{ width: `${percentage}%` }} /></div>
          <ol className="mt-4 grid grid-cols-5 gap-1" aria-label="Current job progress">
            {STEPS.map((step, index) => (
              <li key={step} className={`text-[10px] ${index <= activeStep ? "text-accent-mint" : "text-surface/35"}`}>
                <span className={`mb-1 block size-1.5 rounded-full ${index <= activeStep ? "bg-accent-mint" : "bg-surface/20"}`} />
                {step}
              </li>
            ))}
          </ol>
          {latest && <p className="mt-3 text-meta text-surface/70">{latest.sourceName && <strong className="text-surface">{latest.sourceName}: </strong>}{latest.message}</p>}
        </div>
      )}
    </div>
  );
}
