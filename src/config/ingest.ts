import "server-only";
import { env } from "./env";

export const ingest = {
  token: env.INGEST_SERVICE_TOKEN,
  cronSecret: env.CRON_SECRET,
  rawJobsBatchMax: 200,
  jobsBatchMax: 100,
  queueClaimMax: 50,

  // Cron tick batching (Section G) — every value here bounds one /api/cron/tick invocation.
  // Budget is set well within the 300s maxDuration so the function always returns cleanly.
  tickTimeBudgetMs: 240_000,
  discoveryPerTick: 10,
  acquisitionPerTick: 40,
  acquisitionConcurrency: 8,
  aggregationPerTick: 10,

  // How long a claimed-but-not-finished row (FETCHING / aggregationClaimedAt) is considered
  // abandoned and eligible for another tick to reclaim.
  claimStaleMs: 5 * 60_000,

  // How long an already-FETCHED, still-active RawJob can go without being re-acquired before
  // it's due for a change-detection recrawl. A single global value rather than per-Source
  // cadence — Prisma can't compare two dynamic columns in a WHERE clause without raw SQL, and a
  // shared default is a reasonable v1 tradeoff for "reprocess jobs whose content changed."
  recrawlAfterMs: 24 * 60 * 60_000,

  // Consecutive discovery passes a previously-active RawJob can be absent before it flips
  // `active = false` (and, if linked to a PUBLISHED Job, that Job is closed).
  missingRunsThreshold: 3,
} as const;
