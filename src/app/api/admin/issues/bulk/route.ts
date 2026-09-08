import { requireAdmin, adminAuthErrorResponse } from "@/lib/admin-auth";
import { updateIssuesInBulk } from "@/lib/ingest/admin-operations";
import { bulkIssueActionSchema } from "@/lib/validation/admin";
import { errorResponse } from "@/lib/validation/common";

export async function POST(request: Request) {
  const admin = await requireAdmin();
  if (!admin.ok) return adminAuthErrorResponse(admin.reason);

  const parsed = bulkIssueActionSchema.safeParse(await request.json().catch(() => null));
  if (!parsed.success) return errorResponse("INVALID_BODY", parsed.error.issues[0]?.message ?? "Invalid action.", 400);
  return Response.json(await updateIssuesInBulk(parsed.data.ids, parsed.data.action));
}
