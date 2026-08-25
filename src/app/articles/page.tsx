import type { Metadata } from "next";
import { site } from "@/config";
import { contentCategories } from "@/config/categories";
import { ArticleCard } from "@/components/content/ArticleCard";
import { fetchArticlePage } from "@/lib/article-query";
import { prisma } from "@/lib/prisma";
import { articleListQuerySchema } from "@/lib/validation/article";

export const dynamic = "force-dynamic";

interface ArticlesPageProps {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}

export async function generateMetadata({ searchParams }: ArticlesPageProps): Promise<Metadata> {
  const raw = await searchParams;
  const isFiltered = typeof raw.category === "string" && raw.category.length > 0;
  const publishedCount = await prisma.article.count({ where: { published: true } });

  return {
    title: "Articles & guides",
    description: "Original, practical guidance for finding work, applying well and building your career.",
    alternates: { canonical: `${site.url.replace(/\/$/, "")}/articles` },
    robots: { index: !isFiltered && publishedCount > 0, follow: true },
  };
}

export default async function ArticlesPage({ searchParams }: ArticlesPageProps) {
  const raw = await searchParams;
  const query = articleListQuerySchema.parse({
    category: typeof raw.category === "string" ? raw.category : undefined,
  });
  const { articles } = await fetchArticlePage(query);
  const categoryLabel = query.category ? contentCategories[query.category].label : null;

  return (
    <div className="mx-auto max-w-6xl px-4 py-4 md:px-6">
      <h1 className="text-title font-semibold" style={{ fontSize: "22px" }}>
        {categoryLabel ?? "Articles & guides"}
      </h1>
      <p aria-live="polite" className="mt-2 text-meta text-ink-muted">
        {articles.length} article{articles.length === 1 ? "" : "s"}
      </p>
      {articles.length === 0 ? (
        <div className="mt-4 rounded-md border border-line bg-surface p-6 text-center text-body text-ink-muted">
          No articles here yet — check back soon.
        </div>
      ) : (
        <ul className="mt-4 flex flex-col gap-3">
          {articles.map((article) => (
            <li key={article.slug}>
              <ArticleCard article={article} />
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
