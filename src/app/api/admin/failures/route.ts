import { requireAdmin, adminAuthErrorResponse } from "@/lib/admin-auth";
import { listFailures } from "@/lib/ingest/admin-query";
import { errorResponse } from "@/lib/validation/common";
import { listFailuresQuerySchema } from "@/lib/validation/admin";

export async function GET(request: Request) {
  const admin = await requireAdmin();
  if (!admin.ok) return adminAuthErrorResponse(admin.reason);

  const url = new URL(request.url);
  const parsed = listFailuresQuerySchema.safeParse(Object.fromEntries(url.searchParams));
  if (!parsed.success) {
    return errorResponse("INVALID_QUERY", parsed.error.issues[0]?.message ?? "Invalid query.", 400);
  }

  const result = await listFailures(parsed.data);
  return Response.json(result);
}
