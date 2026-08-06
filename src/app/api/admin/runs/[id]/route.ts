import { requireAdmin, adminAuthErrorResponse } from "@/lib/admin-auth";
import { getRunDetail } from "@/lib/ingest/admin-query";
import { errorResponse } from "@/lib/validation/common";

export async function GET(_request: Request, ctx: RouteContext<"/api/admin/runs/[id]">) {
  const admin = await requireAdmin();
  if (!admin.ok) return adminAuthErrorResponse(admin.reason);

  const { id } = await ctx.params;
  const detail = await getRunDetail(id);
  if (!detail) {
    return errorResponse("NOT_FOUND", `Ingest run ${id} does not exist.`, 404);
  }

  return Response.json(detail);
}
