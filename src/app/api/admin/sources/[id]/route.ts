import { requireAdmin, adminAuthErrorResponse } from "@/lib/admin-auth";
import { deleteSource, getSource, updateSource } from "@/lib/ingest/source-service";
import { errorResponse } from "@/lib/validation/common";
import { updateSourceSchema } from "@/lib/validation/source";

export async function GET(_request: Request, ctx: RouteContext<"/api/admin/sources/[id]">) {
  const admin = await requireAdmin();
  if (!admin.ok) return adminAuthErrorResponse(admin.reason);

  const { id } = await ctx.params;
  const source = await getSource(id);
  if (!source) {
    return errorResponse("NOT_FOUND", `Source ${id} does not exist.`, 404);
  }

  return Response.json(source);
}

export async function PATCH(request: Request, ctx: RouteContext<"/api/admin/sources/[id]">) {
  const admin = await requireAdmin();
  if (!admin.ok) return adminAuthErrorResponse(admin.reason);

  const { id } = await ctx.params;
  const json = await request.json().catch(() => null);
  const parsed = updateSourceSchema.safeParse(json);
  if (!parsed.success) {
    return errorResponse("INVALID_BODY", parsed.error.issues[0]?.message ?? "Invalid body.", 400);
  }

  const existing = await getSource(id);
  if (!existing) {
    return errorResponse("NOT_FOUND", `Source ${id} does not exist.`, 404);
  }

  const source = await updateSource(id, parsed.data);
  return Response.json(source);
}

export async function DELETE(_request: Request, ctx: RouteContext<"/api/admin/sources/[id]">) {
  const admin = await requireAdmin();
  if (!admin.ok) return adminAuthErrorResponse(admin.reason);

  const { id } = await ctx.params;
  const outcome = await deleteSource(id);
  if (outcome === "not_found") {
    return errorResponse("NOT_FOUND", `Source ${id} does not exist.`, 404);
  }
  if (outcome === "run_in_progress") {
    return errorResponse("RUN_IN_PROGRESS", "This source cannot be deleted while a crawl is running.", 409);
  }
  return new Response(null, { status: 204 });
}
