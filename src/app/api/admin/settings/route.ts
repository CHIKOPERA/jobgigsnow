import { requireAdmin, adminAuthErrorResponse } from "@/lib/admin-auth";
import { getSeoRewritePrompt, setSeoRewritePrompt } from "@/lib/ingest/settings";
import { errorResponse } from "@/lib/validation/common";
import { updateSettingsSchema } from "@/lib/validation/settings";

export async function GET() {
  const admin = await requireAdmin();
  if (!admin.ok) return adminAuthErrorResponse(admin.reason);

  const seoRewritePrompt = await getSeoRewritePrompt();
  return Response.json({ seoRewritePrompt });
}

export async function PATCH(request: Request) {
  const admin = await requireAdmin();
  if (!admin.ok) return adminAuthErrorResponse(admin.reason);

  const json = await request.json().catch(() => null);
  const parsed = updateSettingsSchema.safeParse(json);
  if (!parsed.success) {
    return errorResponse("INVALID_BODY", parsed.error.issues[0]?.message ?? "Invalid body.", 400);
  }

  await setSeoRewritePrompt(parsed.data.seoRewritePrompt);
  return Response.json({ seoRewritePrompt: parsed.data.seoRewritePrompt });
}
