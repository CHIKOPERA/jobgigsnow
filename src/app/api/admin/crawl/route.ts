import { z } from "zod";
import { requireAdmin, adminAuthErrorResponse } from "@/lib/admin-auth";
import { queueOneOffUrl } from "@/lib/ingest/one-off";
import { processQueuedRawJob } from "@/lib/ingest/tick";
import { finalizeRunIfComplete } from "@/lib/ingest/run-tracking";
import { assertPublicHttpUrl } from "@/lib/validation/public-url";
import { errorResponse } from "@/lib/validation/common";

export const maxDuration = 300;

const bodySchema = z.object({ url: z.string().min(1) });

export async function POST(request: Request) {
  try {
    const admin = await requireAdmin();
    if (!admin.ok) return adminAuthErrorResponse(admin.reason);

    const body = bodySchema.parse(await request.json());
    const url = await assertPublicHttpUrl(body.url);
    const queued = await queueOneOffUrl(url);
    const outcome = await processQueuedRawJob(queued.rawJobId);

    await finalizeRunIfComplete(queued.ingestRunId);

    return Response.json({ ...queued, outcome });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return errorResponse("INVALID_URL", error.issues[0]?.message ?? "Enter a valid URL.", 400);
    }
    return errorResponse("CRAWL_FAILED", error instanceof Error ? error.message : "Unable to queue this URL.", 400);
  }
}
