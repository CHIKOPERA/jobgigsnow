import { z } from "zod";

export const saveJobBodySchema = z.object({
  jobId: z.string().min(1),
});
export type SaveJobBody = z.infer<typeof saveJobBodySchema>;

export const savedSearchQuerySchema = z.object({
  q: z.string().optional(),
  location: z.string().optional(),
  remote: z.string().optional(),
  employmentType: z.string().optional(),
  salaryMin: z.number().optional(),
  tags: z.array(z.string()).optional(),
  company: z.string().optional(),
  postedWithin: z.number().optional(),
});

export const createSavedSearchSchema = z.object({
  name: z.string().trim().min(1).max(100),
  query: savedSearchQuerySchema,
});
export type CreateSavedSearchBody = z.infer<typeof createSavedSearchSchema>;

export const alertFrequencySchema = z.enum(["INSTANT", "DAILY", "WEEKLY"]);

export const createAlertSchema = z.object({
  savedSearchId: z.string().min(1).nullable().optional(),
  frequency: alertFrequencySchema.default("DAILY"),
  enabled: z.boolean().default(true),
});
export type CreateAlertBody = z.infer<typeof createAlertSchema>;

export const updateAlertSchema = createAlertSchema.partial();
export type UpdateAlertBody = z.infer<typeof updateAlertSchema>;
