import { importSource } from "@/lib/ingest/tick";
import { requireAdmin, adminAuthErrorResponse } from "@/lib/admin-auth";
import { errorResponse } from "@/lib/validation/common";
import { getSource } from "@/lib/ingest/source-service";
import { progressStreamResponse } from "@/lib/ingest/progress-stream";

export const maxDuration = 300;

export async function POST(_request: Request, ctx: RouteContext<"/api/admin/sources/[id]/run">) {
  const admin = await requireAdmin();
  if (!admin.ok) return adminAuthErrorResponse(admin.reason);

  const { id } = await ctx.params;
  const source = await getSource(id);
  if (!source?.enabled) {
    return errorResponse("NOT_FOUND", `Source ${id} does not exist or is disabled.`, 404);
  }

  return progressStreamResponse(async (report) => {
    const result = await importSource(id, Date.now(), report);
    return { ok: true, ...result };
  });
}
