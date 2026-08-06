import { z } from "zod";

export const remoteTypeSchema = z.enum(["ONSITE", "HYBRID", "REMOTE"]);
export const employmentTypeSchema = z.enum([
  "FULL_TIME",
  "PART_TIME",
  "CONTRACT",
  "INTERNSHIP",
  "TEMPORARY",
]);
export const salaryPeriodSchema = z.enum(["HOURLY", "DAILY", "WEEKLY", "MONTHLY", "YEARLY"]);
export const jobStatusSchema = z.enum([
  "DISCOVERED",
  "IMPROVING",
  "READY",
  "PUBLISHED",
  "CLOSED",
  "ARCHIVED",
  "REJECTED",
]);
export const opportunityCategorySchema = z.enum([
  "JOB",
  "INTERNSHIP",
  "LEARNERSHIP",
  "APPRENTICESHIP",
  "GRADUATE_PROGRAMME",
  "CALL_FOR_APPLICATIONS",
  "FUNDING",
]);
export const contentCategorySchema = z.enum(["HOW_TO", "CAREER_DEVELOPMENT"]);

export const apiErrorSchema = z.object({
  error: z.object({
    code: z.string(),
    message: z.string(),
  }),
});
export type ApiError = z.infer<typeof apiErrorSchema>;

export function errorResponse(code: string, message: string, status: number) {
  return Response.json({ error: { code, message } } satisfies ApiError, { status });
}
