/**
 * Shared types for the ingestion pipeline. RawExtractionBundle is what's stored in
 * RawJob.payload (Section A4 of the plan); AggregationResult is what's stored in
 * ImprovementRun.diff (Section A5) — both are Json columns, these types just give the code that
 * reads/writes them a fixed shape to agree on.
 */

export type FieldSource = "jsonld" | "selectors" | "general_html" | "readability" | "ai_inference";

export interface FieldCandidate<T = string> {
  value: T;
  source: FieldSource;
  confidence: number;
}

/** One JSON-LD object found on the page whose @type is (or includes) "JobPosting". */
export type JobPostingJsonLd = Record<string, unknown>;

export interface SelectorFields {
  title?: string;
  company?: string;
  location?: string;
  description?: string;
  applyUrl?: string;
  postedAt?: string;
  salary?: string;
}

export interface PageMetadata {
  title?: string;
  description?: string;
  ogTitle?: string;
  ogDescription?: string;
  canonicalUrl?: string;
}

export interface ExtractorError {
  extractor: string;
  message: string;
}

/** Deterministic pre-AI merge of every extractor's candidate values (reconcile.ts). */
export interface ReconciledFields {
  title: FieldCandidate | null;
  company: FieldCandidate | null;
  location: FieldCandidate | null;
  description: FieldCandidate | null;
  applyUrl: FieldCandidate | null;
  salaryText: FieldCandidate | null;
  postedAtText: FieldCandidate | null;
}

/**
 * The full raw extraction bundle for one detail page — stored verbatim in RawJob.payload.
 * Includes the already-reconciled fields (not just the raw per-extractor output) so the
 * aggregation drain step — which may run in a later tick than acquisition — doesn't need to
 * re-parse HTML or re-derive which tier each field's value came from.
 */
export interface RawExtractionBundle {
  originalUrl: string;
  canonicalUrl: string | null;
  httpStatus: number;
  fetchedAt: string;
  html: string;
  htmlTruncated: boolean;
  jsonLd: JobPostingJsonLd[];
  selectors: SelectorFields;
  readableText: string | null;
  markdown: string | null;
  metadata: PageMetadata;
  errors: ExtractorError[];
  reconciled: ReconciledFields;
}

export interface NormalizedJobFields {
  externalId: string;
  title: string | null;
  company: string | null;
  location: string | null;
  remoteType: "ONSITE" | "HYBRID" | "REMOTE" | null;
  employmentType: "FULL_TIME" | "PART_TIME" | "CONTRACT" | "INTERNSHIP" | "TEMPORARY" | null;
  salaryMin: number | null;
  salaryMax: number | null;
  salaryCurrency: string | null;
  salaryPeriod: "HOURLY" | "DAILY" | "WEEKLY" | "MONTHLY" | "YEARLY" | null;
  description: string | null;
  skills: string[];
  postedAt: string | null;
  closesAt: string | null;
  applyUrl: string | null;
  sourceUrl: string;
}

/** The AI aggregation stage's output — stored verbatim in ImprovementRun.diff. */
export interface AggregationResult {
  normalized: NormalizedJobFields;
  fieldConfidence: Partial<Record<keyof NormalizedJobFields, number>>;
  fieldSource: Partial<Record<keyof NormalizedJobFields, FieldSource>>;
}
