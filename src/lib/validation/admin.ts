import { z } from "zod";
import { pagination } from "@/config/pagination";

const cursorAndLimit = {
  cursor: z.string().optional(),
  limit: z.coerce.number().int().positive().max(pagination.adminMaxPageSize).default(pagination.adminPageSize),
};

export const ingestRunStatusSchema = z.enum(["RUNNING", "COMPLETED", "FAILED"]);
export const ingestFailureStageSchema = z.enum([
  "DISCOVERY",
  "ACQUISITION",
  "EXTRACTION",
  "AGGREGATION",
  "VALIDATION",
  "PERSISTENCE",
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
  ...cursorAndLimit,
});
export type ListFailuresQuery = z.infer<typeof listFailuresQuerySchema>;
