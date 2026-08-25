/**
 * Pure discovery logic — no server-only/DB/network imports, so it's unit-testable directly
 * (mirrors why src/lib/job-filters.ts is split out from the DB-touching query code).
 */
import { load } from "cheerio";
import type { CrawlConfig } from "@/lib/validation/source";

type HtmlCrawlConfig = Extract<CrawlConfig, { provider: "html" }>;

/** CSS-selector link extraction off a listing page. */
export function extractListingLinks(html: string, pageUrl: string, config: HtmlCrawlConfig): string[] {
  const $ = load(html);
  const links = new Set<string>();

  $(config.linkSelector).each((_, el) => {
    const rawValue = $(el).attr(config.linkAttr ?? "href");
    if (!rawValue) return;
    let href = rawValue.trim();
    if (config.linkRegex) {
      const match = rawValue.match(new RegExp(config.linkRegex));
      if (!match) return;
      href = (match[1] ?? match[0]).trim();
    }
    try {
      links.add(new URL(href, pageUrl).toString());
    } catch {
      // Unparsable href — skip it, not fatal to the rest of the listing page.
    }
  });

  return [...links];
}

/** Conservative fallback for a listing page whose configured selector matched nothing. It only
 * accepts links with a strong detail-page signal; broad `/careers` and `/jobs` navigation links
 * are deliberately excluded. */
export function extractLikelyJobLinks(html: string, pageUrl: string): string[] {
  const $ = load(html);
  const links = new Set<string>();

  $("a[href]").each((_, el) => {
    const rawHref = $(el).attr("href")?.trim();
    if (!rawHref || /^(?:#|javascript:|mailto:|tel:)/i.test(rawHref)) return;

    try {
      const resolved = new URL(rawHref, pageUrl);
      if (!/^https?:$/.test(resolved.protocol) || resolved.toString() === new URL(pageUrl).toString()) return;

      const path = decodeURIComponent(resolved.pathname);
      const queryKeys = [...resolved.searchParams.keys()].map((key) => key.toLowerCase());
      const hasDetailPath = [
        /\/job\/[^/]+/i,
        /\/jobs\/(?:view|detail)\/[^/]+/i,
        /\/vacanc(?:y|ies)\/(?:view\/)?[^/]+/i,
        /\/requisition\/[^/]+/i,
        /\/(?:position|opportunity|listing)\/[^/]+/i,
        /(?:jobdetail|viewjob|vacancy-detail)/i,
      ].some((pattern) => pattern.test(path));
      const hasDetailQuery = queryKeys.some((key) =>
        ["jobid", "job_id", "listingid", "listing_id", "requisitionid", "requisition_id", "u"].includes(key),
      );
      const isJobDocument = path.toLowerCase().endsWith(".pdf") &&
        /\b(?:job|vacanc(?:y|ies)|position|internship|bursary|opportunity|advert|application)\b/i.test(
          `${$(el).text()} ${$(el).parent().text()}`,
        );

      if (hasDetailPath || hasDetailQuery || isJobDocument) links.add(resolved.toString());
    } catch {
      // Ignore malformed URLs and continue evaluating the rest of the page.
    }
  });

  return [...links];
}

/** Resolves the "next page" link, if any, off a listing page. */
export function findNextPageUrl(html: string, pageUrl: string, nextPageSelector: string): string | null {
  const $ = load(html);
  const href = $(nextPageSelector).first().attr("href");
  if (!href) return null;
  try {
    return new URL(href, pageUrl).toString();
  } catch {
    return null;
  }
}

export interface DiscoveryDiff {
  /** Live URLs not among the previously-active set — brand new or resurfacing after inactivity. */
  newUrls: string[];
  /** Live URLs that were already active and still are. */
  stillPresentUrls: string[];
  /** Previously-active rows absent from this pass's live set. */
  missingRows: { id: string; externalUrl: string }[];
}

/** Set-diff between this pass's live URLs and the previously-active RawJob rows. */
export function diffDiscoveredUrls(
  liveUrls: string[],
  previouslyActive: { id: string; externalUrl: string }[],
): DiscoveryDiff {
  const liveSet = new Set(liveUrls);
  const previousUrlSet = new Set(previouslyActive.map((r) => r.externalUrl));

  return {
    newUrls: liveUrls.filter((url) => !previousUrlSet.has(url)),
    stillPresentUrls: liveUrls.filter((url) => previousUrlSet.has(url)),
    missingRows: previouslyActive.filter((row) => !liveSet.has(row.externalUrl)),
  };
}

export function isSuspiciousEmptyDiscovery(
  liveUrlCount: number,
  previousActiveCount: number,
  minimumPreviousJobs: number,
): boolean {
  return liveUrlCount === 0 && previousActiveCount >= minimumPreviousJobs;
}
