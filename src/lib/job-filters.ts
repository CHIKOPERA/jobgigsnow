import type { Prisma } from "@/generated/prisma/client";
import type { JobListQuery } from "@/lib/validation/job";

export function buildJobWhere(query: Partial<JobListQuery>): Prisma.JobWhereInput {
  const { q, category, industry, province, location, remote, employmentType, salaryMin, tags, company, postedWithin } =
    query;

  const and: Prisma.JobWhereInput[] = [];
  if (q) {
    and.push({ OR: [
      { title: { contains: q, mode: "insensitive" } },
      { description: { contains: q, mode: "insensitive" } },
    ] });
  }
  if (salaryMin !== undefined && salaryMin > 0) {
    const amountCondition = (minimum: number): Prisma.JobWhereInput => ({
      OR: [{ salaryMax: { gte: minimum } }, { salaryMax: null, salaryMin: { gte: minimum } }],
    });
    and.push({
      salaryCurrency: "ZAR",
      OR: [
        { salaryPeriod: "HOURLY", ...amountCondition(Math.ceil(salaryMin / 173)) },
        { salaryPeriod: "DAILY", ...amountCondition(Math.ceil(salaryMin / 21.67)) },
        { salaryPeriod: "WEEKLY", ...amountCondition(Math.ceil(salaryMin / 4.33)) },
        { salaryPeriod: "MONTHLY", ...amountCondition(salaryMin) },
        { salaryPeriod: "YEARLY", ...amountCondition(salaryMin * 12) },
      ],
    });
  }

  return {
    status: "PUBLISHED",
    ...(category && { category }),
    ...(industry && { industry }),
    ...(province && { province }),
    ...(location && { location: { contains: location, mode: "insensitive" } }),
    ...(remote && { remoteType: remote }),
    ...(employmentType && { employmentType }),
    ...(and.length > 0 && { AND: and }),
    ...(tags && tags.length > 0 && { tags: { some: { tag: { name: { in: tags } } } } }),
    ...(company && { company: { slug: company } }),
    ...(postedWithin !== undefined && {
      postedAt: { gte: new Date(Date.now() - postedWithin * 86_400_000) },
    }),
  };
}
