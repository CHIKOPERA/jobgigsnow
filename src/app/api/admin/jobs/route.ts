import { randomUUID } from "node:crypto";
import { z } from "zod";
import { requireAdmin, adminAuthErrorResponse } from "@/lib/admin-auth";
import { sanitizeJobDescription, toEditorHtml } from "@/lib/job-rich-text";
import { prisma } from "@/lib/prisma";
import { slugify } from "@/lib/slug";
import { errorResponse } from "@/lib/validation/common";
import { manualJobCreateSchema } from "@/lib/validation/job-review";

export async function POST(request: Request) {
  const admin = await requireAdmin();
  if (!admin.ok) return adminAuthErrorResponse(admin.reason);

  try {
    const body = manualJobCreateSchema.parse(await request.json());
    const companySlug = slugify(body.companyName);
    const company = await prisma.company.upsert({
      where: { slug: companySlug },
      update: { name: body.companyName },
      create: { name: body.companyName, slug: companySlug },
      select: { id: true },
    });
    const baseSlug = slugify(`${body.title}-${body.companyName}`) || "job";
    const existingSlug = await prisma.job.findUnique({ where: { slug: baseSlug }, select: { id: true } });
    const slug = existingSlug ? `${baseSlug}-${randomUUID().slice(0, 6)}` : baseSlug;
    const job = await prisma.job.create({
      data: {
        slug,
        title: body.title,
        companyId: company.id,
        category: body.category,
        location: body.location,
        remoteType: body.remoteType,
        employmentType: body.employmentType,
        description: sanitizeJobDescription(toEditorHtml(body.description)),
        highlights: body.highlights,
        applyUrl: body.applyUrl,
        status: "READY",
      },
      select: { id: true, slug: true, status: true },
    });
    return Response.json(job, { status: 201 });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return errorResponse("INVALID_JOB", error.issues[0]?.message ?? "Invalid job.", 400);
    }
    return errorResponse("CREATE_FAILED", error instanceof Error ? error.message : "Unable to create the job.", 500);
  }
}
