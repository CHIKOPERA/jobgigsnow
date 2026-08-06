import "server-only";
import { generateText, Output } from "ai";
import { z } from "zod";
import type { Prisma } from "@/generated/prisma/client";
import { ai } from "@/config/ai";
import { prisma } from "@/lib/prisma";
import { sanitizeJobDescription } from "@/lib/job-rich-text";
import { getAiModel } from "./ai-model";

const rewriteOutputSchema = z.object({
  descriptionHtml: z.string().min(1),
});

export async function rewriteJobDescription(jobId: string, instruction: string, currentDescription: string) {
  const job = await prisma.job.findUnique({
    where: { id: jobId },
    select: {
      id: true,
      rawJobId: true,
      title: true,
      location: true,
      employmentType: true,
      remoteType: true,
      company: { select: { name: true } },
    },
  });
  if (!job) return { ok: false as const, reason: "not_found" as const };
  if (!job.rawJobId) return { ok: false as const, reason: "missing_raw_job" as const };

  const run = await prisma.improvementRun.create({
    data: {
      rawJobId: job.rawJobId,
      jobId: job.id,
      model: ai.model,
      promptVersion: "admin-rewrite-v1",
      status: "RUNNING",
      startedAt: new Date(),
    },
    select: { id: true },
  });
  await prisma.job.update({ where: { id: job.id }, data: { status: "IMPROVING", rewritePrompt: instruction } });

  try {
    const { output, usage } = await generateText({
      model: getAiModel(),
      system:
        "You are a careful job-post editor. Rewrite for clarity and readability without inventing requirements, benefits, salary, dates, or company facts. Return a clean HTML fragment only through the requested schema. Use only paragraphs, h2/h3, bullet or numbered lists, strong, em, blockquote, and links already present in the input.",
      prompt: [
        `Admin instruction: ${instruction}`,
        `Job: ${job.title} at ${job.company.name}`,
        `Location: ${job.location}`,
        `Work arrangement: ${job.remoteType}`,
        `Employment type: ${job.employmentType}`,
        "Current description:",
        currentDescription,
      ].join("\n\n"),
      output: Output.object({ schema: rewriteOutputSchema }),
    });

    const description = sanitizeJobDescription(output.descriptionHtml);
    if (!description) throw new Error("The rewrite returned an empty description.");

    await prisma.$transaction([
      prisma.job.update({
        where: { id: job.id },
        data: { description, rewritePrompt: instruction, status: "READY" },
      }),
      prisma.improvementRun.update({
        where: { id: run.id },
        data: {
          status: "SUCCEEDED",
          inputTokens: usage.inputTokens,
          outputTokens: usage.outputTokens,
          diff: { kind: "admin_rewrite", instruction, before: currentDescription, after: description } as Prisma.InputJsonValue,
          finishedAt: new Date(),
        },
      }),
    ]);

    return { ok: true as const, description };
  } catch (error) {
    await prisma.$transaction([
      prisma.job.update({ where: { id: job.id }, data: { status: "READY" } }),
      prisma.improvementRun.update({
        where: { id: run.id },
        data: {
          status: "FAILED",
          diff: { kind: "admin_rewrite", instruction, error: error instanceof Error ? error.message : String(error) } as Prisma.InputJsonValue,
          finishedAt: new Date(),
        },
      }),
    ]);
    throw error;
  }
}
