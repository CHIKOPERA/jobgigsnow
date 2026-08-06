import Link from "next/link";
import { contentCategories } from "@/config/categories";
import { formatRelativeTime } from "@/lib/format";
import type { ArticleCardDto } from "@/lib/validation/article";

export function ArticleCard({ article }: { article: ArticleCardDto }) {
  return (
    <Link
      href={`/articles/${article.slug}`}
      className="focus-ring block rounded-md border border-line bg-surface p-4 hover:border-line-strong"
    >
      <span className="rounded-pill bg-bg px-2.5 py-[5px] text-[12px] text-[#2b2d24]">
        {contentCategories[article.category].label}
      </span>
      <div className="mt-2.5 text-title font-semibold tracking-[-0.01em]" style={{ fontSize: "17px" }}>
        {article.title}
      </div>
      {article.summary && <p className="mt-1 text-body text-ink-muted">{article.summary}</p>}
      <div className="mt-2 text-meta text-ink-muted">
        {article.author && <>{article.author} · </>}
        {formatRelativeTime(article.publishedAt)}
      </div>
    </Link>
  );
}
