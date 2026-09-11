import "server-only";
import { generateText, Output } from "ai";
import type { Prisma } from "@/generated/prisma/client";
import { prisma } from "@/lib/prisma";
import {
  APPLICATION_GUIDANCE_PROMPT,
  applicationGuidanceSchema,
  cleanApplicationGuidance,
} from "@/lib/application-guidance";
import { getAiModel } from "./ai-model";
import type { RawExtractionBundle } from "./types";

const eligibleJobsWhere = {
  status: "PUBLISHED",
  rawJobId: { not: null },
  applicationGuidanceGeneratedAt: null,
} satisfies Prisma.JobWhereInput;

const staleClaimMs = 5 * 60_000;

export interface GuidanceBackfillStatus {
  eligible: number;
  run: null | {
    id: string;
    status: "RUNNING" | "COMPLETED";
    total: number;
    completed: number;
    failed: number;
    left: number;
    currentJobTitle: string | null;
  };
}

export async function getApplicationGuidanceBackfillStatus(): Promise<GuidanceBackfillStatus> {
  const [eligible, run] = await Promise.all([
    prisma.job.count({ where: eligibleJobsWhere }),
    prisma.applicationGuidanceBackfillRun.findFirst({ orderBy: { startedAt: "desc" } }),
  ]);
  return {
    eligible,
    run: run && {
      id: run.id,
      status: run.status,
      total: run.total,
      completed: run.completed,
      failed: run.failed,
      left: Math.max(0, run.total - run.completed - run.failed),
      currentJobTitle: run.currentJobTitle,
    },
  };
}

export async function startApplicationGuidanceBackfill() {
  const active = await prisma.applicationGuidanceBackfillRun.findFirst({
    where: { status: "RUNNING" },
    orderBy: { startedAt: "desc" },
  });
  if (active) return getApplicationGuidanceBackfillStatus();

  const jobs = await prisma.job.findMany({ where: eligibleJobsWhere, select: { id: true } });
  if (jobs.length > 0) {
    await prisma.applicationGuidanceBackfillRun.create({
      data: { total: jobs.length, items: { create: jobs.map(({ id }) => ({ jobId: id })) } },
    });
  }
  return getApplicationGuidanceBackfillStatus();
}

function sourceText(payload: Prisma.JsonValue, fallback: string): string {
  if (!payload || typeof payload !== "object" || Array.isArray(payload)) return fallback;
  const bundle = payload as unknown as Partial<RawExtractionBundle>;
  return bundle.markdown ?? bundle.readableText ?? bundle.reconciled?.description?.value ?? fallback;
}

async function finishRunIfDone(runId: string) {
  const remaining = await prisma.applicationGuidanceBackfillItem.count({
    where: { runId, status: { in: ["PENDING", "RUNNING"] } },
  });
  if (remaining === 0) {
    await prisma.applicationGuidanceBackfillRun.update({
      where: { id: runId },
      data: { status: "COMPLETED", currentJobTitle: null, finishedAt: new Date() },
    });
  }
}

export async function processApplicationGuidanceBackfillStep() {
  const run = await prisma.applicationGuidanceBackfillRun.findFirst({
    where: { status: "RUNNING" },
    orderBy: { startedAt: "desc" },
  });
  if (!run) return getApplicationGuidanceBackfillStatus();

  await prisma.applicationGuidanceBackfillItem.updateMany({
    where: { runId: run.id, status: "RUNNING", claimedAt: { lt: new Date(Date.now() - staleClaimMs) } },
    data: { status: "PENDING", claimedAt: null },
  });

  const candidate = await prisma.applicationGuidanceBackfillItem.findFirst({
    where: { runId: run.id, status: "PENDING" },
    orderBy: { createdAt: "asc" },
    include: { job: { include: { company: { select: { name: true } }, rawJob: { select: { payload: true } } } } },
  });
  if (!candidate) {
    await finishRunIfDone(run.id);
    return getApplicationGuidanceBackfillStatus();
  }

  const claimed = await prisma.applicationGuidanceBackfillItem.updateMany({
    where: { id: candidate.id, status: "PENDING" },
    data: { status: "RUNNING", claimedAt: new Date(), error: null },
  });
  if (claimed.count === 0) return getApplicationGuidanceBackfillStatus();
  await prisma.applicationGuidanceBackfillRun.update({ where: { id: run.id }, data: { currentJobTitle: candidate.job.title } });

  try {
    const { output } = await generateText({
      model: getAiModel(),
      system: "Extract applicant guidance only from the supplied official vacancy content. Never invent or upgrade a requirement. Return empty values when the source is silent.",
      prompt: [
        APPLICATION_GUIDANCE_PROMPT,
        `Job: ${candidate.job.title} at ${candidate.job.company.name}`,
        `Location: ${candidate.job.location}`,
        `Employment type: ${candidate.job.employmentType}`,
        `Deadline: ${candidate.job.closesAt?.toISOString() ?? "Not specified"}`,
        `Application URL: ${candidate.job.applyUrl ?? "Not provided"}`,
        "Official vacancy content:",
        sourceText(candidate.job.rawJob?.payload ?? null, candidate.job.description),
      ].join("\n\n"),
      output: Output.object({ schema: applicationGuidanceSchema }),
    });
    const guidance = cleanApplicationGuidance(output);
    await prisma.$transaction([
      prisma.job.update({ where: { id: candidate.jobId }, data: {
        applicationSummary: guidance.summary || null,
        essentialRequirements: guidance.essentialRequirements,
        preferredRequirements: guidance.preferredRequirements,
        requiredQualifications: guidance.qualifications,
        requiredExperience: guidance.experience,
        documentsToPrepare: guidance.documents,
        licenceRequirements: guidance.licences,
        applicationMethod: guidance.applicationMethod || null,
        referenceNumber: guidance.referenceNumber || null,
        estimatedApplicationMinutes: guidance.estimatedApplicationMinutes || null,
        applicationGuidanceGeneratedAt: new Date(),
      } }),
      prisma.applicationGuidanceBackfillItem.update({ where: { id: candidate.id }, data: { status: "SUCCEEDED", finishedAt: new Date() } }),
      prisma.applicationGuidanceBackfillRun.update({ where: { id: run.id }, data: { completed: { increment: 1 }, currentJobTitle: null } }),
    ]);
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unknown backfill error";
    await prisma.$transaction([
      prisma.applicationGuidanceBackfillItem.update({ where: { id: candidate.id }, data: { status: "FAILED", error: message.slice(0, 1000), finishedAt: new Date() } }),
      prisma.applicationGuidanceBackfillRun.update({ where: { id: run.id }, data: { failed: { increment: 1 }, currentJobTitle: null } }),
    ]);
  }
  await finishRunIfDone(run.id);
  return getApplicationGuidanceBackfillStatus();
}
