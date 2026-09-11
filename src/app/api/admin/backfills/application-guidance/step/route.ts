import { requireAdmin, adminAuthErrorResponse } from "@/lib/admin-auth";
import { processApplicationGuidanceBackfillStep } from "@/lib/ingest/application-guidance-backfill";

export const maxDuration = 120;

export async function POST() {
  const admin = await requireAdmin();
  if (!admin.ok) return adminAuthErrorResponse(admin.reason);
  return Response.json(await processApplicationGuidanceBackfillStep());
}
