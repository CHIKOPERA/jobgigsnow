import { cache } from "@/config/cache";
import { fetchJobPage } from "@/lib/job-query";
import { checkRateLimit, clientKeyFromRequest } from "@/lib/rate-limit";
import { errorResponse } from "@/lib/validation/common";
import { jobListQuerySchema, jobListResponseSchema } from "@/lib/validation/job";

export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  const rateLimit = checkRateLimit(clientKeyFromRequest(request));
  if (!rateLimit.ok) {
    return errorResponse("RATE_LIMITED", "Too many requests, try again shortly.", 429);
  }

  const url = new URL(request.url);
  const parsed = jobListQuerySchema.safeParse(Object.fromEntries(url.searchParams));
  if (!parsed.success) {
    return errorResponse("INVALID_QUERY", parsed.error.issues[0]?.message ?? "Invalid query.", 400);
  }

  const result = await fetchJobPage(parsed.data);
  const body = jobListResponseSchema.parse(result);

  return Response.json(body, {
    headers: { "Cache-Control": `public, s-maxage=${cache.jobsListRevalidateSeconds}, stale-while-revalidate=30` },
  });
}
