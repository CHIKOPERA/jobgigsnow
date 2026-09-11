import { requireAdmin, adminAuthErrorResponse } from "@/lib/admin-auth";
import { getApplicationGuidanceBackfillStatus, startApplicationGuidanceBackfill } from "@/lib/ingest/application-guidance-backfill";

export async function GET() {
  const admin = await requireAdmin();
  if (!admin.ok) return adminAuthErrorResponse(admin.reason);
  return Response.json(await getApplicationGuidanceBackfillStatus());
}

export async function POST() {
  const admin = await requireAdmin();
  if (!admin.ok) return adminAuthErrorResponse(admin.reason);
  return Response.json(await startApplicationGuidanceBackfill());
}
