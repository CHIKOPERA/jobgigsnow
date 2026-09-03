import { requireAdmin, adminAuthErrorResponse } from "@/lib/admin-auth";
import { cancelRun } from "@/lib/ingest/run-tracking";
import { prisma } from "@/lib/prisma";
import { errorResponse } from "@/lib/validation/common";

export async function POST(_request: Request, ctx: { params: Promise<{ id: string }> }) {
  const admin = await requireAdmin();
  if (!admin.ok) return adminAuthErrorResponse(admin.reason);

  const { id } = await ctx.params;
  const stopped = await cancelRun(id);
  if (stopped) return Response.json({ id, status: "CANCELLED" });

  const run = await prisma.ingestRun.findUnique({ where: { id }, select: { status: true } });
  if (!run) return errorResponse("NOT_FOUND", `Ingest run ${id} does not exist.`, 404);
  return errorResponse("RUN_NOT_RUNNING", `Ingest run ${id} is already ${run.status.toLowerCase()}.`, 409);
}
