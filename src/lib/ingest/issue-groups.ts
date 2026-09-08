export interface FailureForGrouping {
  id: string;
  stage: string;
  message: string;
  url: string | null;
  rawJobId: string | null;
  createdAt: Date;
  status: "OPEN" | "RETRYING" | "RESOLVED" | "DISMISSED";
  ingestRun: { sourceId: string; source: { name: string } };
}

export interface IssueGroup {
  key: string;
  sourceId: string;
  sourceName: string;
  stage: string;
  message: string;
  latestAt: Date;
  status: "OPEN" | "RETRYING";
  affectedCount: number;
  eventCount: number;
  retryableCount: number;
  failureIds: string[];
  rawJobIds: string[];
  sampleUrl: string | null;
}

function normalizedMessage(message: string) {
  return message.replace(/\s+/g, " ").trim();
}

/** Groups repeated per-job events into one actionable issue without hiding affected job counts. */
export function groupFailures(rows: FailureForGrouping[]): IssueGroup[] {
  const groups = new Map<string, IssueGroup>();

  for (const row of rows) {
    const message = normalizedMessage(row.message);
    const key = JSON.stringify([row.ingestRun.sourceId, row.stage, message]);
    const existing = groups.get(key);
    if (existing) {
      existing.failureIds.push(row.id);
      if (row.rawJobId && !existing.rawJobIds.includes(row.rawJobId)) existing.rawJobIds.push(row.rawJobId);
      existing.eventCount += 1;
      existing.affectedCount = existing.rawJobIds.length || existing.eventCount;
      existing.retryableCount = existing.rawJobIds.length || existing.eventCount;
      if (row.createdAt > existing.latestAt) existing.latestAt = row.createdAt;
      if (row.status === "OPEN") existing.status = "OPEN";
      continue;
    }

    groups.set(key, {
      key,
      sourceId: row.ingestRun.sourceId,
      sourceName: row.ingestRun.source.name,
      stage: row.stage,
      message,
      latestAt: row.createdAt,
      status: row.status === "OPEN" ? "OPEN" : "RETRYING",
      affectedCount: 1,
      eventCount: 1,
      retryableCount: 1,
      failureIds: [row.id],
      rawJobIds: row.rawJobId ? [row.rawJobId] : [],
      sampleUrl: row.url,
    });
  }

  return [...groups.values()].sort((a, b) => b.latestAt.getTime() - a.latestAt.getTime());
}
