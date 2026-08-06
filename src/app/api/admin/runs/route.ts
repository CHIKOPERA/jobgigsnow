import { requireAdmin, adminAuthErrorResponse } from "@/lib/admin-auth";
import { listRuns } from "@/lib/ingest/admin-query";
import { errorResponse } from "@/lib/validation/common";
import { listRunsQuerySchema } from "@/lib/validation/admin";

export async function GET(request: Request) {
  const admin = await requireAdmin();
  if (!admin.ok) return adminAuthErrorResponse(admin.reason);

  const url = new URL(request.url);
  const parsed = listRunsQuerySchema.safeParse(Object.fromEntries(url.searchParams));
  if (!parsed.success) {
    return errorResponse("INVALID_QUERY", parsed.error.issues[0]?.message ?? "Invalid query.", 400);
  }

  const result = await listRuns(parsed.data);
  return Response.json(result);
}
