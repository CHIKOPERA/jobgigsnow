import { z } from "zod";
import { employmentTypeSchema, opportunityCategorySchema, remoteTypeSchema } from "./common";

const nullableUrl = z.union([z.url(), z.literal("")]).transform((value) => value || null);

export const jobReviewPatchSchema = z
  .object({
    title: z.string().trim().min(2).max(200).optional(),
    companyName: z.string().trim().min(1).max(160).optional(),
    category: opportunityCategorySchema.optional(),
    location: z.string().trim().min(1).max(240).optional(),
    remoteType: remoteTypeSchema.optional(),
    employmentType: employmentTypeSchema.optional(),
    description: z.string().min(1).max(200_000).optional(),
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
