import { requireAdmin, adminAuthErrorResponse } from "@/lib/admin-auth";
import { runTick } from "@/lib/ingest/tick";

/**
 * Manually triggers one full tick (discovery + acquisition + aggregation).
 * Uses admin auth so no CRON_SECRET needed from the browser.
 * Same work as the scheduled /api/cron/tick — safe to call any time.
 */
export const maxDuration = 300;

export async function POST() {
  const admin = await requireAdmin();
  if (!admin.ok) return adminAuthErrorResponse(admin.reason);

  const result = await runTick();
  return Response.json({ ok: true, ...result });
}
