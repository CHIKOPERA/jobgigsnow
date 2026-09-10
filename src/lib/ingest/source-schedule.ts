export interface SourceScheduleCandidate {
  id: string;
  cadenceMinutes: number;
  lastRunAt: Date | null;
  agentPriority: number;
}

/** Selects due sources while ensuring a newly-added source gets its first inspection promptly. */
export function selectDueSourceIds(
  sources: SourceScheduleCandidate[],
  nowMs: number,
  limit: number,
): string[] {
  if (limit <= 0) return [];

  const due = sources.filter(
    (source) => !source.lastRunAt || nowMs - source.lastRunAt.getTime() >= source.cadenceMinutes * 60_000,
  );
  const neverRun = due
    .filter((source) => source.lastRunAt === null)
    .sort((a, b) => b.agentPriority - a.agentPriority || a.id.localeCompare(b.id));
  if (neverRun.length >= limit) return neverRun.slice(0, limit).map((source) => source.id);

  const selected = [...neverRun];
  const known = due.filter((source) => source.lastRunAt !== null);
  const priorityOrder = [...known].sort((a, b) => b.agentPriority - a.agentPriority
    || a.lastRunAt!.getTime() - b.lastRunAt!.getTime());
  const prioritySlots = Math.max(0, limit - selected.length - 1);
  selected.push(...priorityOrder.slice(0, prioritySlots));

  // Reserve one slot for breadth: even a lower-yield source is rechecked eventually, while the
  // other slots continue to target sources most likely to fill today's coverage gaps.
  const selectedIds = new Set(selected.map((source) => source.id));
  const oldestUnselected = known
    .filter((source) => !selectedIds.has(source.id))
    .sort((a, b) => a.lastRunAt!.getTime() - b.lastRunAt!.getTime()
      || b.agentPriority - a.agentPriority)[0];
  if (oldestUnselected) selected.push(oldestUnselected);

  for (const source of priorityOrder) {
    if (selected.length >= limit) break;
    if (!selected.some((item) => item.id === source.id)) selected.push(source);
  }
  return selected.slice(0, limit).map((source) => source.id);
}
