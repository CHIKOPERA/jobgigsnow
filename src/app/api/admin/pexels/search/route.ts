import { requireAdmin, adminAuthErrorResponse } from "@/lib/admin-auth";
import { env } from "@/config/env";
import { searchPexels } from "@/lib/pexels";
import { errorResponse } from "@/lib/validation/common";

export async function GET(request: Request) {
  const admin = await requireAdmin();
  if (!admin.ok) return adminAuthErrorResponse(admin.reason);
  const query = new URL(request.url).searchParams.get("q")?.trim();
  if (!query) return errorResponse("INVALID_QUERY", "Enter an image search.", 400);
  if (!env.PEXELS_API_KEY) return errorResponse("NOT_CONFIGURED", "Pexels image search is not configured.", 503);
  try {
    return Response.json({ photos: await searchPexels(query) });
  } catch (error) {
    return errorResponse("PEXELS_FAILED", error instanceof Error ? error.message : "Pexels search failed.", 502);
  }
}
