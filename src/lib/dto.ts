import "server-only";
import type { Prisma } from "@/generated/prisma/client";
import { filters } from "@/config/filters";
import type { JobCardDto, JobDetailDto } from "./validation/job";
import { plainTextDescription } from "./job-seo";
import { cleanApplicationGuidance, hasApplicationGuidance } from "./application-guidance";

export const jobCardSelect = {
  id: true,
  slug: true,
  title: true,
  category: true,
  industry: true,
  location: true,
  province: true,
  remoteType: true,
  employmentType: true,
  salaryMin: true,
  salaryMax: true,
  salaryCurrency: true,
  salaryPeriod: true,
  status: true,
  postedAt: true,
  closesAt: true,
  description: true,
  socialImageUrl: true,
  socialImageAlt: true,
  company: { select: { name: true, slug: true } },
  tags: { select: { tag: { select: { name: true } } } },
} satisfies Prisma.JobSelect;

export type JobCardRow = Prisma.JobGetPayload<{ select: typeof jobCardSelect }>;

export const jobDetailSelect = {
  ...jobCardSelect,
  description: true,
  applicationSummary: true,
  essentialRequirements: true,
  preferredRequirements: true,
  requiredQualifications: true,
  requiredExperience: true,
  documentsToPrepare: true,
  licenceRequirements: true,
  applicationMethod: true,
  referenceNumber: true,
  estimatedApplicationMinutes: true,
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
  const description = plainTextDescription(row.description);
  return {
    id: row.id,
    slug: row.slug,
    title: row.title,
    category: row.category,
    industry: row.industry,
    companyName: row.company.name,
    companySlug: row.company.slug,
    location: row.location,
    province: row.province,
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
    summary: description.length > 190 ? `${description.slice(0, 187).trimEnd()}…` : description,
    imageUrl: row.socialImageUrl,
    imageAlt: row.socialImageAlt,
  };
}

export function toJobDetail(row: JobDetailRow): JobDetailDto {
  const applicationGuidance = cleanApplicationGuidance({
    summary: row.applicationSummary ?? "",
    essentialRequirements: row.essentialRequirements,
    preferredRequirements: row.preferredRequirements,
    qualifications: row.requiredQualifications,
    experience: row.requiredExperience,
    documents: row.documentsToPrepare,
    licences: row.licenceRequirements,
    applicationMethod: row.applicationMethod ?? "",
    referenceNumber: row.referenceNumber ?? "",
    estimatedApplicationMinutes: row.estimatedApplicationMinutes ?? 0,
  });
  return {
    ...toJobCard(row),
    description: row.description,
    applicationGuidance: hasApplicationGuidance(applicationGuidance) ? applicationGuidance : null,
    highlights: row.highlights,
    applyUrl: row.applyUrl,
    isNative: row.isNative,
    companyDomain: row.company.domain,
  };
}
