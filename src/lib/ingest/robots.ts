import "server-only";
import robotsParser from "robots-parser";
import { sources } from "@/config/sources";

const cache = new Map<string, ReturnType<typeof robotsParser> | null>();

async function loadRobots(origin: string) {
  if (cache.has(origin)) return cache.get(origin) ?? null;

  const robotsUrl = `${origin}/robots.txt`;
  let robots: ReturnType<typeof robotsParser> | null = null;
  try {
    const res = await fetch(robotsUrl, {
      headers: { "user-agent": sources.defaultUserAgent },
      signal: AbortSignal.timeout(sources.defaultFetchTimeoutMs),
    });
    // No robots.txt (or it 404s) means no restrictions — the standard scraper convention.
    if (res.ok) {
      const body = await res.text();
      robots = robotsParser(robotsUrl, body);
    }
  } catch {
    robots = null;
  }

  cache.set(origin, robots);
  return robots;
}

/** Whether `url` may be fetched under `origin`'s robots.txt for our user agent. */
export async function isAllowedByRobots(url: string): Promise<boolean> {
  const origin = new URL(url).origin;
  const robots = await loadRobots(origin);
  if (!robots) return true;
  return robots.isAllowed(url, sources.defaultUserAgent) ?? true;
}
