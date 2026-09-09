import { start } from "workflow/api";
import { requireAdmin, adminAuthErrorResponse } from "@/lib/admin-auth";
import { dailySiteManagerWorkflow } from "@/lib/agent/daily-manager";
import { attachWorkflowRun, createAgentRun } from "@/lib/agent/agent-runs";
import { getAgentSettings } from "@/lib/ingest/settings";
import { prisma } from "@/lib/prisma";
import { errorResponse } from "@/lib/validation/common";

export async function POST() {
  const admin = await requireAdmin();
  if (!admin.ok) return adminAuthErrorResponse(admin.reason);
  const settings = await getAgentSettings();
  if (!settings.agentEnabled) return errorResponse("AGENT_PAUSED", "Resume the daily manager before starting a run.", 409);

  const { run } = await createAgentRun("manual");
  try {
    const workflow = await start(dailySiteManagerWorkflow, [run.id]);
    await attachWorkflowRun(run.id, workflow.runId);
    return Response.json({ runId: run.id, workflowRunId: workflow.runId }, { status: 202 });
  } catch (error) {
    await prisma.dailyAgentRun.update({
      where: { id: run.id },
      data: { status: "FAILED", currentStage: "FAILED", error: error instanceof Error ? error.message : String(error), finishedAt: new Date() },
    });
    return errorResponse("START_FAILED", error instanceof Error ? error.message : "The daily manager could not start.", 500);
  }
}
