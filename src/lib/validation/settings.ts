import { z } from "zod";

export const updateSettingsSchema = z.object({
  seoRewritePrompt: z.string().trim().min(20).max(8_000),
});
export type UpdateSettingsInput = z.infer<typeof updateSettingsSchema>;

export const updateAgentSettingsSchema = z.object({
  agentEnabled: z.boolean(),
  dailyViewGoal: z.number().int().min(1).max(1_000_000),
  dailyPublishMin: z.number().int().min(1).max(100),
  dailyPublishMax: z.number().int().min(1).max(100),
  categoryMinimum: z.number().int().min(1).max(100),
}).refine((value) => value.dailyPublishMax >= value.dailyPublishMin, {
  message: "Daily maximum must be greater than or equal to the minimum.",
  path: ["dailyPublishMax"],
});
