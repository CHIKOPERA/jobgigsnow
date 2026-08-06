import type { Metadata } from "next";
import Link from "next/link";
import { NewJobForm } from "@/components/admin/content/NewJobForm";

export const metadata: Metadata = { title: "Admin — Add content" };

export default function NewContentPage() {
  return (
    <div className="mx-auto flex max-w-4xl flex-col gap-6">
      <div>
        <Link href="/admin/content" className="focus-ring rounded-sm text-meta text-ink-muted hover:text-ink">← Published content</Link>
        <p className="mt-5 text-label uppercase tracking-[0.1em] text-ink-muted">Manual publishing</p>
        <h1 className="mt-2 text-h2 font-medium">Add a job</h1>
        <p className="mt-2 text-body text-ink-muted">Create a review-ready draft, then refine it, choose its social image, and publish.</p>
      </div>
      <NewJobForm />
    </div>
  );
}
