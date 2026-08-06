/**
 * Pure AggregationResult -> JobUpsertInput field mapping — no server-only/DB imports, so it's
 * unit-testable directly (mirrors discovery-diff.ts / job-filters.ts).
 */
import type { AggregationResult } from "./types";

export interface NormalizedFields {
  title: string;
  companyName: string;
  location: string;
  remoteType: "ONSITE" | "HYBRID" | "REMOTE";
  employmentType: "FULL_TIME" | "PART_TIME" | "CONTRACT" | "INTERNSHIP" | "TEMPORARY";
  salaryMin: number | null;
  salaryMax: number | null;
  salaryCurrency: string | null;
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
function findMissingFields(normalized: AggregationResult["normalized"]): string[] {
  const missing: string[] = [];
  if (!normalized.title) missing.push("title");
  if (!normalized.company) missing.push("company");
  if (!normalized.location) missing.push("location");
  if (!normalized.remoteType) missing.push("remoteType");
  if (!normalized.employmentType) missing.push("employmentType");
  if (!normalized.description) missing.push("description");
  return missing;
}

function toIsoDateTime(dateStr: string | null): string | null {
  if (!dateStr) return null;
  const date = new Date(dateStr);
  return Number.isNaN(date.getTime()) ? null : date.toISOString();
}

export function buildNormalizedFields(aggregation: AggregationResult, externalUrl: string): NormalizeFieldsResult {
  const { normalized } = aggregation;
  const missingFields = findMissingFields(normalized);
  if (missingFields.length > 0) return { ok: false, missingFields };

  return {
    ok: true,
    fields: {
      title: normalized.title!,
      companyName: normalized.company!,
      location: normalized.location!,
      remoteType: normalized.remoteType!,
      employmentType: normalized.employmentType!,
      salaryMin: normalized.salaryMin,
      salaryMax: normalized.salaryMin !== null ? normalized.salaryMax : null,
      salaryCurrency: normalized.salaryMin !== null ? normalized.salaryCurrency : null,
      salaryPeriod: normalized.salaryPeriod,
      description: normalized.description!,
      tags: normalized.skills,
      // No apply link found or inferred — the safe default is the page itself, since that's
      // always a valid way to apply (never null, never a fabricated URL).
      applyUrl: normalized.applyUrl ?? externalUrl,
      postedAt: toIsoDateTime(normalized.postedAt),
      closesAt: toIsoDateTime(normalized.closesAt),
    },
  };
}
