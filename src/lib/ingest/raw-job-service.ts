import "server-only";
import type { Prisma } from "@/generated/prisma/client";
import { prisma } from "@/lib/prisma";
import type { RawJobInput } from "@/lib/validation/ingest";

export async function upsertRawJobsForSource(sourceId: string, jobs: RawJobInput[]) {
  return prisma.$transaction(
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
}
