import type { Metadata } from "next";
import { AgentControls } from "@/components/admin/AgentControls";
import { getAgentDashboard } from "@/lib/agent/dashboard";

export const metadata: Metadata = { title: "Admin — Daily manager" };
export const dynamic = "force-dynamic";

function percent(value: number | null, goal: number) {
  return value === null ? 0 : Math.min(100, Math.round((value / Math.max(1, goal)) * 100));
}

function profileIndustries(profile: unknown): string[] {
  if (!profile || typeof profile !== "object" || !("industries" in profile)) return [];
  const industries = (profile as { industries?: unknown }).industries;
  if (!Array.isArray(industries)) return [];
  return industries.flatMap((item) => item && typeof item === "object" && "label" in item && typeof item.label === "string" ? [item.label] : []).slice(0, 3);
}

export default async function GoalsPage() {
  const dashboard = await getAgentDashboard();
  const { settings, latestMetric, latestRun, sevenDayAverage, publishedToday, categories, industries, insights, sources, experiments } = dashboard;
  const viewPercent = percent(sevenDayAverage, settings.dailyViewGoal);
  const publishPercent = percent(publishedToday, settings.dailyPublishMin);

  return (
    <div className="flex flex-col gap-8">
      <header className="rounded-xl bg-ink p-6 text-surface md:p-8">
        <div className="flex flex-wrap items-start justify-between gap-5">
          <div>
            <p className="text-label uppercase tracking-[0.1em] text-surface/55">Learning and publishing</p>
            <h1 className="mt-2 text-title font-semibold">Daily manager</h1>
            <p className="mt-2 max-w-2xl text-body text-surface/65">Measures results, learns which sources and categories work, and changes tomorrow’s priorities while keeping factual rules fixed.</p>
          </div>
          <span className={`rounded-pill px-3 py-1.5 text-[12px] font-semibold ${settings.agentEnabled ? "bg-accent-mint text-ink" : "bg-surface/10 text-surface/70"}`}>{settings.agentEnabled ? "Active" : "Paused"}</span>
        </div>
        <div className="mt-6"><AgentControls settings={settings} /></div>
      </header>

      <section aria-label="Daily goals" className="grid gap-4 lg:grid-cols-2">
        <article className="rounded-xl border border-line bg-surface p-5">
          <div className="flex items-end justify-between gap-4"><div><p className="text-[12px] text-ink-muted">7-day average views</p><p className="mt-1 text-h2 font-medium">{sevenDayAverage ?? "Not connected"}</p></div><p className="text-meta text-ink-muted">Goal {settings.dailyViewGoal}</p></div>
          <div className="mt-4 h-2 overflow-hidden rounded-pill bg-surface-sunk"><div className="h-full rounded-pill bg-accent-orchid" style={{ width: `${viewPercent}%` }} /></div>
          <p className="mt-3 text-[12px] text-ink-muted">{latestMetric?.measuredDate ? `Latest Search Console date: ${latestMetric.measuredDate}` : "Connect Google Analytics to measure this goal."}</p>
        </article>
        <article className="rounded-xl border border-line bg-surface p-5">
          <div className="flex items-end justify-between gap-4"><div><p className="text-[12px] text-ink-muted">Published today</p><p className="mt-1 text-h2 font-medium">{publishedToday}</p></div><p className="text-meta text-ink-muted">Target {settings.dailyPublishMin}–{settings.dailyPublishMax}</p></div>
          <div className="mt-4 h-2 overflow-hidden rounded-pill bg-surface-sunk"><div className="h-full rounded-pill bg-accent-mint" style={{ width: `${publishPercent}%` }} /></div>
          <p className="mt-3 text-[12px] text-ink-muted">Only source-grounded opportunities count. The manager stops at the daily maximum.</p>
        </article>
      </section>

      <section>
        <div><h2 className="text-body font-semibold">Category coverage</h2><p className="mt-1 text-meta text-ink-muted">Active, unexpired opportunities against the minimum.</p></div>
        <div className="mt-3 grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
          {categories.map((item) => <article key={item.category} className={`rounded-lg border bg-surface p-4 ${item.count < item.goal ? "border-danger/35" : "border-line"}`}><p className="text-[12px] text-ink-muted">{item.label}</p><div className="mt-1 flex items-baseline gap-2"><p className="text-h2 font-medium">{item.count}</p><span className="text-[12px] text-ink-muted">/ {item.goal}</span></div><p className={`mt-2 text-[11px] font-semibold ${item.count < item.goal ? "text-danger" : "text-ink-muted"}`}>{item.count < item.goal ? `${item.goal - item.count} needed` : "Covered"}</p></article>)}
        </div>
      </section>

      <section>
        <div><h2 className="text-body font-semibold">Industry coverage</h2><p className="mt-1 text-meta text-ink-muted">The manager uses these gaps to select sources with matching history.</p></div>
        <div className="mt-3 grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
          {industries.map((item) => <article key={item.industry} className={`rounded-lg border bg-surface p-4 ${item.count < item.goal ? "border-danger/35" : "border-line"}`}><p className="text-[12px] text-ink-muted">{item.label}</p><div className="mt-1 flex items-baseline gap-2"><p className="text-h2 font-medium">{item.count}</p><span className="text-[12px] text-ink-muted">/ {item.goal}</span></div><p className={`mt-2 text-[11px] font-semibold ${item.count < item.goal ? "text-danger" : "text-ink-muted"}`}>{item.count < item.goal ? `${item.goal - item.count} needed` : "Covered"}</p></article>)}
        </div>
      </section>

      <section className="grid gap-5 lg:grid-cols-[minmax(0,1.25fr)_minmax(320px,.75fr)]">
        <div><h2 className="text-body font-semibold">What the manager learned</h2><p className="mt-1 text-meta text-ink-muted">Every recommendation includes its evidence and next action.</p><div className="mt-3 flex flex-col gap-3">{insights.map((insight) => <article key={insight.id} className="rounded-lg border border-line bg-surface p-4"><div className="flex flex-wrap items-center gap-2"><span className="rounded-pill bg-surface-sunk px-2 py-1 text-[10px] font-semibold">{insight.kind}</span><span className="text-[11px] text-ink-muted">{Math.round(insight.confidence * 100)}% confidence</span></div><h3 className="mt-2 text-body font-semibold">{insight.title}</h3><p className="mt-1 text-meta text-ink-muted">{insight.detail}</p>{insight.action && <p className="mt-3 text-meta"><strong>Next:</strong> {insight.action}</p>}</article>)}{insights.length === 0 && <div className="rounded-lg border border-line bg-surface p-5 text-meta text-ink-muted">Run the manager to create the first evidence-based insights.</div>}</div></div>
        <aside className="flex flex-col gap-5">
          <section><h2 className="text-body font-semibold">Source priorities</h2><div className="mt-3 divide-y divide-line rounded-lg border border-line bg-surface">{sources.map((source, index) => { const specialties = profileIndustries(source.agentProfile); return <div key={source.id} className="p-4"><div className="flex items-center justify-between gap-3"><p className="text-meta font-semibold">{index + 1}. {source.name}</p><span className="text-[12px]">{source.agentPriority.toFixed(1)}</span></div>{specialties.length > 0 && <div className="mt-2 flex flex-wrap gap-1">{specialties.map((label) => <span key={label} className="rounded-pill bg-surface-sunk px-2 py-1 text-[10px]">{label}</span>)}</div>}<p className="mt-2 text-[11px] leading-relaxed text-ink-muted">{source.agentReason ?? "Awaiting the first learning run."}</p></div>; })}</div></section>
          <section><h2 className="text-body font-semibold">Latest run</h2><div className="mt-3 rounded-lg border border-line bg-surface p-4"><p className="text-meta font-semibold">{latestRun?.status ?? "Never run"}</p><p className="mt-1 text-[12px] text-ink-muted">{latestRun ? `${latestRun.currentStage ?? "Starting"} · ${new Date(latestRun.startedAt).toLocaleString()}` : "The scheduled manager has not run yet."}</p>{latestRun?.error && <p className="mt-2 text-[12px] text-danger">{latestRun.error}</p>}</div></section>
          {experiments.length > 0 && <section><h2 className="text-body font-semibold">Experiments</h2><div className="mt-3 flex flex-col gap-2">{experiments.map((experiment) => <article key={experiment.id} className="rounded-lg border border-line bg-surface p-4"><p className="text-[11px] font-semibold text-ink-muted">{experiment.status}</p><p className="mt-1 text-meta font-semibold">{experiment.hypothesis}</p><p className="mt-1 text-[12px] text-ink-muted">Measure: {experiment.metric}</p></article>)}</div></section>}
        </aside>
      </section>
    </div>
  );
}
