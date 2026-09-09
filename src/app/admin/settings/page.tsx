import type { Metadata } from "next";
import { getAgentSettings, getSeoRewritePrompt } from "@/lib/ingest/settings";
import { SettingsForm } from "@/components/admin/SettingsForm";
import { GoalSettingsForm } from "@/components/admin/GoalSettingsForm";

export const metadata: Metadata = { title: "Admin — Settings" };
export const dynamic = "force-dynamic";

export default async function AdminSettingsPage() {
  const [seoRewritePrompt, agentSettings] = await Promise.all([getSeoRewritePrompt(), getAgentSettings()]);

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="text-title font-semibold">Settings</h1>
        <p className="mt-1 max-w-2xl text-meta text-ink-muted">
          Control the default editorial guide used when you rewrite a job from the editor. Automatic
          imports apply the same built-in factual and content-quality rules in their single AI pass.
        </p>
      </div>
      <GoalSettingsForm initial={agentSettings} />
      <div className="border-t border-line pt-6"><SettingsForm initialPrompt={seoRewritePrompt} /></div>
    </div>
  );
}
