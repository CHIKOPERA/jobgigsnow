import { z } from "zod";

export const updateSettingsSchema = z.object({
  seoRewritePrompt: z.string().trim().min(20).max(8_000),
});
export type UpdateSettingsInput = z.infer<typeof updateSettingsSchema>;
