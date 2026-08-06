import { z } from "zod";
import { requireAdmin, adminAuthErrorResponse } from "@/lib/admin-auth";
import { rewriteJobDescription } from "@/lib/ingest/rewrite-job";
import { errorResponse } from "@/lib/validation/common";
import { rewriteJobSchema } from "@/lib/validation/job-review";

export const maxDuration = 120;

export async function POST(request: Request, ctx: RouteContext<"/api/admin/jobs/[id]/rewrite">) {
  const admin = await requireAdmin();
  if (!admin.ok) return adminAuthErrorResponse(admin.reason);

  try {
    const { id } = await ctx.params;
    const body = rewriteJobSchema.parse(await request.json());
    const result = await rewriteJobDescription(id, body.prompt, body.description);
    if (!result.ok) {
      return errorResponse(
        result.reason === "not_found" ? "NOT_FOUND" : "NO_RAW_JOB",
        result.reason === "not_found" ? "Job not found." : "This job has no raw source to attach the rewrite history to.",
        result.reason === "not_found" ? 404 : 409,
      );
    }
    return Response.json({ description: result.description });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return errorResponse("INVALID_REWRITE", error.issues[0]?.message ?? "Enter a rewrite instruction.", 400);
    }
    return errorResponse("REWRITE_FAILED", error instanceof Error ? error.message : "The AI rewrite failed.", 500);
  }
}
