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
          Optional rewrite template for manual polishing. The importer now uses one AI extraction
          pass, then publishes the job and adds the first Pexels image when available.
        </p>
      </div>
      <SettingsForm initialPrompt={seoRewritePrompt} />
    </div>
  );
}
