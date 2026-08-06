import { isAuthorizedIngestRequest } from "@/lib/ingest-auth";
import { prisma } from "@/lib/prisma";
import { errorResponse } from "@/lib/validation/common";
import { ingestQueueQuerySchema } from "@/lib/validation/ingest";

export async function GET(request: Request) {
  if (!isAuthorizedIngestRequest(request)) {
    return errorResponse("UNAUTHORIZED", "Missing or invalid bearer token.", 401);
  }

  const url = new URL(request.url);
  const parsed = ingestQueueQuerySchema.safeParse(Object.fromEntries(url.searchParams));
  if (!parsed.success) {
    return errorResponse("INVALID_QUERY", parsed.error.issues[0]?.message ?? "Invalid query.", 400);
  }
  const { stage, limit } = parsed.data;

  if (stage === "improving") {
    const rawJobs = await prisma.rawJob.findMany({
      where: { fetchStatus: "FETCHED", job: null },
      orderBy: { discoveredAt: "asc" },
      take: limit,
      select: {
        id: true,
        sourceId: true,
        externalId: true,
        externalUrl: true,
        rawTitle: true,
        rawCompany: true,
        rawLocation: true,
        payload: true,
        discoveredAt: true,
      },
    });
    return Response.json({ stage, items: rawJobs });
  }

  const readyJobs = await prisma.job.findMany({
    where: { status: "READY" },
    orderBy: { updatedAt: "asc" },
    take: limit,
    select: { id: true, slug: true, title: true, updatedAt: true },
  });
  return Response.json({ stage, items: readyJobs });
}
