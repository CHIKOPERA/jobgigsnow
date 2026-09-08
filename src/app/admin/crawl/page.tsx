import type { Metadata } from "next";
import { QuickCrawlForm } from "@/components/admin/QuickCrawlForm";

export const metadata: Metadata = { title: "Admin — Import one job" };

export default function QuickCrawlPage() {
  return (
    <div className="mx-auto flex max-w-3xl flex-col gap-7">
      <div>
        <p className="text-label uppercase tracking-[0.1em] text-ink-muted">One-off import</p>
        <h1 className="mt-2 text-h2 font-medium">Import one job</h1>
        <p className="mt-3 max-w-2xl text-body text-ink-muted">
          Paste the public job page. We’ll capture the details, rewrite them and publish the job.
        </p>
      </div>
      <QuickCrawlForm />
    </div>
  );
}
