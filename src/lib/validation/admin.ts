import { z } from "zod";
import { pagination } from "@/config/pagination";

const cursorAndLimit = {
  cursor: z.string().optional(),
  limit: z.coerce.number().int().positive().max(pagination.adminMaxPageSize).default(pagination.adminPageSize),
};

export const ingestRunStatusSchema = z.enum(["RUNNING", "PAUSED", "COMPLETED", "FAILED", "CANCELLED"]);
export const ingestFailureStatusSchema = z.enum(["OPEN", "RETRYING", "RESOLVED", "DISMISSED"]);
export const ingestFailureStageSchema = z.enum([
  "DISCOVERY",
  "ACQUISITION",
  "EXTRACTION",
  "AGGREGATION",
  "VALIDATION",
  "PERSISTENCE",
  "SEO_REWRITE",
]);

export const listRunsQuerySchema = z.object({
  sourceId: z.string().min(1).optional(),
  status: ingestRunStatusSchema.optional(),
  ...cursorAndLimit,
});
export type ListRunsQuery = z.infer<typeof listRunsQuerySchema>;

export const listFailuresQuerySchema = z.object({
  sourceId: z.string().min(1).optional(),
  stage: ingestFailureStageSchema.optional(),
  status: ingestFailureStatusSchema.optional(),
  ...cursorAndLimit,
});
export type ListFailuresQuery = z.infer<typeof listFailuresQuerySchema>;

const selectedIds = z.array(z.string().min(1)).min(1).max(100);

export const bulkJobActionSchema = z.object({
  ids: selectedIds,
  action: z.enum(["PUBLISH", "ARCHIVE", "CLOSE", "REJECT"]),
});

export const bulkIssueActionSchema = z.object({
  ids: selectedIds,
  action: z.enum(["RETRY", "DISMISS", "RESOLVE"]),
});

export const bulkSourceActionSchema = z.object({
  ids: selectedIds,
  action: z.enum(["PAUSE", "RESUME"]),
});
