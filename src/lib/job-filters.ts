import type { Prisma } from "@/generated/prisma/client";
import type { JobListQuery } from "@/lib/validation/job";

export function buildJobWhere(query: Partial<JobListQuery>): Prisma.JobWhereInput {
  const { q, category, location, remote, employmentType, salaryMin, tags, company, postedWithin } =
    query;

  return {
    status: "PUBLISHED",
    ...(category && { category }),
    ...(q && {
      OR: [
        { title: { contains: q, mode: "insensitive" } },
        { description: { contains: q, mode: "insensitive" } },
      ],
    }),
    ...(location && { location: { contains: location, mode: "insensitive" } }),
    ...(remote && { remoteType: remote }),
    ...(employmentType && { employmentType }),
    ...(salaryMin !== undefined && {
      OR: [{ salaryMax: { gte: salaryMin } }, { salaryMax: null, salaryMin: { gte: salaryMin } }],
    }),
    ...(tags && tags.length > 0 && { tags: { some: { tag: { name: { in: tags } } } } }),
    ...(company && { company: { slug: company } }),
    ...(postedWithin !== undefined && {
      postedAt: { gte: new Date(Date.now() - postedWithin * 86_400_000) },
    }),
  };
}
