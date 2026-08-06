import { z } from "zod";

/**
 * Shape of Source.crawlConfig — owned entirely by the ingestion pipeline (discovery.ts /
 * extractors/selectors.ts read it), not enforced by the DB (it's stored as Json). Validating it
 * here just gives the admin "New Source" form useful errors instead of a silent bad crawl later.
 */
export const crawlConfigSchema = z.object({
  // One or more listing pages to discover job-detail links from.
  listingUrls: z.array(z.string().min(1)).min(1),
  // CSS selector (cheerio) matching each job-detail link on a listing page.
  linkSelector: z.string().min(1),
  // Attribute the detail URL is read from — usually "href".
  linkAttr: z.string().min(1).default("href"),
  // Optional "next page" link selector + a hard cap, so a bad selector can't paginate forever.
  pagination: z
    .object({
      nextPageSelector: z.string().min(1),
      maxPages: z.number().int().positive().max(50).default(10),
    })
    .optional(),
  // Source-specific CSS selectors for the detail page — the "selectors" tier in the extraction
  // preference order (JSON-LD > selectors > general HTML > Readability/Markdown > AI inference).
  detailSelectors: z
    .object({
      title: z.string().min(1).optional(),
      company: z.string().min(1).optional(),
      location: z.string().min(1).optional(),
      description: z.string().min(1).optional(),
      applyUrl: z.string().min(1).optional(),
      postedAt: z.string().min(1).optional(),
      salary: z.string().min(1).optional(),
    })
    .optional(),
});
export type CrawlConfig = z.infer<typeof crawlConfigSchema>;

export const createSourceSchema = z.object({
  name: z.string().min(1),
  baseUrl: z.string().min(1),
  crawlConfig: crawlConfigSchema,
  cadenceMinutes: z.number().int().positive().optional(),
  enabled: z.boolean().optional(),
});
export type CreateSourceInput = z.infer<typeof createSourceSchema>;

export const updateSourceSchema = z.object({
  name: z.string().min(1).optional(),
  baseUrl: z.string().min(1).optional(),
  crawlConfig: crawlConfigSchema.optional(),
  cadenceMinutes: z.number().int().positive().optional(),
  enabled: z.boolean().optional(),
});
export type UpdateSourceInput = z.infer<typeof updateSourceSchema>;

export const listSourcesQuerySchema = z.object({
  enabled: z
    .enum(["true", "false"])
    .optional()
    .transform((v) => (v === undefined ? undefined : v === "true")),
});
