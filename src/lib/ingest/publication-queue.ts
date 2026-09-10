import "server-only";
import { prisma } from "@/lib/prisma";

export interface ReadyPublicationResult {
  published: number;
  expired: number;
}

/**
 * Publishes the oldest valid imported opportunities, with closing-soon listings first.
 * READY acts as the durable future-day queue, so no additional scheduling column is needed.
 */
export async function publishReadyJobs(limit: number, now = new Date()): Promise<ReadyPublicationResult> {
  const expired = await prisma.job.updateMany({
    where: {
      status: "READY",
      rawJobId: { not: null },
      closesAt: { lt: now },
    },
    data: { status: "CLOSED" },
  });

  if (limit <= 0) return { published: 0, expired: expired.count };

  const queued = await prisma.job.findMany({
    where: {
      status: "READY",
      rawJob: { is: { active: true, needsAggregation: false } },
      OR: [{ closesAt: null }, { closesAt: { gte: now } }],
    },
    orderBy: [
      { closesAt: { sort: "asc", nulls: "last" } },
      { createdAt: "asc" },
    ],
    take: limit,
    select: { id: true, postedAt: true },
  });

  let published = 0;
  for (const job of queued) {
    const result = await prisma.job.updateMany({
      where: {
        id: job.id,
        status: "READY",
        OR: [{ closesAt: null }, { closesAt: { gte: now } }],
      },
      data: {
        status: "PUBLISHED",
        publishedAt: now,
        postedAt: job.postedAt ?? now,
      },
    });
    published += result.count;
  }

  return { published, expired: expired.count };
}
