import "server-only";
import { prisma } from "@/lib/prisma";
import { slugify } from "@/lib/slug";
import type { JobUpsertInput } from "@/lib/validation/ingest";
import { buildNormalizedFields } from "./normalize-fields";
import { aggregatedJobStatus } from "./review-policy";
import type { AggregationResult } from "./types";

export type NormalizeResult = { ok: true; input: JobUpsertInput } | { ok: false; missingFields: string[] };

/**
 * Reuses the slug already linked to this RawJob's Job when one exists — without this, a minor
 * AI-reconciled title change on re-aggregation would generate a different slug and create a
 * duplicate Job instead of updating in place (Section F, point 6 of the plan).
 */
async function resolveSlug(rawJobId: string, title: string, companyName: string): Promise<string> {
  const existingJob = await prisma.job.findUnique({ where: { rawJobId }, select: { slug: true } });
  if (existingJob) return existingJob.slug;

  const base = slugify(`${title}-${companyName}`);
  let candidate = base;
  let attempt = 1;
  while (await prisma.job.findUnique({ where: { slug: candidate }, select: { id: true } })) {
    attempt += 1;
    candidate = `${base}-${attempt}`;
  }
  return candidate;
}

export async function normalize(
  aggregation: AggregationResult,
  rawJobId: string,
  externalUrl: string,
): Promise<NormalizeResult> {
  const built = buildNormalizedFields(aggregation, externalUrl);
  if (!built.ok) return built;

  const slug = await resolveSlug(rawJobId, built.fields.title, built.fields.companyName);

  return {
    ok: true,
    input: {
      slug,
      rawJobId,
      category: "JOB",
      highlights: [],
      ...built.fields,
      isNative: false,
      status: aggregatedJobStatus,
    },
  };
}
