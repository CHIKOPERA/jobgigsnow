import type { Prisma } from "@/generated/prisma/client";
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

  const results = await prisma.$transaction(
    jobs.map((job) =>
      prisma.rawJob.upsert({
        where: { sourceId_externalId: { sourceId, externalId: job.externalId } },
        create: {
          sourceId,
          externalId: job.externalId,
          externalUrl: job.externalUrl,
          rawTitle: job.rawTitle ?? null,
          rawCompany: job.rawCompany ?? null,
          rawLocation: job.rawLocation ?? null,
          payload: job.payload as Prisma.InputJsonValue,
          contentHash: job.contentHash,
          fetchStatus: job.fetchStatus,
        },
        update: {
          externalUrl: job.externalUrl,
          rawTitle: job.rawTitle ?? null,
          rawCompany: job.rawCompany ?? null,
          rawLocation: job.rawLocation ?? null,
          payload: job.payload as Prisma.InputJsonValue,
          contentHash: job.contentHash,
          fetchStatus: job.fetchStatus,
        },
        select: { id: true, externalId: true },
      }),
    ),
  );

  return Response.json({ upserted: results.length, ids: results.map((r) => r.id) }, { status: 200 });
}
