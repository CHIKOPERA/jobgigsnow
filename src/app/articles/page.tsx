import type { Metadata } from "next";
import { contentCategories } from "@/config/categories";
import { ArticleCard } from "@/components/content/ArticleCard";
import { fetchArticlePage } from "@/lib/article-query";
import { articleListQuerySchema } from "@/lib/validation/article";

export const metadata: Metadata = { title: "Articles & guides" };
export const dynamic = "force-dynamic";

interface ArticlesPageProps {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
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
