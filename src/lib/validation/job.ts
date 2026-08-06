import { z } from "zod";
import { pagination } from "@/config/pagination";
import {
  employmentTypeSchema,
  jobStatusSchema,
  opportunityCategorySchema,
  remoteTypeSchema,
  salaryPeriodSchema,
} from "./common";

export const jobListQuerySchema = z.object({
  q: z.string().trim().min(1).max(200).optional(),
  category: opportunityCategorySchema.optional(),
  location: z.string().trim().min(1).max(200).optional(),
  remote: remoteTypeSchema.optional(),
  employmentType: employmentTypeSchema.optional(),
  salaryMin: z.coerce.number().int().nonnegative().optional(),
  tags: z
    .string()
    .transform((v) => v.split(",").map((t) => t.trim()).filter(Boolean))
    .optional(),
  company: z.string().trim().min(1).max(200).optional(),
  postedWithin: z.coerce.number().int().positive().max(365).optional(),
  cursor: z.string().optional(),
  limit: z.coerce.number().int().positive().max(pagination.jobsMaxPageSize).default(pagination.jobsPageSize),
});
export type JobListQuery = z.infer<typeof jobListQuerySchema>;

export const jobCardSchema = z.object({
  id: z.string(),
  slug: z.string(),
  title: z.string(),
  companyName: z.string(),
  companySlug: z.string(),
  category: opportunityCategorySchema,
  location: z.string(),
  remoteType: remoteTypeSchema,
  employmentType: employmentTypeSchema,
  salaryMin: z.number().nullable(),
  salaryMax: z.number().nullable(),
  salaryCurrency: z.string().nullable(),
  salaryPeriod: salaryPeriodSchema.nullable(),
  tags: z.array(z.string()),
  status: jobStatusSchema,
  isNew: z.boolean(),
  postedAt: z.iso.datetime().nullable(),
  closesAt: z.iso.datetime().nullable(),
});
export type JobCardDto = z.infer<typeof jobCardSchema>;

export const jobListResponseSchema = z.object({
  jobs: z.array(jobCardSchema),
  nextCursor: z.string().nullable(),
});
export type JobListResponse = z.infer<typeof jobListResponseSchema>;

export const jobDetailSchema = jobCardSchema.extend({
  description: z.string(),
  highlights: z.array(z.string()),
  applyUrl: z.string().nullable(),
  isNative: z.boolean(),
  companyDomain: z.string().nullable(),
});
export type JobDetailDto = z.infer<typeof jobDetailSchema>;
