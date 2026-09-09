"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

interface GoalSettings {
  agentEnabled: boolean;
  dailyViewGoal: number;
  dailyPublishMin: number;
  dailyPublishMax: number;
  categoryMinimum: number;
}

export function GoalSettingsForm({ initial }: { initial: GoalSettings }) {
  const router = useRouter();
  const [values, setValues] = useState(initial);
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState<string | null>(null);

  function numberField(key: keyof Omit<GoalSettings, "agentEnabled">) {
    return (event: React.ChangeEvent<HTMLInputElement>) => setValues((current) => ({
      ...current,
      [key]: Number(event.target.value),
    }));
  }

  async function save(event: React.FormEvent) {
    event.preventDefault();
    setBusy(true);
    setMessage(null);
    const response = await fetch("/api/admin/settings", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(values),
    });
    const result = await response.json();
    setMessage(response.ok ? "Daily goals saved." : result?.error?.message ?? "The goals could not be saved.");
    setBusy(false);
    router.refresh();
  }

  const inputClass = "focus-ring mt-1.5 h-11 w-full rounded-md border border-line bg-surface-sunk px-3 text-body";
  return (
    <form onSubmit={save} className="max-w-3xl rounded-xl border border-line bg-surface p-5">
      <div className="flex items-center justify-between gap-4"><div><h2 className="text-body font-semibold">Daily manager goals</h2><p className="mt-1 text-meta text-ink-muted">These limits guide source priority and automatic publishing.</p></div><label className="flex items-center gap-2 text-meta"><input type="checkbox" checked={values.agentEnabled} onChange={(event) => setValues((current) => ({ ...current, agentEnabled: event.target.checked }))} /> Active</label></div>
      <div className="mt-5 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <label className="text-label uppercase tracking-[0.05em] text-ink-muted">Daily views<input type="number" min="1" required value={values.dailyViewGoal} onChange={numberField("dailyViewGoal")} className={inputClass} /></label>
        <label className="text-label uppercase tracking-[0.05em] text-ink-muted">Publish minimum<input type="number" min="1" required value={values.dailyPublishMin} onChange={numberField("dailyPublishMin")} className={inputClass} /></label>
        <label className="text-label uppercase tracking-[0.05em] text-ink-muted">Publish maximum<input type="number" min="1" required value={values.dailyPublishMax} onChange={numberField("dailyPublishMax")} className={inputClass} /></label>
        <label className="text-label uppercase tracking-[0.05em] text-ink-muted">Per category<input type="number" min="1" required value={values.categoryMinimum} onChange={numberField("categoryMinimum")} className={inputClass} /></label>
      </div>
      <div className="mt-5 flex items-center gap-3"><button type="submit" disabled={busy} className="focus-ring h-10 rounded-pill bg-ink px-4 text-meta font-semibold text-surface disabled:opacity-50">{busy ? "Saving…" : "Save goals"}</button>{message && <p className="text-meta text-ink-muted" aria-live="polite">{message}</p>}</div>
    </form>
  );
}
