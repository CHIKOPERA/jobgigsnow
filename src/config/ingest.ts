import "server-only";
import { env } from "./env";

export const ingest = {
  token: env.INGEST_SERVICE_TOKEN,
  rawJobsBatchMax: 200,
  jobsBatchMax: 100,
  queueClaimMax: 50,
} as const;
