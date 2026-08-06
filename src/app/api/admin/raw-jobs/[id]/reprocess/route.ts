import { requireAdmin, adminAuthErrorResponse } from "@/lib/admin-auth";
import { reprocessRawJob } from "@/lib/ingest/admin-query";
import { errorResponse } from "@/lib/validation/common";

export async function POST(_request: Request, ctx: RouteContext<"/api/admin/raw-jobs/[id]/reprocess">) {
  const admin = await requireAdmin();
  if (!admin.ok) return adminAuthErrorResponse(admin.reason);

  const { id } = await ctx.params;
  const outcome = await reprocessRawJob(id);
  if (outcome === "not_found") {
    return errorResponse("NOT_FOUND", `Raw job ${id} does not exist.`, 404);
  }

  return Response.json({ outcome });
}
