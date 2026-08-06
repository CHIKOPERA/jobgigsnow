import "server-only";
import type { Prisma } from "@/generated/prisma/client";
import { prisma } from "@/lib/prisma";
import type { CreateSourceInput, UpdateSourceInput } from "@/lib/validation/source";
import { sources as sourcesConfig } from "@/config/sources";

const sourceListSelect = {
  id: true,
  name: true,
  baseUrl: true,
  cadenceMinutes: true,
  enabled: true,
  lastRunAt: true,
  createdAt: true,
  updatedAt: true,
} satisfies Prisma.SourceSelect;

export async function listSources(enabled?: boolean) {
  return prisma.source.findMany({
    where: enabled === undefined ? undefined : { enabled },
    orderBy: { name: "asc" },
    select: sourceListSelect,
  });
}

export async function createSource(input: CreateSourceInput) {
  return prisma.source.create({
    data: {
      name: input.name,
      baseUrl: input.baseUrl,
      crawlConfig: input.crawlConfig as Prisma.InputJsonValue,
      cadenceMinutes: input.cadenceMinutes ?? sourcesConfig.defaultCrawlCadenceMinutes,
      enabled: input.enabled ?? true,
    },
    select: sourceListSelect,
  });
}

export async function getSource(id: string) {
  return prisma.source.findUnique({
    where: { id },
    select: {
      ...sourceListSelect,
      crawlConfig: true,
    },
  });
}

export async function updateSource(id: string, input: UpdateSourceInput) {
  return prisma.source.update({
    where: { id },
    data: {
      ...(input.name !== undefined && { name: input.name }),
      ...(input.baseUrl !== undefined && { baseUrl: input.baseUrl }),
      ...(input.crawlConfig !== undefined && { crawlConfig: input.crawlConfig as Prisma.InputJsonValue }),
      ...(input.cadenceMinutes !== undefined && { cadenceMinutes: input.cadenceMinutes }),
      ...(input.enabled !== undefined && { enabled: input.enabled }),
    },
    select: sourceListSelect,
  });
}

export type DeleteSourceOutcome = "deleted" | "not_found" | "run_in_progress";

export async function deleteSource(id: string): Promise<DeleteSourceOutcome> {
  const source = await prisma.source.findUnique({
    where: { id },
    select: { id: true, ingestRuns: { where: { status: "RUNNING" }, take: 1, select: { id: true } } },
  });
  if (!source) return "not_found";
  if (source.ingestRuns.length > 0) return "run_in_progress";

  await prisma.source.delete({ where: { id } });
  return "deleted";
}
