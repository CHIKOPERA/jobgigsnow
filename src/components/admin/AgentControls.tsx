"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

interface AgentSettings {
  agentEnabled: boolean;
  dailyViewGoal: number;
  dailyPublishMin: number;
  dailyPublishMax: number;
  categoryMinimum: number;
}

export function AgentControls({ settings }: { settings: AgentSettings }) {
  const router = useRouter();
  const [busy, setBusy] = useState<"run" | "toggle" | null>(null);
  const [message, setMessage] = useState<string | null>(null);

  async function run() {
    setBusy("run");
    setMessage(null);
    const response = await fetch("/api/admin/agent/run", { method: "POST" });
    const result = await response.json();
    setMessage(response.ok ? "Daily manager started." : result?.error?.message ?? "The manager could not start.");
    setBusy(null);
    router.refresh();
  }

  async function toggle() {
    setBusy("toggle");
    setMessage(null);
    const response = await fetch("/api/admin/settings", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ ...settings, agentEnabled: !settings.agentEnabled }),
    });
    setMessage(response.ok ? (settings.agentEnabled ? "Daily manager paused." : "Daily manager resumed.") : "The setting could not be saved.");
    setBusy(null);
    router.refresh();
  }

  return (
    <div className="flex flex-wrap items-center gap-2">
      <button type="button" onClick={run} disabled={busy !== null || !settings.agentEnabled} className="focus-ring h-10 rounded-pill bg-accent-mint px-4 text-meta font-semibold text-ink disabled:opacity-45">
        {busy === "run" ? "Starting…" : "Run now"}
      </button>
      <button type="button" onClick={toggle} disabled={busy !== null} className="focus-ring h-10 rounded-pill border border-surface/25 px-4 text-meta font-semibold text-surface disabled:opacity-45">
        {busy === "toggle" ? "Saving…" : settings.agentEnabled ? "Pause manager" : "Resume manager"}
      </button>
      {message && <span className="text-[12px] text-surface/65" aria-live="polite">{message}</span>}
    </div>
  );
}
