"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";

interface BackfillStatus {
  eligible: number;
  run: null | {
    id: string;
    status: "RUNNING" | "COMPLETED";
    total: number;
    completed: number;
    failed: number;
    left: number;
    currentJobTitle: string | null;
  };
}

async function requestStatus(url: string, method = "GET"): Promise<BackfillStatus> {
  const response = await fetch(url, { method, cache: "no-store" });
  const body = await response.json().catch(() => null);
  if (!response.ok) throw new Error(body?.error?.message ?? "The backfill request failed.");
  return body;
}

export function ApplicationGuidanceBackfill() {
  const router = useRouter();
  const [status, setStatus] = useState<BackfillStatus | null>(null);
  const [error, setError] = useState<string | null>(null);
  const working = useRef(false);

  const processRun = useCallback(async () => {
    if (working.current) return;
    working.current = true;
    setError(null);
    try {
      let next = await requestStatus("/api/admin/backfills/application-guidance");
      setStatus(next);
      while (next.run?.status === "RUNNING") {
        next = await requestStatus("/api/admin/backfills/application-guidance/step", "POST");
        setStatus(next);
      }
      router.refresh();
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : "The backfill stopped unexpectedly.");
    } finally {
      working.current = false;
    }
  }, [router]);

  useEffect(() => {
    void requestStatus("/api/admin/backfills/application-guidance")
      .then((next) => {
        setStatus(next);
        if (next.run?.status === "RUNNING") void processRun();
      })
      .catch((caught) => setError(caught instanceof Error ? caught.message : "Could not load backfill progress."));
  }, [processRun]);

  async function start() {
    setError(null);
    try {
      const next = await requestStatus("/api/admin/backfills/application-guidance", "POST");
      setStatus(next);
      if (next.run?.status === "RUNNING") void processRun();
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : "Could not start the backfill.");
    }
  }

  const run = status?.run;
  const processed = run ? run.completed + run.failed : 0;
  const percent = run?.total ? Math.min(100, Math.round((processed / run.total) * 100)) : 0;
  const isRunning = run?.status === "RUNNING";

  return (
    <section className="rounded-xl border border-line bg-surface p-5 md:p-6" aria-labelledby="guidance-backfill-heading">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <p className="text-label uppercase tracking-[0.1em] text-ink-muted">Temporary migration tool</p>
          <h2 id="guidance-backfill-heading" className="mt-2 text-body font-semibold">Backfill “Before you apply”</h2>
          <p className="mt-1 max-w-2xl text-meta text-ink-muted">Adds applicant guidance to published imported jobs without changing their descriptions or publication status. Progress is saved after every job.</p>
        </div>
        <button
          type="button"
          onClick={start}
          disabled={!status || isRunning || status.eligible === 0}
          className="focus-ring h-10 rounded-pill bg-ink px-4 text-meta font-semibold text-surface disabled:pointer-events-none disabled:opacity-45"
        >
          {isRunning ? "Backfilling…" : status?.eligible ? `Backfill ${status.eligible} jobs` : "Nothing left to backfill"}
        </button>
      </div>

      {run && (
        <div className="mt-5" aria-live="polite">
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
            {[{ label: "Total", value: run.total }, { label: "Done", value: run.completed }, { label: "Failed", value: run.failed }, { label: "Left", value: run.left }].map((item) => (
              <div key={item.label} className="rounded-lg bg-surface-sunk p-3"><p className="text-[11px] text-ink-muted">{item.label}</p><p className="mt-1 text-body font-semibold">{item.value}</p></div>
            ))}
          </div>
          <div className="mt-4 h-2 overflow-hidden rounded-pill bg-surface-sunk"><div className="h-full rounded-pill bg-accent-mint transition-[width]" style={{ width: `${percent}%` }} /></div>
          <p className="mt-2 text-[12px] text-ink-muted">{isRunning ? run.currentJobTitle ? `Processing ${run.currentJobTitle}` : "Preparing the next job…" : `Finished · ${run.completed} completed${run.failed ? ` · ${run.failed} can be retried` : ""}`}</p>
        </div>
      )}
      {error && <p className="mt-4 text-meta text-danger" role="alert">{error} Refresh the page to resume safely.</p>}
    </section>
  );
}
