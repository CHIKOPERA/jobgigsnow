import { requireAdmin, adminAuthErrorResponse } from "@/lib/admin-auth";
import { toCsv } from "@/lib/csv";
import { listSourcesWithHealth } from "@/lib/ingest/admin-query";

export const dynamic = "force-dynamic";

export async function GET() {
  const admin = await requireAdmin();
  if (!admin.ok) return adminAuthErrorResponse(admin.reason);

  const sources = await listSourcesWithHealth();
  const rows: unknown[][] = [[
    "Source ID",
    "Name",
    "Base URL",
    "Status",
    "Cadence (minutes)",
    "Last checked",
    "Next check",
    "Latest run status",
    "Latest run started",
    "New in latest run",
    "Failures in latest run",
    "Open issues",
  ]];

  for (const source of sources) {
    const latest = source.latestRun;
    const failures = latest
      ? latest.failedCount + latest.validationFailedCount + latest.aiFailedCount
      : 0;
    const nextCheck = source.enabled && source.lastRunAt
      ? new Date(source.lastRunAt.getTime() + source.cadenceMinutes * 60_000)
      : null;
    rows.push([
      source.id,
      source.name,
      source.baseUrl,
      source.enabled ? "Active" : "Paused",
      source.cadenceMinutes,
      source.lastRunAt?.toISOString() ?? "",
      nextCheck?.toISOString() ?? "",
      latest?.status ?? "Never run",
      latest?.startedAt.toISOString() ?? "",
      latest?.newCount ?? 0,
      failures,
      source.issueCount,
    ]);
  }

  const date = new Date().toISOString().slice(0, 10);
  return new Response(`\uFEFF${toCsv(rows)}\r\n`, {
    headers: {
      "Cache-Control": "no-store",
      "Content-Disposition": `attachment; filename="jobgigsnow-sources-${date}.csv"`,
      "Content-Type": "text/csv; charset=utf-8",
    },
  });
}
