import { cache } from "@/config/cache";
import { courseDetailSelect, toCourseDetail } from "@/lib/course-dto";
import { prisma } from "@/lib/prisma";
import { errorResponse } from "@/lib/validation/common";
import { courseDetailSchema } from "@/lib/validation/course";

export const dynamic = "force-dynamic";

export async function GET(_request: Request, ctx: RouteContext<"/api/courses/[slug]">) {
  const { slug } = await ctx.params;

  const row = await prisma.course.findFirst({
    where: { slug, published: true },
    select: courseDetailSelect,
  });

  if (!row) {
    return errorResponse("NOT_FOUND", "Course not found.", 404);
  }

  const body = courseDetailSchema.parse(toCourseDetail(row));

  return Response.json(body, {
    headers: {
      "Cache-Control": `public, s-maxage=${cache.jobDetailRevalidateSeconds}, stale-while-revalidate=60`,
    },
  });
}
