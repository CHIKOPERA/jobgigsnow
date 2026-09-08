import { requireAdmin, adminAuthErrorResponse } from "@/lib/admin-auth";
import { updateSourcesInBulk } from "@/lib/ingest/admin-operations";
import { bulkSourceActionSchema } from "@/lib/validation/admin";
import { errorResponse } from "@/lib/validation/common";

export async function POST(request: Request) {
  const admin = await requireAdmin();
  if (!admin.ok) return adminAuthErrorResponse(admin.reason);

  const parsed = bulkSourceActionSchema.safeParse(await request.json().catch(() => null));
  if (!parsed.success) return errorResponse("INVALID_BODY", parsed.error.issues[0]?.message ?? "Invalid action.", 400);
  return Response.json(await updateSourcesInBulk(parsed.data.ids, parsed.data.action));
}
