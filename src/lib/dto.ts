import "server-only";
import type { Prisma } from "@/generated/prisma/client";
import { filters } from "@/config/filters";
import type { JobCardDto, JobDetailDto } from "./validation/job";

export const jobCardSelect = {
  id: true,
  slug: true,
  title: true,
  category: true,
  location: true,
  remoteType: true,
  employmentType: true,
  salaryMin: true,
  salaryMax: true,
  salaryCurrency: true,
  salaryPeriod: true,
  status: true,
  postedAt: true,
  closesAt: true,
  company: { select: { name: true, slug: true } },
  tags: { select: { tag: { select: { name: true } } } },
} satisfies Prisma.JobSelect;

export type JobCardRow = Prisma.JobGetPayload<{ select: typeof jobCardSelect }>;

export const jobDetailSelect = {
  ...jobCardSelect,
  description: true,
  highlights: true,
  applyUrl: true,
  isNative: true,
  company: { select: { name: true, slug: true, domain: true } },
} satisfies Prisma.JobSelect;

export type JobDetailRow = Prisma.JobGetPayload<{ select: typeof jobDetailSelect }>;

function isNew(postedAt: Date | null) {
  if (!postedAt) return false;
  const hoursSincePosted = (Date.now() - postedAt.getTime()) / (1000 * 60 * 60);
  return hoursSincePosted <= filters.newThresholdHours;
}

export function toJobCard(row: JobCardRow): JobCardDto {
  return {
    id: row.id,
    slug: row.slug,
    title: row.title,
    category: row.category,
    companyName: row.company.name,
    companySlug: row.company.slug,
    location: row.location,
    remoteType: row.remoteType,
    employmentType: row.employmentType,
    salaryMin: row.salaryMin,
    salaryMax: row.salaryMax,
    salaryCurrency: row.salaryCurrency,
    salaryPeriod: row.salaryPeriod,
    tags: row.tags.map((t) => t.tag.name),
    status: row.status,
    isNew: isNew(row.postedAt),
    postedAt: row.postedAt?.toISOString() ?? null,
    closesAt: row.closesAt?.toISOString() ?? null,
  };
}

export function toJobDetail(row: JobDetailRow): JobDetailDto {
  return {
    ...toJobCard(row),
    description: row.description,
    highlights: row.highlights,
    applyUrl: row.applyUrl,
    isNative: row.isNative,
    companyDomain: row.company.domain,
  };
}
