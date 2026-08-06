import Link from "next/link";

export default function ArticleNotFound() {
  return (
    <div className="mx-auto max-w-6xl px-4 py-16 text-center">
      <h1 className="text-title font-semibold">Article not found</h1>
      <p className="mt-2 text-body text-ink-muted">This article may have been moved or removed.</p>
      <Link
        href="/articles"
        className="focus-ring mt-6 inline-flex h-12 items-center rounded-pill bg-ink px-6 text-body font-medium text-[#F6F7F0]"
      >
        Back to articles
      </Link>
    </div>
  );
}
