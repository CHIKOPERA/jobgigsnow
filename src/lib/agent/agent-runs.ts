import "server-only";
import { prisma } from "@/lib/prisma";
import { johannesburgDateKey } from "./time";

export async function createAgentRun(mode: "daily" | "manual" = "daily") {
  const dateKey = johannesburgDateKey();
  const runKey = mode === "daily" ? `daily:${dateKey}` : `manual:${dateKey}:${crypto.randomUUID()}`;
  if (mode === "daily") {
    const existing = await prisma.dailyAgentRun.findUnique({ where: { runKey } });
    if (existing) return { run: existing, created: false };
  }
  try {
    const run = await prisma.dailyAgentRun.create({ data: { runKey, dateKey, currentStage: "QUEUED" } });
    return { run, created: true };
  } catch (error) {
    if (mode === "daily") {
      const existing = await prisma.dailyAgentRun.findUnique({ where: { runKey } });
      if (existing) return { run: existing, created: false };
    }
    throw error;
  }
}

export async function attachWorkflowRun(agentRunId: string, workflowRunId: string) {
  return prisma.dailyAgentRun.update({ where: { id: agentRunId }, data: { workflowRunId, currentStage: "STARTING" } });
}
