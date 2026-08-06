import "server-only";
import { sources } from "@/config/sources";

/**
 * Per-hostname politeness gate: caps concurrent in-flight requests to one host and enforces a
 * minimum delay between requests to it. In-memory, scoped to this process — fine here because it
 * only needs to hold state within one cron tick's own acquisition batch, not across invocations
 * (unlike src/lib/rate-limit.ts, which guards public API abuse across a whole instance's uptime).
 */
const lastFetchAt = new Map<string, number>();
const inFlight = new Map<string, number>();

function sleep(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

/** Resolves once a slot for `hostname` is free; call the returned function when done. */
export async function acquireHostSlot(hostname: string): Promise<() => void> {
  for (;;) {
    const current = inFlight.get(hostname) ?? 0;
    const elapsedSinceLast = Date.now() - (lastFetchAt.get(hostname) ?? 0);

    if (current < sources.perHostConcurrency && elapsedSinceLast >= sources.perHostMinDelayMs) {
      inFlight.set(hostname, current + 1);
      lastFetchAt.set(hostname, Date.now());
      return () => inFlight.set(hostname, Math.max(0, (inFlight.get(hostname) ?? 1) - 1));
    }

    await sleep(Math.max(50, sources.perHostMinDelayMs - elapsedSinceLast));
  }
}
