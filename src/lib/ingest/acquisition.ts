import "server-only";
import { sources } from "@/config/sources";
import { acquireHostSlot } from "./rate-limiter";
import { isAllowedByRobots } from "./robots";

export interface AcquisitionResult {
  html: string;
  htmlTruncated: boolean;
  httpStatus: number;
  /** Redirect target, if the fetch followed one — the metadata extractor's <link rel="canonical">
   *  reading (more authoritative when present) overrides this at reconciliation time. */
  redirectedUrl: string | null;
  fetchedAt: string;
}

function sleep(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

/**
 * Fetches ONE detail page. This is the acquisition/Playwright-swappable seam described in the
 * plan — everything downstream only depends on this return shape, never on how the HTML was
 * obtained, so a future JS-rendering acquirer can replace the body of this function without
 * touching any extractor.
 */
async function fetchWithRetry(url: string): Promise<AcquisitionResult> {
  let lastError: unknown;
  for (let attempt = 0; attempt <= sources.fetchMaxRetries; attempt++) {
    try {
      const res = await fetch(url, {
        headers: { "user-agent": sources.defaultUserAgent },
        signal: AbortSignal.timeout(sources.defaultFetchTimeoutMs),
        redirect: "follow",
      });
      const html = await res.text();
      const truncated = html.length > sources.maxHtmlBytes;
      return {
        html: truncated ? html.slice(0, sources.maxHtmlBytes) : html,
        htmlTruncated: truncated,
        httpStatus: res.status,
        redirectedUrl: res.url && res.url !== url ? res.url : null,
        fetchedAt: new Date().toISOString(),
      };
    } catch (err) {
      lastError = err;
      if (attempt < sources.fetchMaxRetries) {
        await sleep(sources.fetchBackoffBaseMs * 2 ** attempt);
      }
    }
  }
  throw lastError instanceof Error ? lastError : new Error(String(lastError));
}

export async function acquirePage(url: string): Promise<AcquisitionResult> {
  if (!(await isAllowedByRobots(url))) {
    throw new Error(`Disallowed by robots.txt: ${url}`);
  }

  const release = await acquireHostSlot(new URL(url).hostname);
  try {
    return await fetchWithRetry(url);
  } finally {
    release();
  }
}
