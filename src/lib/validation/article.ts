import { z } from "zod";
import { pagination } from "@/config/pagination";
import { contentCategorySchema } from "./common";

export const articleListQuerySchema = z.object({
  category: contentCategorySchema.optional(),
  cursor: z.string().optional(),
  limit: z.coerce.number().int().positive().max(pagination.jobsMaxPageSize).default(pagination.jobsPageSize),
});
export type ArticleListQuery = z.infer<typeof articleListQuerySchema>;

export const articleCardSchema = z.object({
  slug: z.string(),
  title: z.string(),
  category: contentCategorySchema,
  summary: z.string().nullable(),
  author: z.string().nullable(),
  publishedAt: z.iso.datetime().nullable(),
});
export type ArticleCardDto = z.infer<typeof articleCardSchema>;

export const articleListResponseSchema = z.object({
  articles: z.array(articleCardSchema),
  nextCursor: z.string().nullable(),
});
export type ArticleListResponse = z.infer<typeof articleListResponseSchema>;

export const articleDetailSchema = articleCardSchema.extend({
  body: z.string(),
  source: z.string().nullable(),
});
export type ArticleDetailDto = z.infer<typeof articleDetailSchema>;
