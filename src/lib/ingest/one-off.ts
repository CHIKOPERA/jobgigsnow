import "server-only";
import type { Prisma } from "@/generated/prisma/client";
import { prisma } from "@/lib/prisma";

const ONE_OFF_SOURCE_NAME = "One-off URLs";

async function getOneOffSource() {
  const existing = await prisma.source.findFirst({
    where: { name: ONE_OFF_SOURCE_NAME },
    orderBy: { createdAt: "asc" },
    select: { id: true },
  });
  if (existing) return existing;

  const crawlConfig = {
    provider: "html",
    listingUrls: ["https://one-off.jobgigsnow.invalid/"],
    linkSelector: "a",
    linkAttr: "href",
  } satisfies Prisma.InputJsonObject;

  return prisma.source.create({
    data: {
      name: ONE_OFF_SOURCE_NAME,
      baseUrl: "https://one-off.jobgigsnow.invalid/",
      crawlConfig,
      cadenceMinutes: 525_600,
      enabled: false,
    },
    select: { id: true },
  });
}

export async function queueOneOffUrl(url: string) {
  const source = await getOneOffSource();
  const existing = await prisma.rawJob.findUnique({
    where: { sourceId_externalId: { sourceId: source.id, externalId: url } },
    select: { id: true },
  });

  return prisma.$transaction(async (tx) => {
    const run = await tx.ingestRun.create({
      data: { sourceId: source.id, discoveredCount: 1, newCount: existing ? 0 : 1 },
      select: { id: true },
    });

    const rawJob = await tx.rawJob.upsert({
      where: { sourceId_externalId: { sourceId: source.id, externalId: url } },
      create: {
        sourceId: source.id,
        externalId: url,
        externalUrl: url,
        payload: {},
        contentHash: "",
        fetchStatus: "PENDING",
        lastSeenAt: new Date(),
        ingestRunId: run.id,
      },
      update: {
        externalUrl: url,
        payload: {},
        contentHash: "",
        fetchStatus: "PENDING",
        needsAggregation: true,
        aggregationClaimedAt: null,
        active: true,
        lastSeenAt: new Date(),
        ingestRunId: run.id,
      },
      select: { id: true },
    });

    return { ingestRunId: run.id, rawJobId: rawJob.id };
  });
}
