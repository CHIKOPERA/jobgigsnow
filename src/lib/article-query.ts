import "server-only";
import { articleCardSelect, toArticleCard } from "@/lib/article-dto";
import { prisma } from "@/lib/prisma";
import type { ArticleListQuery } from "@/lib/validation/article";

export async function fetchArticlePage(query: ArticleListQuery) {
  const rows = await prisma.article.findMany({
    where: {
      published: true,
      ...(query.category && { category: query.category }),
    },
    select: articleCardSelect,
    orderBy: [{ publishedAt: "desc" }, { id: "desc" }],
    take: query.limit + 1,
    ...(query.cursor && { cursor: { slug: query.cursor }, skip: 1 }),
  });

  const hasMore = rows.length > query.limit;
  const page = hasMore ? rows.slice(0, query.limit) : rows;

  return {
    articles: page.map(toArticleCard),
    nextCursor: hasMore ? page[page.length - 1].slug : null,
  };
}
