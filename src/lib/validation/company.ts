import { z } from "zod";
import { jobCardSchema } from "./job";

export const companyDetailSchema = z.object({
  name: z.string(),
  slug: z.string(),
  domain: z.string().nullable(),
  logoUrl: z.string().nullable(),
  jobs: z.array(jobCardSchema),
});
export type CompanyDetailDto = z.infer<typeof companyDetailSchema>;
