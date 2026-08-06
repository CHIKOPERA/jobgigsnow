import { cache } from "@/config/cache";
import { fetchCoursePage } from "@/lib/course-query";
import { errorResponse } from "@/lib/validation/common";
import { courseListQuerySchema, courseListResponseSchema } from "@/lib/validation/course";

export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  const url = new URL(request.url);
  const parsed = courseListQuerySchema.safeParse(Object.fromEntries(url.searchParams));
  if (!parsed.success) {
    return errorResponse("INVALID_QUERY", parsed.error.issues[0]?.message ?? "Invalid query.", 400);
  }

  const result = await fetchCoursePage(parsed.data);
  const body = courseListResponseSchema.parse(result);

  return Response.json(body, {
    headers: { "Cache-Control": `public, s-maxage=${cache.jobsListRevalidateSeconds}, stale-while-revalidate=30` },
  });
}
