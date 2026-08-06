import { cache } from "@/config/cache";
import { articleDetailSelect, toArticleDetail } from "@/lib/article-dto";
import { prisma } from "@/lib/prisma";
import { errorResponse } from "@/lib/validation/common";
import { articleDetailSchema } from "@/lib/validation/article";

export const dynamic = "force-dynamic";

export async function GET(_request: Request, ctx: RouteContext<"/api/articles/[slug]">) {
  const { slug } = await ctx.params;

  const row = await prisma.article.findFirst({
    where: { slug, published: true },
    select: articleDetailSelect,
  });

  if (!row) {
    return errorResponse("NOT_FOUND", "Article not found.", 404);
  }

  const body = articleDetailSchema.parse(toArticleDetail(row));

  return Response.json(body, {
    headers: {
      "Cache-Control": `public, s-maxage=${cache.jobDetailRevalidateSeconds}, stale-while-revalidate=60`,
    },
  });
}
