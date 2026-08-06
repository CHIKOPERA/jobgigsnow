import { z } from "zod";

/**
 * Shape of Source.crawlConfig — owned entirely by the ingestion pipeline (discovery.ts /
 * extractors/selectors.ts read it), not enforced by the DB (it's stored as Json). Validating it
 * here just gives the admin "New Source" form useful errors instead of a silent bad crawl later.
 */
const detailSelectorsSchema = z
  .object({
    title: z.string().min(1).optional(),
    company: z.string().min(1).optional(),
    location: z.string().min(1).optional(),
    description: z.string().min(1).optional(),
    applyUrl: z.string().min(1).optional(),
    postedAt: z.string().min(1).optional(),
    salary: z.string().min(1).optional(),
  })
  .optional();

const htmlCrawlConfigSchema = z.object({
  // Optional/defaulted for backward compatibility with sources created before providers existed.
  provider: z.literal("html").default("html"),
  // One or more listing pages to discover job-detail links from.
  listingUrls: z.array(z.string().min(1)).min(1),
  // CSS selector (cheerio) matching each job-detail link on a listing page.
  linkSelector: z.string().min(1),
  // Attribute the detail URL is read from — usually "href".
  linkAttr: z.string().min(1).default("href"),
  // Some older career sites put a detail URL inside an onclick/data attribute. When present,
  // the first capture group is used as the URL (or the whole match when there is no group).
  linkRegex: z.string().min(1).optional(),
  // Optional "next page" link selector + a hard cap, so a bad selector can't paginate forever.
  pagination: z
    .object({
      nextPageSelector: z.string().min(1),
      maxPages: z.number().int().positive().max(50).default(10),
    })
    .optional(),
  detailSelectors: detailSelectorsSchema,
});

const smartRecruitersCrawlConfigSchema = z.object({
  provider: z.literal("smartrecruiters"),
  companyIdentifier: z.string().min(1),
  pageSize: z.number().int().positive().max(100).default(100),
  maxPages: z.number().int().positive().max(50).default(10),
  detailSelectors: detailSelectorsSchema,
});

const workdayCrawlConfigSchema = z.object({
  provider: z.literal("workday"),
  host: z.string().min(1),
  tenant: z.string().min(1),
  site: z.string().min(1),
  pageSize: z.number().int().positive().max(100).default(100),
  maxPages: z.number().int().positive().max(50).default(10),
  detailSelectors: detailSelectorsSchema,
});

const oracleCrawlConfigSchema = z.object({
  provider: z.literal("oracle"),
  host: z.string().min(1),
  siteNumber: z.string().min(1),
  companyName: z.string().min(1),
  language: z.string().min(1).default("en"),
  pageSize: z.number().int().positive().max(100).default(100),
  maxPages: z.number().int().positive().max(50).default(10),
  detailSelectors: detailSelectorsSchema,
});

const cornerstoneCrawlConfigSchema = z.object({
  provider: z.literal("cornerstone"),
  host: z.string().min(1),
  corp: z.string().min(1),
  siteId: z.string().min(1),
  companyName: z.string().min(1),
  pageSize: z.number().int().positive().max(100).default(100),
  maxPages: z.number().int().positive().max(50).default(10),
  detailSelectors: detailSelectorsSchema,
});

// Source-specific selectors are the "selectors" tier in the extraction preference order
// (JSON-LD > selectors > general HTML > Readability/Markdown > AI inference).
export const crawlConfigSchema = z.union([
  workdayCrawlConfigSchema,
  oracleCrawlConfigSchema,
  cornerstoneCrawlConfigSchema,
  smartRecruitersCrawlConfigSchema,
  htmlCrawlConfigSchema,
]);
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
