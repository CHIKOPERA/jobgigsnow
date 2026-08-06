import { cache } from "@/config/cache";
import { jobDetailSelect, toJobDetail } from "@/lib/dto";
import { prisma } from "@/lib/prisma";
import { errorResponse } from "@/lib/validation/common";
import { jobDetailSchema } from "@/lib/validation/job";

export const dynamic = "force-dynamic";

export async function GET(_request: Request, ctx: RouteContext<"/api/jobs/[slug]">) {
  const { slug } = await ctx.params;

  const row = await prisma.job.findFirst({
    where: { slug, status: "PUBLISHED" },
    select: jobDetailSelect,
  });

  if (!row) {
    return errorResponse("NOT_FOUND", "Job not found.", 404);
  }

  const body = jobDetailSchema.parse(toJobDetail(row));

  return Response.json(body, {
    headers: {
      "Cache-Control": `public, s-maxage=${cache.jobDetailRevalidateSeconds}, stale-while-revalidate=60`,
    },
  });
}
