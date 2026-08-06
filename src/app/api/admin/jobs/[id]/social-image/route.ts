import { z } from "zod";
import { requireAdmin, adminAuthErrorResponse } from "@/lib/admin-auth";
import { importJobSocialImage } from "@/lib/job-social-image";
import { prisma } from "@/lib/prisma";
import { errorResponse } from "@/lib/validation/common";

const socialImageSchema = z.object({
  photoId: z.number().int().positive(),
  url: z.url(),
  alt: z.string().trim().min(1).max(500),
  photographer: z.string().trim().min(1).max(200),
  photographerUrl: z.url(),
});

export async function POST(request: Request, ctx: { params: Promise<{ id: string }> }) {
  const admin = await requireAdmin();
  if (!admin.ok) return adminAuthErrorResponse(admin.reason);

  try {
    const { id } = await ctx.params;
    const body = socialImageSchema.parse(await request.json());
    const job = await prisma.job.findUnique({ where: { id }, select: { id: true } });
    if (!job) return errorResponse("NOT_FOUND", "Job not found.", 404);

    const socialImageUrl = await importJobSocialImage(id, body.photoId, body.url);
    const updated = await prisma.job.update({
      where: { id },
      data: {
        socialImageUrl,
        socialImageAlt: body.alt,
        socialImageCredit: `Photo by ${body.photographer} on Pexels`,
        socialImageSourceUrl: body.photographerUrl,
      },
      select: { socialImageUrl: true, socialImageAlt: true, socialImageCredit: true, socialImageSourceUrl: true },
    });
    return Response.json(updated);
  } catch (error) {
    if (error instanceof z.ZodError) {
      return errorResponse("INVALID_IMAGE", error.issues[0]?.message ?? "Invalid image.", 400);
    }
    return errorResponse("IMAGE_IMPORT_FAILED", error instanceof Error ? error.message : "Unable to save the image.", 500);
  }
}
