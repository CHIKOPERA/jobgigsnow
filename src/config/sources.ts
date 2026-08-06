import "server-only";

export const sources = {
  defaultCrawlCadenceMinutes: 360,
  defaultFetchTimeoutMs: 15_000,
  defaultUserAgent: "HirelaneBot/1.0 (+https://hirelane.example/bot)",
} as const;
