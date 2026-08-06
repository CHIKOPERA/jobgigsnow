import type { Metadata } from "next";
import { getSeoRewritePrompt } from "@/lib/ingest/settings";
import { SettingsForm } from "@/components/admin/SettingsForm";

export const metadata: Metadata = { title: "Admin — Settings" };
export const dynamic = "force-dynamic";

export default async function AdminSettingsPage() {
  const seoRewritePrompt = await getSeoRewritePrompt();

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="text-title font-semibold">Settings</h1>
        <p className="mt-1 max-w-2xl text-meta text-ink-muted">
          Runs automatically after AI aggregation, before a job reaches review — it rewrites the
          title, description, and tags for search visibility. The result is what you see first in{" "}
          <span className="font-medium text-ink">Review</span>; the &quot;Rewrite with AI&quot;
          button there re-applies this same prompt as an adjustment, not a separate tool.
        </p>
      </div>
      <SettingsForm initialPrompt={seoRewritePrompt} />
    </div>
  );
}
