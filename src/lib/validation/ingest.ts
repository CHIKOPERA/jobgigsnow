import { z } from "zod";
import { ingest } from "@/config/ingest";
import {
  employmentTypeSchema,
  jobStatusSchema,
  opportunityCategorySchema,
  remoteTypeSchema,
  salaryPeriodSchema,
} from "./common";

export const rawJobInputSchema = z.object({
  externalId: z.string().min(1),
  externalUrl: z.string().min(1),
  rawTitle: z.string().nullable().optional(),
  rawCompany: z.string().nullable().optional(),
  rawLocation: z.string().nullable().optional(),
  payload: z.record(z.string(), z.unknown()),
  contentHash: z.string().min(1),
  fetchStatus: z.enum(["PENDING", "FETCHED", "FAILED"]).default("FETCHED"),
});

export type RawJobInput = z.infer<typeof rawJobInputSchema>;

export const ingestRawJobsSchema = z.object({
  sourceId: z.string().min(1),
  jobs: z.array(rawJobInputSchema).min(1).max(ingest.rawJobsBatchMax),
});
export type IngestRawJobsBody = z.infer<typeof ingestRawJobsSchema>;

export const jobUpsertInputSchema = z.object({
  slug: z.string().min(1),
  rawJobId: z.string().min(1).nullable().optional(),
  title: z.string().min(1),
  category: opportunityCategorySchema.default("JOB"),
  companyName: z.string().min(1),
  companyDomain: z.string().nullable().optional(),
  location: z.string().min(1),
  remoteType: remoteTypeSchema,
  employmentType: employmentTypeSchema,
  salaryMin: z.number().int().nonnegative().nullable().optional(),
  salaryMax: z.number().int().nonnegative().nullable().optional(),
  salaryCurrency: z.string().nullable().optional(),
  salaryPeriod: salaryPeriodSchema.nullable().optional(),
  description: z.string().min(1),
  highlights: z.array(z.string()).default([]),
  tags: z.array(z.string()).default([]),
  applyUrl: z.string().nullable().optional(),
  /// The SEO rewrite template that produced this title/description, if the automatic post-
  /// aggregation SEO rewrite stage ran — shown back to the reviewer in /admin/review so
  /// "Rewrite with AI" there re-applies (or lets them tweak) the same prompt.
  rewritePrompt: z.string().nullable().optional(),
  isNative: z.boolean().default(false),
  status: jobStatusSchema,
  postedAt: z.iso.datetime().nullable().optional(),
  closesAt: z.iso.datetime().nullable().optional(),
});
export type JobUpsertInput = z.infer<typeof jobUpsertInputSchema>;

export const ingestJobsSchema = z.object({
  jobs: z.array(jobUpsertInputSchema).min(1).max(ingest.jobsBatchMax),
});
export type IngestJobsBody = z.infer<typeof ingestJobsSchema>;

export const ingestQueueQuerySchema = z.object({
  stage: z.enum(["improving", "posting"]),
  limit: z.coerce.number().int().positive().max(ingest.queueClaimMax).default(ingest.queueClaimMax),
});
export type IngestQueueQuery = z.infer<typeof ingestQueueQuerySchema>;
