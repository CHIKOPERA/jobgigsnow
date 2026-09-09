import { requireAdmin, adminAuthErrorResponse } from "@/lib/admin-auth";
import { getAgentSettings, getSeoRewritePrompt, setAgentSettings, setSeoRewritePrompt } from "@/lib/ingest/settings";
import { errorResponse } from "@/lib/validation/common";
import { updateAgentSettingsSchema, updateSettingsSchema } from "@/lib/validation/settings";

export async function GET() {
  const admin = await requireAdmin();
  if (!admin.ok) return adminAuthErrorResponse(admin.reason);

  const [seoRewritePrompt, agent] = await Promise.all([getSeoRewritePrompt(), getAgentSettings()]);
  return Response.json({ seoRewritePrompt, agent });
}

export async function PATCH(request: Request) {
  const admin = await requireAdmin();
  if (!admin.ok) return adminAuthErrorResponse(admin.reason);

  const json = await request.json().catch(() => null);
  if (json && typeof json === "object" && "seoRewritePrompt" in json) {
    const parsed = updateSettingsSchema.safeParse(json);
    if (!parsed.success) {
      return errorResponse("INVALID_BODY", parsed.error.issues[0]?.message ?? "Invalid body.", 400);
    }
    await setSeoRewritePrompt(parsed.data.seoRewritePrompt);
    return Response.json({ seoRewritePrompt: parsed.data.seoRewritePrompt });
  }
  const parsed = updateAgentSettingsSchema.safeParse(json);
  if (!parsed.success) return errorResponse("INVALID_BODY", parsed.error.issues[0]?.message ?? "Invalid body.", 400);
  return Response.json({ agent: await setAgentSettings(parsed.data) });
}
