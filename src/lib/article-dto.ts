import "server-only";
import type { Prisma } from "@/generated/prisma/client";
import type { ArticleCardDto, ArticleDetailDto } from "./validation/article";

export const articleCardSelect = {
  slug: true,
  title: true,
  category: true,
  summary: true,
  author: true,
  publishedAt: true,
} satisfies Prisma.ArticleSelect;

export type ArticleCardRow = Prisma.ArticleGetPayload<{ select: typeof articleCardSelect }>;

export const articleDetailSelect = {
  ...articleCardSelect,
  body: true,
  source: true,
} satisfies Prisma.ArticleSelect;

export type ArticleDetailRow = Prisma.ArticleGetPayload<{ select: typeof articleDetailSelect }>;

export function toArticleCard(row: ArticleCardRow): ArticleCardDto {
  return {
    slug: row.slug,
    title: row.title,
    category: row.category,
    summary: row.summary,
    author: row.author,
    publishedAt: row.publishedAt?.toISOString() ?? null,
  };
}

export function toArticleDetail(row: ArticleDetailRow): ArticleDetailDto {
  return {
    ...toArticleCard(row),
    body: row.body,
    source: row.source,
  };
}
