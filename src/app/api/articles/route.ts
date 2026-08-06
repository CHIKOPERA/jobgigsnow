import { cache } from "@/config/cache";
import { fetchArticlePage } from "@/lib/article-query";
import { errorResponse } from "@/lib/validation/common";
import { articleListQuerySchema, articleListResponseSchema } from "@/lib/validation/article";

export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  const url = new URL(request.url);
  const parsed = articleListQuerySchema.safeParse(Object.fromEntries(url.searchParams));
  if (!parsed.success) {
    return errorResponse("INVALID_QUERY", parsed.error.issues[0]?.message ?? "Invalid query.", 400);
  }

  const result = await fetchArticlePage(parsed.data);
  const body = articleListResponseSchema.parse(result);

  return Response.json(body, {
    headers: { "Cache-Control": `public, s-maxage=${cache.jobsListRevalidateSeconds}, stale-while-revalidate=30` },
  });
}
