import type { Metadata } from "next";
import { QuickCrawlForm } from "@/components/admin/QuickCrawlForm";

export const metadata: Metadata = { title: "Admin — Quick crawl" };

export default function QuickCrawlPage() {
  return (
    <div className="mx-auto flex max-w-3xl flex-col gap-7">
      <div>
        <p className="text-label uppercase tracking-[0.1em] text-ink-muted">One-off ingestion</p>
        <h1 className="mt-2 text-h2 font-medium">Crawl a single job</h1>
        <p className="mt-3 max-w-2xl text-body text-ink-muted">
          Use this for a job that is not part of a scheduled source. You can follow its live pipeline progress immediately.
        </p>
      </div>
      <QuickCrawlForm />
    </div>
  );
}
