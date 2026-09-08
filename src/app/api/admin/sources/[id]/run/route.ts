import { importSource } from "@/lib/ingest/tick";
import { requireAdmin, adminAuthErrorResponse } from "@/lib/admin-auth";
import { errorResponse } from "@/lib/validation/common";

export const maxDuration = 300;

export async function POST(_request: Request, ctx: RouteContext<"/api/admin/sources/[id]/run">) {
  const admin = await requireAdmin();
  if (!admin.ok) return adminAuthErrorResponse(admin.reason);

  const { id } = await ctx.params;
  const result = await importSource(id);
  if (!result.ingestRunId) {
    return errorResponse("NOT_FOUND", `Source ${id} does not exist or is disabled.`, 404);
  }

  return Response.json({ ok: true, ...result });
}
