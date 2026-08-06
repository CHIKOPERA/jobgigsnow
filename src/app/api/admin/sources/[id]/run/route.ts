import { requireAdmin, adminAuthErrorResponse } from "@/lib/admin-auth";
import { discoverSource } from "@/lib/ingest/discovery";
import { errorResponse } from "@/lib/validation/common";

/**
 * Triggers discovery for this source right now, bypassing its cadence. Does NOT synchronously
 * drain acquisition/aggregation — those still wait for the next cron tick(s), consistent with
 * "durable state, no in-memory queues" (Section C of the plan).
 */
export async function POST(_request: Request, ctx: RouteContext<"/api/admin/sources/[id]/run">) {
  const admin = await requireAdmin();
  if (!admin.ok) return adminAuthErrorResponse(admin.reason);

  const { id } = await ctx.params;
  const runId = await discoverSource(id);
  if (!runId) {
    return errorResponse("NOT_FOUND", `Source ${id} does not exist or is disabled.`, 404);
  }

  return Response.json({ ingestRunId: runId }, { status: 202 });
}
