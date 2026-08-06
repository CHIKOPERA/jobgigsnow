import { isAuthorizedIngestRequest } from "@/lib/ingest-auth";
import { prisma } from "@/lib/prisma";
import { errorResponse } from "@/lib/validation/common";
import { ingestJobsSchema, type JobUpsertInput } from "@/lib/validation/ingest";

function slugify(value: string) {
  return value
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)/g, "");
}

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

async function upsertJob(input: JobUpsertInput) {
  const company = await upsertCompany(input.companyName, input.companyDomain);
  const tagIds = await upsertTags(input.tags);

  return prisma.job.upsert({
    where: { slug: input.slug },
    create: {
      slug: input.slug,
      rawJobId: input.rawJobId ?? null,
      title: input.title,
      category: input.category,
      companyId: company.id,
      location: input.location,
      remoteType: input.remoteType,
      employmentType: input.employmentType,
      salaryMin: input.salaryMin ?? null,
      salaryMax: input.salaryMax ?? null,
      salaryCurrency: input.salaryCurrency ?? "USD",
      salaryPeriod: input.salaryPeriod ?? null,
      description: input.description,
      highlights: input.highlights,
      applyUrl: input.applyUrl ?? null,
      isNative: input.isNative,
      status: input.status,
      postedAt: input.postedAt ? new Date(input.postedAt) : null,
      closesAt: input.closesAt ? new Date(input.closesAt) : null,
      tags: { create: tagIds.map((tagId) => ({ tagId })) },
    },
    update: {
      title: input.title,
      category: input.category,
      companyId: company.id,
      location: input.location,
      remoteType: input.remoteType,
      employmentType: input.employmentType,
      salaryMin: input.salaryMin ?? null,
      salaryMax: input.salaryMax ?? null,
      salaryCurrency: input.salaryCurrency ?? "USD",
      salaryPeriod: input.salaryPeriod ?? null,
      description: input.description,
      highlights: input.highlights,
      applyUrl: input.applyUrl ?? null,
      isNative: input.isNative,
      status: input.status,
      postedAt: input.postedAt ? new Date(input.postedAt) : null,
      closesAt: input.closesAt ? new Date(input.closesAt) : null,
      tags: {
        deleteMany: {},
        create: tagIds.map((tagId) => ({ tagId })),
      },
    },
    select: { id: true, slug: true, status: true },
  });
}

export async function POST(request: Request) {
  if (!isAuthorizedIngestRequest(request)) {
    return errorResponse("UNAUTHORIZED", "Missing or invalid bearer token.", 401);
  }

  const json = await request.json().catch(() => null);
  const parsed = ingestJobsSchema.safeParse(json);
  if (!parsed.success) {
    return errorResponse("INVALID_BODY", parsed.error.issues[0]?.message ?? "Invalid body.", 400);
  }

  const results = [];
  for (const job of parsed.data.jobs) {
    results.push(await upsertJob(job));
  }

  return Response.json({ upserted: results.length, jobs: results }, { status: 200 });
}
