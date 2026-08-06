import "server-only";

export const sources = {
  defaultCrawlCadenceMinutes: 360,
  defaultFetchTimeoutMs: 15_000,
  defaultUserAgent: "JobGigsNowBot/1.0 (+https://jobgigsnow.example/bot)",

  // Raw HTML stored in RawJob.payload is truncated past this size (bytes) so bundle rows stay
  // bounded; payload.htmlTruncated is set to true when this happens.
  maxHtmlBytes: 3 * 1024 * 1024,

  // Retry/backoff for a single page fetch.
  fetchMaxRetries: 3,
  fetchBackoffBaseMs: 500,

  // Per-hostname politeness gate (src/lib/ingest/rate-limiter.ts).
  perHostConcurrency: 2,
  perHostMinDelayMs: 1_000,

  // Hard ceiling on pages acquired for one source within a single discovery cycle's lifetime —
  // a circuit breaker against a misconfigured crawlConfig running away.
  maxPagesPerRun: 500,
} as const;
