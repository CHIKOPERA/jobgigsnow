import "server-only";

/**
 * Best-effort in-memory fixed-window limiter. Good enough for a single Phase 1 instance;
 * a serverless deployment with multiple concurrent instances needs a shared store (e.g. Upstash
 * Redis) instead — tracked in docs/todo/06-phase-2-handoff.md's follow-ups, not added here since
 * it's a new dependency beyond Next/Prisma/Clerk/Zod/Tailwind.
 */
const WINDOW_MS = 60_000;
const MAX_REQUESTS = 60;

const hits = new Map<string, { count: number; windowStart: number }>();

export function checkRateLimit(key: string): { ok: boolean; retryAfterSeconds?: number } {
  const now = Date.now();
  const entry = hits.get(key);

  if (!entry || now - entry.windowStart >= WINDOW_MS) {
    hits.set(key, { count: 1, windowStart: now });
    return { ok: true };
  }

  if (entry.count >= MAX_REQUESTS) {
    return { ok: false, retryAfterSeconds: Math.ceil((entry.windowStart + WINDOW_MS - now) / 1000) };
  }

  entry.count += 1;
  return { ok: true };
}

export function clientKeyFromRequest(request: Request): string {
  const forwardedFor = request.headers.get("x-forwarded-for");
  return forwardedFor?.split(",")[0]?.trim() ?? "unknown";
}
