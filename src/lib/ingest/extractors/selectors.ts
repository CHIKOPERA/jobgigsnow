import { load, type CheerioAPI } from "cheerio";
import type { CrawlConfig } from "@/lib/validation/source";
import type { FieldCandidate, PageMetadata, ReconciledFields, SelectorFields } from "../types";

function resolveUrl(href: string | undefined, pageUrl: string): string | undefined {
  if (!href) return undefined;
  try {
    return new URL(href, pageUrl).toString();
  } catch {
    return undefined;
  }
}

export function extractMetadata(html: string, pageUrl: string): PageMetadata {
  const $ = load(html);
  return {
    title: $("title").first().text().trim() || undefined,
    description: $('meta[name="description"]').attr("content")?.trim() || undefined,
    ogTitle: $('meta[property="og:title"]').attr("content")?.trim() || undefined,
    ogDescription: $('meta[property="og:description"]').attr("content")?.trim() || undefined,
    canonicalUrl: resolveUrl($('link[rel="canonical"]').attr("href")?.trim(), pageUrl),
  };
}

type SelectorField = keyof SelectorFields;

// General-HTML fallback tier — tried only when a source-specific selector (crawlConfig.detailSelectors)
// is absent or comes back empty. Ordered by specificity.
const GENERAL_SELECTORS: Record<SelectorField, string[]> = {
  title: ["[itemprop='title']", "h1"],
  company: ["[itemprop='hiringOrganization']", ".company-name", ".company"],
  location: ["[itemprop='jobLocation']", ".job-location", ".location"],
  description: ["[itemprop='description']", ".job-description", "article"],
  applyUrl: ["a[href*='apply' i]"],
  postedAt: ["[itemprop='datePosted']", "time[datetime]"],
  salary: ["[itemprop='baseSalary']", ".salary"],
};

const RECONCILED_KEY: Record<SelectorField, keyof ReconciledFields> = {
  title: "title",
  company: "company",
  location: "location",
  description: "description",
  applyUrl: "applyUrl",
  postedAt: "postedAtText",
  salary: "salaryText",
};

function readField($: CheerioAPI, selector: string, field: SelectorField, pageUrl: string): string | undefined {
  const el = $(selector).first();
  if (el.length === 0) return undefined;

  if (field === "applyUrl") return resolveUrl(el.attr("href"), pageUrl);
  if (field === "postedAt") {
    const dateValue = el.attr("datetime") ?? el.attr("content");
    if (dateValue) return dateValue.trim();
  }

  const text = el.text().trim();
  if (text.length > 0) return text;

  // Microdata commonly stores values in meta/content or custom-element attributes rather than
  // text nodes (SmartRecruiters uses both forms for company and formatted location).
  const attributeValue = el.attr("content") ?? el.attr("formattedAddress") ?? el.attr("formattedaddress");
  return attributeValue?.trim() || undefined;
}

/**
 * Extracts detail-page fields using crawlConfig's source-specific selectors first, falling back
 * to general-HTML heuristics — the "selectors" and "general_html" tiers of the extraction
 * preference order. Returns both the flat SelectorFields (for the raw bundle) and reconciliation
 * candidates tagged with which tier actually produced each value.
 */
export function extractSelectorFields(
  html: string,
  pageUrl: string,
  detailSelectors?: CrawlConfig["detailSelectors"],
): { fields: SelectorFields; candidates: Partial<ReconciledFields> } {
  const $ = load(html);
  const fields: SelectorFields = {};
  const candidates: Partial<ReconciledFields> = {};

  const fieldKeys = Object.keys(RECONCILED_KEY) as SelectorField[];

  for (const field of fieldKeys) {
    const sourceSelector = detailSelectors?.[field];
    if (sourceSelector) {
      const value = readField($, sourceSelector, field, pageUrl);
      if (value) {
        fields[field] = value;
        candidates[RECONCILED_KEY[field]] = { value, source: "selectors", confidence: 0.85 } as FieldCandidate;
        continue;
      }
    }

    for (const fallback of GENERAL_SELECTORS[field]) {
      const value = readField($, fallback, field, pageUrl);
      if (value) {
        fields[field] = value;
        candidates[RECONCILED_KEY[field]] = { value, source: "general_html", confidence: 0.5 } as FieldCandidate;
        break;
      }
    }
  }

  return { fields, candidates };
}
