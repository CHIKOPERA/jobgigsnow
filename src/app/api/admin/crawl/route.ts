import { z } from "zod";
import { requireAdmin, adminAuthErrorResponse } from "@/lib/admin-auth";
import { queueOneOffUrl } from "@/lib/ingest/one-off";
import { processQueuedRawJob } from "@/lib/ingest/tick";
import { finalizeRunIfComplete } from "@/lib/ingest/run-tracking";
import { assertPublicHttpUrl } from "@/lib/validation/public-url";
import { errorResponse } from "@/lib/validation/common";
import { progressStreamResponse } from "@/lib/ingest/progress-stream";
import type { ImportStage } from "@/lib/ingest/progress-types";

export const maxDuration = 300;

const bodySchema = z.object({ url: z.string().min(1) });

export async function POST(request: Request) {
  try {
    const admin = await requireAdmin();
    if (!admin.ok) return adminAuthErrorResponse(admin.reason);

    const body = bodySchema.parse(await request.json());
    const url = await assertPublicHttpUrl(body.url);
    const queued = await queueOneOffUrl(url);
    return progressStreamResponse(async (report) => {
      const counters = { found: 1, processed: 0, published: 0, skipped: 0, failed: 0 };
      const messages: Partial<Record<ImportStage, string>> = {
        capturing: "Capturing the job details…",
        rewriting: "Rewriting the job…",
        image: "Finding an image…",
        publishing: "Publishing the job…",
      };
      const outcome = await processQueuedRawJob(queued.rawJobId, (stage, jobTitle) => report({
        type: "progress",
        stage,
        message: messages[stage] ?? "Processing the job…",
        runId: queued.ingestRunId,
        jobTitle,
        ...counters,
        current: 1,
        total: 1,
      }));
      counters.processed = 1;
      counters[outcome] = 1;
      report({
        type: "progress",
        stage: outcome,
        message: outcome === "published" ? "Job published." : outcome === "failed" ? "The job needs attention." : "No changes were needed.",
        runId: queued.ingestRunId,
        ...counters,
        current: 1,
        total: 1,
      });
      await finalizeRunIfComplete(queued.ingestRunId);
      return { ...queued, outcome };
    });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return errorResponse("INVALID_URL", error.issues[0]?.message ?? "Enter a valid URL.", 400);
    }
    return errorResponse("CRAWL_FAILED", error instanceof Error ? error.message : "Unable to queue this URL.", 400);
  }
}
