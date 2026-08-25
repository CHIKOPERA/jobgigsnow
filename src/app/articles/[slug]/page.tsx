import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { contentCategories } from "@/config/categories";
import { site } from "@/config";
import { ContentAd } from "@/components/ads/ContentAd";
import { articleDetailSelect, toArticleDetail } from "@/lib/article-dto";
import { formatRelativeTime } from "@/lib/format";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

interface ArticlePageProps {
  params: Promise<{ slug: string }>;
}

async function getArticle(slug: string) {
  const row = await prisma.article.findFirst({
    where: { slug, published: true },
    select: articleDetailSelect,
  });
  return row ? toArticleDetail(row) : null;
}

export async function generateMetadata({ params }: ArticlePageProps): Promise<Metadata> {
  const { slug } = await params;
  const article = await getArticle(slug);
  if (!article) return { title: "Article not found", robots: { index: false, follow: false } };

  const description = article.summary ?? article.body.replace(/\s+/g, " ").slice(0, 155);
  const url = `${site.url.replace(/\/$/, "")}/articles/${slug}`;
  return {
    title: article.title,
    description,
    alternates: { canonical: url },
    openGraph: { type: "article", title: article.title, description, url, siteName: site.name },
  };
}

export default async function ArticlePage({ params }: ArticlePageProps) {
  const { slug } = await params;
  const article = await getArticle(slug);
  if (!article) notFound();

  return (
    <div className="mx-auto max-w-3xl px-4 py-6 md:px-6">
      <article className="rounded-md border border-line bg-surface p-6">
        <span className="rounded-pill bg-bg px-2.5 py-[5px] text-[12px] text-[#2b2d24]">
          {contentCategories[article.category].label}
        </span>
        <h1 className="mt-3 text-title font-semibold tracking-[-0.015em]" style={{ fontSize: "22px" }}>
          {article.title}
        </h1>
        <p className="mt-2 text-meta text-ink-muted">
          {article.author && <>{article.author} · </>}
          {formatRelativeTime(article.publishedAt)}
        </p>
        <div className="mt-6 whitespace-pre-line text-body leading-relaxed">{article.body}</div>
        {article.source && (
          <p className="mt-6 text-meta text-ink-muted">Source: {article.source}</p>
        )}
      </article>
      <ContentAd kind="article" pageKey={slug} text={article.body} />
    </div>
  );
}
