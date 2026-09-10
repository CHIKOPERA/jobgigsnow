export interface SourceLearningInput {
  id: string;
  name: string;
  runs: number;
  discovered: number;
  failures: number;
  published: number;
  coverageMatches: string[];
  specialties: Array<{
    dimension: "industry" | "opportunityType" | "province";
    value: string;
    label: string;
    count: number;
    published: number;
  }>;
}

export interface LearnedSourceScore extends SourceLearningInput {
  score: number;
  reason: string;
}

export interface LearningInsight {
  fingerprint: string;
  kind: "TRAFFIC" | "CATEGORY" | "SOURCE" | "CONTENT" | "SPEED" | "SYSTEM";
  title: string;
  detail: string;
  action: string;
  confidence: number;
  evidence: Record<string, string | number | null>;
}

export function scoreSources(
  sources: SourceLearningInput[],
): LearnedSourceScore[] {
  return sources.map((source) => {
    const attempts = Math.max(1, source.discovered + source.failures);
    const reliability = Math.max(0, 1 - source.failures / attempts);
    const yieldRate = Math.min(1, source.published / Math.max(1, source.discovered));
    const exploration = source.runs < 3 ? 10 : 0;
    const categoryBonus = Math.min(24, source.coverageMatches.length * 8);
    const score = Math.round((reliability * 55 + yieldRate * 15 + categoryBonus + exploration) * 10) / 10;
    const parts = [
      `${Math.round(reliability * 100)}% recent reliability`,
      `${source.published} published from ${source.discovered} discoveries`,
    ];
    if (source.coverageMatches.length > 0) {
      parts.push(`can supply gaps in ${source.coverageMatches.slice(0, 2).join(" and ")}`);
    }
    if (exploration > 0) parts.push("new source exploration");
    return { ...source, score, reason: parts.join(" · ") };
  }).sort((a, b) => b.score - a.score || a.name.localeCompare(b.name));
}

export function buildLearningInsights(input: {
  pageViews: number | null;
  dailyViewGoal: number;
  categoryCounts: Record<string, number>;
  industryCounts: Record<string, number>;
  categoryMinimum: number;
  sources: LearnedSourceScore[];
  speed: Record<string, number> | null;
  integrations: Record<string, { connected: boolean }>;
}): LearningInsight[] {
  const insights: LearningInsight[] = [];

  if (input.pageViews !== null) {
    const ratio = input.dailyViewGoal > 0 ? input.pageViews / input.dailyViewGoal : 1;
    insights.push({
      fingerprint: "traffic:daily-view-goal",
      kind: "TRAFFIC",
      title: ratio >= 1 ? "Daily traffic goal reached" : "Daily traffic is below goal",
      detail: `${input.pageViews} views were measured against the ${input.dailyViewGoal}-view goal.`,
      action: ratio >= 1
        ? "Protect the pages and sources contributing the most qualified traffic."
        : "Prioritise useful pages for categories already earning search impressions and improve weak existing pages.",
      confidence: 1,
      evidence: { pageViews: input.pageViews, goal: input.dailyViewGoal, completion: Math.round(ratio * 100) },
    });
  }

  for (const [category, count] of Object.entries(input.categoryCounts)) {
    if (count >= input.categoryMinimum) continue;
    insights.push({
      fingerprint: `category:${category}:coverage`,
      kind: "CATEGORY",
      title: `${category.replaceAll("_", " ")} needs coverage`,
      detail: `${count} active opportunities are available; the goal is ${input.categoryMinimum}.`,
      action: "Prioritise reliable sources that have previously produced this category. Never fill the gap with unsupported content.",
      confidence: 1,
      evidence: { category, active: count, goal: input.categoryMinimum },
    });
  }

  for (const [industry, count] of Object.entries(input.industryCounts)) {
    if (industry === "OTHER" || count >= input.categoryMinimum) continue;
    insights.push({
      fingerprint: `industry:${industry}:coverage`,
      kind: "CATEGORY",
      title: `${industry.replaceAll("_", " ")} industry needs coverage`,
      detail: `${count} active opportunities are available; the goal is ${input.categoryMinimum}.`,
      action: "Check reliable sources whose history shows that they supply this industry.",
      confidence: 1,
      evidence: { industry, active: count, goal: input.categoryMinimum },
    });
  }

  for (const source of input.sources.filter((item) => item.runs >= 3 && item.score < 35).slice(0, 5)) {
    insights.push({
      fingerprint: `source:${source.id}:low-score`,
      kind: "SOURCE",
      title: `${source.name} is producing weak results`,
      detail: source.reason,
      action: "Check its configuration and recent failures before increasing its crawl frequency.",
      confidence: Math.min(1, source.runs / 10),
      evidence: { score: source.score, runs: source.runs, failures: source.failures, published: source.published },
    });
  }

  if (input.speed && (input.speed.performance ?? 100) < 80) {
    insights.push({
      fingerprint: "speed:mobile-performance",
      kind: "SPEED",
      title: "Mobile speed needs attention",
      detail: `The latest PageSpeed performance score is ${input.speed.performance}.`,
      action: "Review the largest content element, blocking work and image delivery before adding visual features.",
      confidence: 0.9,
      evidence: { performance: input.speed.performance, lcpMs: input.speed.lcpMs ?? 0, cls: input.speed.cls ?? 0 },
    });
  }

  const disconnected = Object.entries(input.integrations).filter(([, status]) => !status.connected).map(([name]) => name);
  if (disconnected.length > 0) {
    insights.push({
      fingerprint: "system:measurement-connections",
      kind: "SYSTEM",
      title: "Some learning data is unavailable",
      detail: `Disconnected: ${disconnected.join(", ")}.`,
      action: "Connect the optional Google credentials in Vercel to let the manager learn from traffic, search and speed data.",
      confidence: 1,
      evidence: { disconnected: disconnected.join(", ") },
    });
  }

  return insights;
}
