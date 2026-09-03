"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";

interface ProgressCounts {
  rawTotal: number;
  acquisitionComplete: number;
  acquisitionFailed: number;
  aggregationTotal: number;
  aggregationComplete: number;
  reviewReady: number;
  published: number;
}

interface RunSnapshot {
  status: "RUNNING" | "COMPLETED" | "FAILED" | "CANCELLED";
  discoveredCount: number;
  progress: ProgressCounts;
}

function percent(value: number, total: number, fallback = 0) {
  if (total === 0) return fallback;
  return Math.min(100, Math.round((value / total) * 100));
}

export function RunProgress({ runId, initial }: { runId: string; initial: RunSnapshot }) {
  const router = useRouter();
  const [snapshot, setSnapshot] = useState(initial);

  useEffect(() => {
    if (snapshot.status !== "RUNNING") return;

    let active = true;
    const timer = window.setInterval(async () => {
      try {
        const response = await fetch(`/api/admin/runs/${runId}`, { cache: "no-store" });
        if (!response.ok) return;
        const detail = await response.json();
        if (!active) return;
        const next: RunSnapshot = {
          status: detail.run.status,
          discoveredCount: detail.run.discoveredCount,
          progress: detail.progress,
        };
        setSnapshot(next);
        if (next.status !== "RUNNING") router.refresh();
      } catch {
        // A later poll will recover from a transient network interruption.
      }
    }, 2_000);

    return () => {
      active = false;
      window.clearInterval(timer);
    };
  }, [router, runId, snapshot.status]);

  const { progress } = snapshot;
  const discoveryPercent = snapshot.status === "FAILED" && snapshot.discoveredCount === 0 ? 0 : 100;
  const stages = [
    {
      label: "Discovery",
      detail: `${snapshot.discoveredCount} URL${snapshot.discoveredCount === 1 ? "" : "s"} found`,
      value: discoveryPercent,
    },
    {
      label: "Page fetch",
      detail: `${progress.acquisitionComplete}/${progress.rawTotal} complete${progress.acquisitionFailed ? ` · ${progress.acquisitionFailed} failed` : ""}`,
      value: percent(progress.acquisitionComplete, progress.rawTotal, discoveryPercent),
    },
    {
      label: "AI aggregation",
      detail: `${progress.aggregationComplete}/${progress.aggregationTotal} enriched`,
      value: percent(progress.aggregationComplete, progress.aggregationTotal, progress.rawTotal === 0 ? 0 : 100),
    },
    {
      label: "Admin review",
      detail: `${progress.reviewReady} ready · ${progress.published} published`,
      value: progress.aggregationComplete === 0 ? 0 : percent(progress.reviewReady + progress.published, progress.aggregationComplete),
    },
  ];

  return (
    <section className="rounded-lg border border-line bg-surface p-5 md:p-6" aria-live="polite">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <p className="text-label uppercase tracking-[0.09em] text-ink-muted">Pipeline progress</p>
          <p className="mt-1 text-meta text-ink-muted">
            {snapshot.status === "RUNNING" ? "Updating live every two seconds" : `Run ${snapshot.status.toLowerCase()}`}
          </p>
        </div>
        <span
          className={[
            "rounded-pill px-3 py-1.5 text-label font-semibold tracking-[0.05em]",
            snapshot.status === "RUNNING"
              ? "bg-accent-mint text-ink"
              : snapshot.status === "FAILED"
                ? "bg-danger text-white"
                : snapshot.status === "CANCELLED"
                  ? "bg-surface-sunk text-ink-muted"
                  : "bg-accent-sage text-ink",
          ].join(" ")}
        >
          {snapshot.status === "RUNNING" ? "● LIVE" : snapshot.status}
        </span>
      </div>

      <div className="mt-6 grid gap-5 md:grid-cols-4">
        {stages.map((stage, index) => (
          <div key={stage.label}>
            <div className="flex items-start justify-between gap-2">
              <div>
                <p className="text-meta font-semibold">{index + 1}. {stage.label}</p>
                <p className="mt-1 text-[12px] text-ink-muted">{stage.detail}</p>
              </div>
              <span className="text-label font-semibold text-ink-muted">{stage.value}%</span>
            </div>
            <div className="mt-3 h-2 overflow-hidden rounded-pill bg-surface-sunk">
              <div
                className="h-full rounded-pill bg-accent-mint transition-[width] duration-500"
                style={{ width: `${stage.value}%` }}
              />
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}
