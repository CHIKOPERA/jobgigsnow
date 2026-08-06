import "server-only";
import { PDFParse } from "pdf-parse";
import { sources } from "@/config/sources";
import type { CrawlConfig } from "@/lib/validation/source";
import { acquireCornerstone } from "./cornerstone";
import { acquireOracle, isOracleJobUrl } from "./oracle";
import { acquireHostSlot } from "./rate-limiter";
import { isAllowedByRobots } from "./robots";
import { acquireWorkday, isWorkdayJobUrl } from "./workday";

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
function escapeHtml(value: string): string {
  return value.replaceAll("&", "&amp;").replaceAll("<", "&lt;").replaceAll(">", "&gt;");
}

async function pdfToHtml(data: ArrayBuffer): Promise<string> {
  const parser = new PDFParse({ data: new Uint8Array(data) });
  try {
    const result = await parser.getText();
    return `<!doctype html><html><body><main><article><pre>${escapeHtml(result.text)}</pre></article></main></body></html>`;
  } finally {
    await parser.destroy();
  }
}

function fetchAts(url: string | URL | Request, init?: RequestInit): Promise<Response> {
  const headers = new Headers(init?.headers);
  if (!headers.has("user-agent")) headers.set("user-agent", sources.defaultUserAgent);
  return fetch(url, {
    ...init,
    headers,
    signal: init?.signal ?? AbortSignal.timeout(sources.defaultFetchTimeoutMs),
  });
}

async function fetchWithRetry(url: string, config?: CrawlConfig): Promise<AcquisitionResult> {
  let lastError: unknown;
  for (let attempt = 0; attempt <= sources.fetchMaxRetries; attempt++) {
    try {
      const parsedUrl = new URL(url);
      let atsHtml: string | null = null;
      if (isWorkdayJobUrl(parsedUrl)) atsHtml = await acquireWorkday(parsedUrl, fetchAts);
      else if (isOracleJobUrl(parsedUrl) && config?.provider === "oracle") {
        atsHtml = await acquireOracle(parsedUrl, config.companyName, fetchAts);
      } else if (config?.provider === "cornerstone" && /\/requisition\//.test(parsedUrl.pathname)) {
        atsHtml = await acquireCornerstone(parsedUrl, config, fetchAts);
      }
      if (atsHtml != null) {
        const truncated = atsHtml.length > sources.maxHtmlBytes;
        return {
          html: truncated ? atsHtml.slice(0, sources.maxHtmlBytes) : atsHtml,
          htmlTruncated: truncated,
          httpStatus: 200,
          redirectedUrl: null,
          fetchedAt: new Date().toISOString(),
        };
      }

      const res = await fetch(url, {
        headers: { "user-agent": sources.defaultUserAgent },
        signal: AbortSignal.timeout(sources.defaultFetchTimeoutMs),
        redirect: "follow",
      });
      const contentType = res.headers.get("content-type")?.toLowerCase() ?? "";
      const html = contentType.includes("application/pdf") || parsedUrl.pathname.toLowerCase().endsWith(".pdf")
        ? await pdfToHtml(await res.arrayBuffer())
        : await res.text();
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

export async function acquirePage(url: string, config?: CrawlConfig): Promise<AcquisitionResult> {
  if (!(await isAllowedByRobots(url))) {
    throw new Error(`Disallowed by robots.txt: ${url}`);
  }

  const release = await acquireHostSlot(new URL(url).hostname);
  try {
    return await fetchWithRetry(url, config);
  } finally {
    release();
  }
}
