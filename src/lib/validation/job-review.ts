import { z } from "zod";
import { applicationGuidanceSchema, EMPTY_APPLICATION_GUIDANCE } from "@/lib/application-guidance";
import { employmentTypeSchema, jobIndustrySchema, opportunityCategorySchema, provinceSchema, remoteTypeSchema, salaryPeriodSchema } from "./common";

const nullableUrl = z.union([z.url(), z.literal("")]).transform((value) => value || null);
const nullableDate = z
  .union([z.iso.date(), z.iso.datetime(), z.literal(""), z.null()])
  .transform((value) => value || null);

export const jobReviewPatchSchema = z
  .object({
    title: z.string().trim().min(2).max(200).optional(),
    companyName: z.string().trim().min(1).max(160).optional(),
    category: opportunityCategorySchema.optional(),
    industry: jobIndustrySchema.optional(),
    location: z.string().trim().min(1).max(240).optional(),
    province: provinceSchema.optional(),
    remoteType: remoteTypeSchema.optional(),
    employmentType: employmentTypeSchema.optional(),
    salaryMin: z.number().int().nonnegative().nullable().optional(),
    salaryMax: z.number().int().nonnegative().nullable().optional(),
    salaryPeriod: salaryPeriodSchema.nullable().optional(),
    closesAt: nullableDate.optional(),
    description: z.string().min(1).max(200_000).optional(),
    applicationGuidance: applicationGuidanceSchema.optional(),
    highlights: z.array(z.string().trim().min(1).max(300)).max(20).optional(),
    applyUrl: nullableUrl.optional(),
    rewritePrompt: z.string().trim().max(4_000).nullable().optional(),
    status: z.enum(["READY", "PUBLISHED", "REJECTED"]).optional(),
  })
  .refine((body) => Object.keys(body).length > 0, "At least one field must be updated.");

export const rewriteJobSchema = z.object({
  prompt: z.string().trim().min(3).max(4_000),
  description: z.string().min(1).max(200_000),
});

export const manualJobCreateSchema = z.object({
  title: z.string().trim().min(2).max(200),
  companyName: z.string().trim().min(1).max(160),
  category: opportunityCategorySchema,
  industry: jobIndustrySchema,
  location: z.string().trim().min(1).max(240),
  province: provinceSchema,
  remoteType: remoteTypeSchema,
  employmentType: employmentTypeSchema,
  salaryMin: z.number().int().nonnegative().nullable().default(null),
  salaryMax: z.number().int().nonnegative().nullable().default(null),
  salaryPeriod: salaryPeriodSchema.nullable().default(null),
  closesAt: nullableDate.default(null),
  description: z.string().trim().min(1).max(200_000),
  applicationGuidance: applicationGuidanceSchema.default(EMPTY_APPLICATION_GUIDANCE),
  highlights: z.array(z.string().trim().min(1).max(300)).max(20).default([]),
  applyUrl: nullableUrl,
});
