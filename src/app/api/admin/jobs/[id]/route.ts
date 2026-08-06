import { z } from "zod";
import { requireAdmin, adminAuthErrorResponse } from "@/lib/admin-auth";
import { getReviewJob } from "@/lib/ingest/admin-query";
import { sanitizeJobDescription } from "@/lib/job-rich-text";
import { prisma } from "@/lib/prisma";
import { slugify } from "@/lib/slug";
import { errorResponse } from "@/lib/validation/common";
import { jobReviewPatchSchema } from "@/lib/validation/job-review";

export async function GET(_request: Request, ctx: RouteContext<"/api/admin/jobs/[id]">) {
  const admin = await requireAdmin();
  if (!admin.ok) return adminAuthErrorResponse(admin.reason);
  const { id } = await ctx.params;
  const job = await getReviewJob(id);
  return job ? Response.json(job) : errorResponse("NOT_FOUND", "Job not found.", 404);
}

export async function PATCH(request: Request, ctx: RouteContext<"/api/admin/jobs/[id]">) {
  const admin = await requireAdmin();
  if (!admin.ok) return adminAuthErrorResponse(admin.reason);

  try {
    const { id } = await ctx.params;
    const body = jobReviewPatchSchema.parse(await request.json());
    const existing = await prisma.job.findUnique({ where: { id }, select: { id: true, postedAt: true } });
    if (!existing) return errorResponse("NOT_FOUND", "Job not found.", 404);

    const description = body.description ? sanitizeJobDescription(body.description) : undefined;
    if (body.description && !description) {
      return errorResponse("INVALID_DESCRIPTION", "The job description cannot be empty.", 400);
    }

    let companyId: string | undefined;
    if (body.companyName) {
      const company = await prisma.company.upsert({
        where: { slug: slugify(body.companyName) },
        update: { name: body.companyName },
        create: { name: body.companyName, slug: slugify(body.companyName) },
        select: { id: true },
      });
      companyId = company.id;
    }

    const job = await prisma.job.update({
      where: { id },
      data: {
        title: body.title,
        companyId,
        category: body.category,
        location: body.location,
        remoteType: body.remoteType,
        employmentType: body.employmentType,
        description,
        highlights: body.highlights,
        applyUrl: body.applyUrl,
        rewritePrompt: body.rewritePrompt,
        status: body.status,
        postedAt: body.status === "PUBLISHED" && !existing.postedAt ? new Date() : undefined,
      },
      select: { id: true, slug: true, status: true, updatedAt: true },
    });
    return Response.json(job);
  } catch (error) {
    if (error instanceof z.ZodError) {
      return errorResponse("INVALID_JOB", error.issues[0]?.message ?? "Invalid job data.", 400);
    }
    return errorResponse("UPDATE_FAILED", error instanceof Error ? error.message : "Unable to update the job.", 500);
  }
}
