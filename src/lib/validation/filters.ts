import { z } from "zod";

const facetSchema = z.object({
  value: z.string(),
  label: z.string(),
  count: z.number().int().nonnegative(),
});

export const filterFacetsSchema = z.object({
  industries: z.array(facetSchema),
  provinces: z.array(facetSchema),
  remoteTypes: z.array(facetSchema),
  employmentTypes: z.array(facetSchema),
  tags: z.array(facetSchema),
});
export type FilterFacetsDto = z.infer<typeof filterFacetsSchema>;
