/**
 * Pure AggregationResult -> JobUpsertInput field mapping — no server-only/DB imports, so it's
 * unit-testable directly (mirrors discovery-diff.ts / job-filters.ts).
 */
import type { AggregationResult } from "./types";
import { toEditorHtml } from "@/lib/job-rich-text";
import type { JobIndustryValue, ProvinceValue } from "@/config/job-taxonomy";
import { isExpiredClosingDate } from "@/lib/job-expiration";
import type { OpportunityCategory } from "./opportunity-category";

export interface NormalizedFields {
  title: string;
  companyName: string;
  location: string;
  industry: JobIndustryValue;
  province: ProvinceValue;
  remoteType: "ONSITE" | "HYBRID" | "REMOTE";
  employmentType: "FULL_TIME" | "PART_TIME" | "CONTRACT" | "INTERNSHIP" | "TEMPORARY";
  salaryMin: number | null;
  salaryMax: number | null;
  salaryCurrency: "ZAR" | null;
  salaryPeriod: "HOURLY" | "DAILY" | "WEEKLY" | "MONTHLY" | "YEARLY" | null;
  description: string;
  tags: string[];
  applyUrl: string;
  postedAt: string | null;
  closesAt: string | null;
}

export type NormalizeFieldsResult = { ok: true; fields: NormalizedFields } | { ok: false; missingFields: string[] };

// Required by jobUpsertInputSchema (src/lib/validation/ingest.ts) with no default — if the
// aggregation stage couldn't support one of these with anything from the page, this is a
// validation failure, not something to paper over with a placeholder.
function findMissingFields(
  normalized: AggregationResult["normalized"],
  category: OpportunityCategory,
): string[] {
  const missing: string[] = [];
  if (!normalized.title) missing.push("title");
  if (!normalized.company) missing.push("company");
  if (category !== "FUNDING" && category !== "CALL_FOR_APPLICATIONS") {
    if (!normalized.location) missing.push("location");
    if (!normalized.remoteType) missing.push("remoteType");
    if (!normalized.employmentType) missing.push("employmentType");
  }
  if (!normalized.description) missing.push("description");
  return missing;
}

function toIsoDateTime(dateStr: string | null): string | null {
  if (!dateStr) return null;
  const date = new Date(dateStr);
  return Number.isNaN(date.getTime()) ? null : date.toISOString();
}

function toClosingIsoDateTime(dateStr: string | null): string | null {
  if (!dateStr) return null;
  if (/^\d{4}-\d{2}-\d{2}$/.test(dateStr.trim())) return `${dateStr.trim()}T23:59:59.999Z`;
  return toIsoDateTime(dateStr);
}

export function buildNormalizedFields(
  aggregation: AggregationResult,
  externalUrl: string,
  category: OpportunityCategory = "JOB",
): NormalizeFieldsResult {
  const { normalized } = aggregation;
  if (isExpiredClosingDate(normalized.closesAt)) {
    return { ok: false, missingFields: ["closesAt (expired)"] };
  }
  const missingFields = findMissingFields(normalized, category);
  if (missingFields.length > 0) return { ok: false, missingFields };

  // These columns predate non-employment opportunities and remain non-null in the database.
  // Compatibility values are hidden on funding/call cards; they must not block otherwise valid
  // bursaries, scholarships, fellowships, or calls that have no workplace attributes.
  const isNonEmploymentOpportunity = category === "FUNDING" || category === "CALL_FOR_APPLICATIONS";

  return {
    ok: true,
    fields: {
      title: normalized.title!,
      companyName: normalized.company!,
      location: normalized.location ?? "Not location-specific",
      industry: normalized.industry,
      province: normalized.province,
      remoteType: normalized.remoteType ?? "ONSITE",
      employmentType: normalized.employmentType ?? "TEMPORARY",
      salaryMin: isNonEmploymentOpportunity ? null : normalized.salaryMin,
      salaryMax: !isNonEmploymentOpportunity && normalized.salaryMin !== null ? normalized.salaryMax : null,
      salaryCurrency: !isNonEmploymentOpportunity && normalized.salaryMin !== null ? "ZAR" : null,
      salaryPeriod: isNonEmploymentOpportunity ? null : normalized.salaryPeriod,
      description: toEditorHtml(normalized.description!),
      tags: normalized.skills,
      // No apply link found or inferred — the safe default is the page itself, since that's
      // always a valid way to apply (never null, never a fabricated URL).
      applyUrl: normalized.applyUrl ?? externalUrl,
      postedAt: toIsoDateTime(normalized.postedAt),
      closesAt: toClosingIsoDateTime(normalized.closesAt),
    },
  };
}
