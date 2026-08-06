import { upsertRawJobsForSource } from "@/lib/ingest/raw-job-service";
import { isAuthorizedIngestRequest } from "@/lib/ingest-auth";
import { prisma } from "@/lib/prisma";
import { errorResponse } from "@/lib/validation/common";
import { ingestRawJobsSchema } from "@/lib/validation/ingest";

export async function POST(request: Request) {
  if (!isAuthorizedIngestRequest(request)) {
    return errorResponse("UNAUTHORIZED", "Missing or invalid bearer token.", 401);
  }

  const json = await request.json().catch(() => null);
  const parsed = ingestRawJobsSchema.safeParse(json);
  if (!parsed.success) {
    return errorResponse("INVALID_BODY", parsed.error.issues[0]?.message ?? "Invalid body.", 400);
  }
  const { sourceId, jobs } = parsed.data;

  const source = await prisma.source.findUnique({ where: { id: sourceId }, select: { id: true } });
  if (!source) {
    return errorResponse("NOT_FOUND", `Source ${sourceId} does not exist.`, 404);
  }

  const results = await upsertRawJobsForSource(sourceId, jobs);

  return Response.json({ upserted: results.length, ids: results.map((r) => r.id) }, { status: 200 });
}
