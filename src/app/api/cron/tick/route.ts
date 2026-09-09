import { ingest } from "@/config/ingest";
import { start } from "workflow/api";
import { dailySiteManagerWorkflow } from "@/lib/agent/daily-manager";
import { attachWorkflowRun, createAgentRun } from "@/lib/agent/agent-runs";
import { getAgentSettings } from "@/lib/ingest/settings";
import { prisma } from "@/lib/prisma";
import { errorResponse } from "@/lib/validation/common";

// Bounds one invocation's runtime (Section G) — requires Pro or higher plan (Hobby caps at 10s).
// Raise in concert with tickTimeBudgetMs in src/config/ingest.ts.
export const maxDuration = 300;

export async function GET(request: Request) {
  // Vercel sends `Authorization: Bearer <CRON_SECRET>` automatically on every scheduled
  // invocation once CRON_SECRET is set as a project env var — a separate secret from
  // INGEST_SERVICE_TOKEN, which is for external phase-2-style callers, not Vercel itself.
  if (request.headers.get("authorization") !== `Bearer ${ingest.cronSecret}`) {
    return errorResponse("UNAUTHORIZED", "Missing or invalid cron secret.", 401);
  }

  const settings = await getAgentSettings();
  if (!settings.agentEnabled) return Response.json({ ok: true, skipped: true, reason: "Daily manager paused." });

  const { run, created } = await createAgentRun("daily");
  if (!created) return Response.json({ ok: true, queued: false, runId: run.id, status: run.status });

  try {
    const workflow = await start(dailySiteManagerWorkflow, [run.id]);
    await attachWorkflowRun(run.id, workflow.runId);
    return Response.json({ ok: true, queued: true, runId: run.id, workflowRunId: workflow.runId });
  } catch (error) {
    await prisma.dailyAgentRun.update({
      where: { id: run.id },
      data: { status: "FAILED", currentStage: "FAILED", error: error instanceof Error ? error.message : String(error), finishedAt: new Date() },
    });
    throw error;
  }
}
