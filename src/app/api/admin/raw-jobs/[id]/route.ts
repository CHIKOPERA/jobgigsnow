import { requireAdmin, adminAuthErrorResponse } from "@/lib/admin-auth";
import { getRawJobDetail } from "@/lib/ingest/admin-query";
import { errorResponse } from "@/lib/validation/common";

export async function GET(_request: Request, ctx: RouteContext<"/api/admin/raw-jobs/[id]">) {
  const admin = await requireAdmin();
  if (!admin.ok) return adminAuthErrorResponse(admin.reason);

  const { id } = await ctx.params;
  const rawJob = await getRawJobDetail(id);
  if (!rawJob) {
    return errorResponse("NOT_FOUND", `Raw job ${id} does not exist.`, 404);
  }

  return Response.json(rawJob);
}
