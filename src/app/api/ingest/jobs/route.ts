import { upsertJobs } from "@/lib/ingest/job-service";
import { isAuthorizedIngestRequest } from "@/lib/ingest-auth";
import { errorResponse } from "@/lib/validation/common";
import { ingestJobsSchema } from "@/lib/validation/ingest";

export async function POST(request: Request) {
  if (!isAuthorizedIngestRequest(request)) {
    return errorResponse("UNAUTHORIZED", "Missing or invalid bearer token.", 401);
  }

  const json = await request.json().catch(() => null);
  const parsed = ingestJobsSchema.safeParse(json);
  if (!parsed.success) {
    return errorResponse("INVALID_BODY", parsed.error.issues[0]?.message ?? "Invalid body.", 400);
  }

  const results = await upsertJobs(parsed.data.jobs);

  return Response.json({ upserted: results.length, jobs: results }, { status: 200 });
}
