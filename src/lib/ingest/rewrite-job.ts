import "server-only";
import { generateText, Output } from "ai";
import { z } from "zod";
import type { Prisma } from "@/generated/prisma/client";
import { ai } from "@/config/ai";
import { prisma } from "@/lib/prisma";
import { sanitizeJobDescription } from "@/lib/job-rich-text";
import { getAiModel } from "./ai-model";
import { JOBGIGSNOW_EDITORIAL_GUIDE } from "./editorial-guide";
import {
  APPLICATION_GUIDANCE_PROMPT,
  applicationGuidanceSchema,
  cleanApplicationGuidance,
} from "@/lib/application-guidance";

const rewriteOutputSchema = z.object({
  descriptionHtml: z.string().min(1),
  applicationGuidance: applicationGuidanceSchema,
});

export async function rewriteJobDescription(jobId: string, instruction: string, currentDescription: string) {
  const job = await prisma.job.findUnique({
    where: { id: jobId },
    select: {
      id: true,
      rawJobId: true,
      title: true,
      category: true,
      location: true,
      employmentType: true,
      remoteType: true,
      salaryMin: true,
      salaryMax: true,
      salaryCurrency: true,
      salaryPeriod: true,
      postedAt: true,
      closesAt: true,
      applyUrl: true,
      company: { select: { name: true } },
    },
  });
  if (!job) return { ok: false as const, reason: "not_found" as const };

  const run = job.rawJobId ? await prisma.improvementRun.create({
    data: {
      rawJobId: job.rawJobId,
      jobId: job.id,
      model: ai.model,
      promptVersion: "admin-rewrite-v2-application-guidance",
      status: "RUNNING",
      startedAt: new Date(),
    },
    select: { id: true },
  }) : null;
  await prisma.job.update({ where: { id: job.id }, data: { status: "IMPROVING", rewritePrompt: instruction } });

  try {
    const editorialInstruction = instruction.includes("NON-NEGOTIABLE FACT RULES")
      ? instruction
      : `${JOBGIGSNOW_EDITORIAL_GUIDE}\n\nADDITIONAL ADMIN INSTRUCTION\n${instruction}`;
    const salary = job.salaryMin === null
      ? "Not specified"
      : `${job.salaryCurrency ?? ""} ${job.salaryMin}${job.salaryMax === null ? "" : `–${job.salaryMax}`} ${job.salaryPeriod ?? ""}`.trim();
    const { output, usage } = await generateText({
      model: getAiModel(),
      system:
        "You are a careful JobGigsNow opportunity editor. Preserve the official title and factual meaning. Never invent requirements, benefits, salary, dates, eligibility, documents, hiring stages, or company facts. Return a clean HTML description fragment only through the requested schema, using paragraphs, h2/h3, bullet or numbered lists, strong, em, blockquote, and links supplied in the input.",
      prompt: [
        editorialInstruction,
        `Job: ${job.title} at ${job.company.name}`,
        `Opportunity type: ${job.category}`,
        `Location: ${job.location}`,
        `Work arrangement: ${job.remoteType}`,
        `Employment type: ${job.employmentType}`,
        `Salary: ${salary}`,
        `Posted date: ${job.postedAt?.toISOString() ?? "Not specified"}`,
        `Deadline: ${job.closesAt?.toISOString() ?? "Not specified"}`,
        `Official application URL: ${job.applyUrl ?? "Not provided"}`,
        "Current description:",
        currentDescription,
        APPLICATION_GUIDANCE_PROMPT,
      ].join("\n\n"),
      output: Output.object({ schema: rewriteOutputSchema }),
    });

    const description = sanitizeJobDescription(output.descriptionHtml);
    if (!description) throw new Error("The rewrite returned an empty description.");
    const applicationGuidance = cleanApplicationGuidance(output.applicationGuidance);

    const jobUpdate = prisma.job.update({
        where: { id: job.id },
        data: {
          description,
          applicationSummary: applicationGuidance.summary || null,
          essentialRequirements: applicationGuidance.essentialRequirements,
          preferredRequirements: applicationGuidance.preferredRequirements,
          requiredQualifications: applicationGuidance.qualifications,
          requiredExperience: applicationGuidance.experience,
          documentsToPrepare: applicationGuidance.documents,
          licenceRequirements: applicationGuidance.licences,
          applicationMethod: applicationGuidance.applicationMethod || null,
          referenceNumber: applicationGuidance.referenceNumber || null,
          estimatedApplicationMinutes: applicationGuidance.estimatedApplicationMinutes || null,
          rewritePrompt: instruction,
          status: "READY",
        },
      });
    if (run) {
      await prisma.$transaction([jobUpdate, prisma.improvementRun.update({
        where: { id: run.id },
        data: {
          status: "SUCCEEDED",
          inputTokens: usage.inputTokens,
          outputTokens: usage.outputTokens,
          diff: {
            kind: "admin_rewrite",
            instruction,
            before: currentDescription,
            after: description,
            applicationGuidance,
          } as Prisma.InputJsonValue,
          finishedAt: new Date(),
        },
      })]);
    } else {
      await jobUpdate;
    }

    return { ok: true as const, description, applicationGuidance };
  } catch (error) {
    const jobUpdate = prisma.job.update({ where: { id: job.id }, data: { status: "READY" } });
    if (run) {
      await prisma.$transaction([jobUpdate, prisma.improvementRun.update({
        where: { id: run.id },
        data: {
          status: "FAILED",
          diff: { kind: "admin_rewrite", instruction, error: error instanceof Error ? error.message : String(error) } as Prisma.InputJsonValue,
          finishedAt: new Date(),
        },
      })]);
    } else {
      await jobUpdate;
    }
    throw error;
  }
}
