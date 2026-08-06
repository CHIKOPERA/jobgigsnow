import { requireAdmin, adminAuthErrorResponse } from "@/lib/admin-auth";
import { createSource, listSources } from "@/lib/ingest/source-service";
import { errorResponse } from "@/lib/validation/common";
import { createSourceSchema } from "@/lib/validation/source";

export async function GET() {
  const admin = await requireAdmin();
  if (!admin.ok) return adminAuthErrorResponse(admin.reason);

  const sources = await listSources();
  return Response.json({ sources });
}

export async function POST(request: Request) {
  const admin = await requireAdmin();
  if (!admin.ok) return adminAuthErrorResponse(admin.reason);

  const json = await request.json().catch(() => null);
  const parsed = createSourceSchema.safeParse(json);
  if (!parsed.success) {
    return errorResponse("INVALID_BODY", parsed.error.issues[0]?.message ?? "Invalid body.", 400);
  }

  const source = await createSource(parsed.data);
  return Response.json(source, { status: 201 });
}
