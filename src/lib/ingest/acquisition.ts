import "server-only";
import { PDFParse } from "pdf-parse";
import { sources } from "@/config/sources";
import type { CrawlConfig } from "@/lib/validation/source";
import { acquireCornerstone } from "./cornerstone";
import { jobPostingHtml } from "./job-html";
import { fetchWithLightpanda, isLightpandaConfigured } from "./lightpanda";
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

interface SmartRecruitersDetail {
  name?: string;
  jobAd?: { sections?: { jobDescription?: { text?: string } } };
  location?: { city?: string; country?: string; remote?: boolean };
  company?: { name?: string; identifier?: string };
  employmentType?: string;
}

/** Whether this URL is a SmartRecruiters public job page (React SPA — use the API instead). */
export function isSmartRecruitersJobUrl(url: URL): boolean {
  return url.hostname === "jobs.smartrecruiters.com" && url.pathname.split("/").filter(Boolean).length >= 2;
}

/** Fetches a SmartRecruiters job via the public REST API instead of scraping the React SPA. */
async function acquireSmartRecruiters(url: URL, fetcher: typeof fetch = fetch): Promise<string> {
  const [company, jobId] = url.pathname.split("/").filter(Boolean);
  if (!company || !jobId) throw new Error("Unrecognized SmartRecruiters job URL.");
  const endpoint = `https://api.smartrecruiters.com/v1/companies/${encodeURIComponent(company)}/postings/${encodeURIComponent(jobId)}`;
  const res = await fetcher(endpoint, { headers: { accept: "application/json" } });
  if (!res.ok) throw new Error(`SmartRecruiters detail returned HTTP ${res.status}`);
  const job = (await res.json()) as SmartRecruitersDetail;
  if (!job.name) throw new Error("SmartRecruiters detail did not include a job title.");
  const location = job.location
    ? [job.location.city, job.location.country].filter(Boolean).join(", ")
    : undefined;
  return jobPostingHtml({
    title: job.name,
    company: job.company?.name,
    location: location || null,
    description: job.jobAd?.sections?.jobDescription?.text ?? null,
    employmentType: job.employmentType ?? null,
    applyUrl: url.toString(),
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
      } else if (isSmartRecruitersJobUrl(parsedUrl)) {
        atsHtml = await acquireSmartRecruiters(parsedUrl, fetchAts);
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

      // JS-rendered HTML: use Lightpanda Cloud if the source opts in and a token is set.
      if (config?.provider === "html" && config.jsRendering && isLightpandaConfigured()) {
        const { html, httpStatus } = await fetchWithLightpanda(url);
        const truncated = html.length > sources.maxHtmlBytes;
        return {
          html: truncated ? html.slice(0, sources.maxHtmlBytes) : html,
          htmlTruncated: truncated,
          httpStatus,
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
  const parsedUrl = new URL(url);

  // ATS providers that use a dedicated JSON API (Workday, Oracle, Cornerstone, SmartRecruiters)
  // never actually fetch the robots-checked HTML URL — they call a different API endpoint instead.
  // Skip the robots check for them to avoid incorrectly blocking a crawl because a site's
  // robots.txt disallows its public /hcmUI/, /ux/ats/, or /jobs/ paths.
  const usesAtsApi =
    isWorkdayJobUrl(parsedUrl) ||
    isOracleJobUrl(parsedUrl) ||
    isSmartRecruitersJobUrl(parsedUrl) ||
    (config?.provider === "cornerstone" && /\/requisition\//.test(parsedUrl.pathname));

  if (!usesAtsApi && !(await isAllowedByRobots(url))) {
    throw new Error(`Disallowed by robots.txt: ${url}`);
  }

  const release = await acquireHostSlot(parsedUrl.hostname);
  try {
    return await fetchWithRetry(url, config);
  } finally {
    release();
  }
}
