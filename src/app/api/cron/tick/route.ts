import { ingest } from "@/config/ingest";
import { runTick } from "@/lib/ingest/tick";
import { errorResponse } from "@/lib/validation/common";

// Bounds one invocation's runtime (Section G) — raise this if the deployed plan allows more and
// tick batch sizes in src/config/ingest.ts are increased to match.
export const maxDuration = 60;

export async function GET(request: Request) {
  // Vercel sends `Authorization: Bearer <CRON_SECRET>` automatically on every scheduled
  // invocation once CRON_SECRET is set as a project env var — a separate secret from
  // INGEST_SERVICE_TOKEN, which is for external phase-2-style callers, not Vercel itself.
  if (request.headers.get("authorization") !== `Bearer ${ingest.cronSecret}`) {
    return errorResponse("UNAUTHORIZED", "Missing or invalid cron secret.", 401);
  }

  const result = await runTick();
  return Response.json({ ok: true, ...result });
}
