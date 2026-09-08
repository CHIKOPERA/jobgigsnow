import { requireAdmin, adminAuthErrorResponse } from "@/lib/admin-auth";
import { progressStreamResponse } from "@/lib/ingest/progress-stream";
import { resumeRun } from "@/lib/ingest/run-tracking";
import { processSourceRun } from "@/lib/ingest/tick";
import { prisma } from "@/lib/prisma";
import { errorResponse } from "@/lib/validation/common";

export const maxDuration = 300;

export async function POST(_request: Request, ctx: { params: Promise<{ id: string }> }) {
  const admin = await requireAdmin();
  if (!admin.ok) return adminAuthErrorResponse(admin.reason);

  const { id } = await ctx.params;
  if (!(await resumeRun(id))) {
    const run = await prisma.ingestRun.findUnique({ where: { id }, select: { status: true } });
    if (!run) return errorResponse("NOT_FOUND", `Ingest run ${id} does not exist.`, 404);
    return errorResponse("RUN_NOT_PAUSED", `Ingest run ${id} is already ${run.status.toLowerCase()}.`, 409);
  }

  return progressStreamResponse(async (report) => ({
    ok: true,
    ...(await processSourceRun(id, Date.now(), report)),
  }));
}
