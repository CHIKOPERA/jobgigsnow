import "server-only";
import { prisma } from "@/lib/prisma";
import { slugify } from "@/lib/slug";
import type { JobUpsertInput } from "@/lib/validation/ingest";

async function upsertCompany(name: string, domain: string | null | undefined) {
  const slug = slugify(name);
  return prisma.company.upsert({
    where: { slug },
    update: { domain: domain ?? undefined },
    create: { name, slug, domain: domain ?? null },
    select: { id: true },
  });
}

async function upsertTags(names: string[]) {
  const tags = await Promise.all(
    names.map((name) => {
      const slug = slugify(name);
      return prisma.tag.upsert({
        where: { slug },
        update: {},
        create: { name, slug },
        select: { id: true },
      });
    }),
  );
  return tags.map((t) => t.id);
}

export async function upsertJob(input: JobUpsertInput) {
  const company = await upsertCompany(input.companyName, input.companyDomain);
  const tagIds = await upsertTags(input.tags);
  const existing = await prisma.job.findUnique({
    where: { slug: input.slug },
    select: { status: true },
  });

  return prisma.job.upsert({
    where: { slug: input.slug },
    create: {
      slug: input.slug,
      rawJobId: input.rawJobId ?? null,
      title: input.title,
      category: input.category,
      industry: input.industry,
      companyId: company.id,
      location: input.location,
      province: input.province,
      remoteType: input.remoteType,
      employmentType: input.employmentType,
      salaryMin: input.salaryMin ?? null,
      salaryMax: input.salaryMax ?? null,
      salaryCurrency: input.salaryMin === null || input.salaryMin === undefined ? null : "ZAR",
      salaryPeriod: input.salaryPeriod ?? null,
      description: input.description,
      highlights: input.highlights,
      applyUrl: input.applyUrl ?? null,
      rewritePrompt: input.rewritePrompt ?? null,
      isNative: input.isNative,
      status: input.status,
      postedAt: input.postedAt ? new Date(input.postedAt) : null,
      closesAt: input.closesAt ? new Date(input.closesAt) : null,
      tags: { create: tagIds.map((tagId) => ({ tagId })) },
    },
    update: {
      title: input.title,
      category: input.category,
      industry: input.industry,
      companyId: company.id,
      location: input.location,
      province: input.province,
      remoteType: input.remoteType,
      employmentType: input.employmentType,
      salaryMin: input.salaryMin ?? null,
      salaryMax: input.salaryMax ?? null,
      salaryCurrency: input.salaryMin === null || input.salaryMin === undefined ? null : "ZAR",
      salaryPeriod: input.salaryPeriod ?? null,
      description: input.description,
      highlights: input.highlights,
      applyUrl: input.applyUrl ?? null,
      rewritePrompt: input.rewritePrompt ?? null,
      isNative: input.isNative,
      // A recrawl may update an already-live opportunity after today's publication quota has
      // been filled. Keep it live instead of briefly moving it back into the READY queue.
      status: existing?.status === "PUBLISHED" ? "PUBLISHED" : input.status,
      postedAt: input.postedAt ? new Date(input.postedAt) : null,
      closesAt: input.closesAt ? new Date(input.closesAt) : null,
      tags: {
        deleteMany: {},
        create: tagIds.map((tagId) => ({ tagId })),
      },
    },
    select: { id: true, slug: true, status: true, publishedAt: true },
  });
}

export async function upsertJobs(jobs: JobUpsertInput[]) {
  const results = [];
  for (const job of jobs) {
    results.push(await upsertJob(job));
  }
  return results;
}
