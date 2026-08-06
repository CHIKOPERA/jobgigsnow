/**
 * Pure AI-output <-> deterministic-candidate merge logic — no server-only/AI-SDK imports, so it's
 * unit-testable directly (mirrors discovery-diff.ts / normalize-fields.ts). This is where the
 * "never invent missing information" guard actually lives.
 */
import { z } from "zod";
import type { AggregationResult, FieldSource, NormalizedJobFields, ReconciledFields } from "./types";

// Below this self-reported confidence, an AI-only field (no deterministic candidate backing it)
// is nulled out rather than trusted.
export const MIN_INFERENCE_CONFIDENCE = 0.5;

export const aiOutputSchema = z.object({
  title: z.string().nullable(),
  company: z.string().nullable(),
  location: z.string().nullable(),
  description: z.string().nullable(),
  applyUrl: z.string().nullable(),
  remoteType: z.enum(["ONSITE", "HYBRID", "REMOTE"]).nullable(),
  employmentType: z.enum(["FULL_TIME", "PART_TIME", "CONTRACT", "INTERNSHIP", "TEMPORARY"]).nullable(),
  salaryMin: z.number().int().nullable(),
  salaryMax: z.number().int().nullable(),
  salaryCurrency: z.string().nullable(),
  salaryPeriod: z.enum(["HOURLY", "DAILY", "WEEKLY", "MONTHLY", "YEARLY"]).nullable(),
  skills: z.array(z.string()),
  postedAt: z.string().nullable(),
  closesAt: z.string().nullable(),
  // Named, non-nullable numbers (0 means "no support/not found") rather than `.nullable()`
  // columns — a bare nullable number per field pushed this schema over the provider's
  // union-parameter limit ("20 parameters with unions, limit 16"), and a dynamic z.record()
  // fixed the limit but gave the model far weaker structural guidance about which keys to
  // actually fill in, which silently zeroed out every inferred field. Plain named numbers avoid
  // both problems: no union, and explicit per-field guidance.
  inferredFieldConfidence: z.object({
    remoteType: z.number().min(0).max(1).default(0),
    employmentType: z.number().min(0).max(1).default(0),
    salaryMin: z.number().min(0).max(1).default(0),
    salaryPeriod: z.number().min(0).max(1).default(0),
    postedAt: z.number().min(0).max(1).default(0),
    closesAt: z.number().min(0).max(1).default(0),
    skills: z.number().min(0).max(1).default(0),
  }),
});
export type AiOutput = z.infer<typeof aiOutputSchema>;

function describeCandidate(label: string, candidate: ReconciledFields[keyof ReconciledFields]): string {
  return candidate
    ? `${label}: ${candidate.value} (source: ${candidate.source}, confidence: ${candidate.confidence})`
    : `${label}: (not found by deterministic extraction)`;
}

export function buildPrompt(externalUrl: string, reconciled: ReconciledFields, context: string): string {
  return `You are reconciling a job posting scraped from ${externalUrl}.

Deterministic extraction already found:
${describeCandidate("Title", reconciled.title)}
${describeCandidate("Company", reconciled.company)}
${describeCandidate("Location", reconciled.location)}
${describeCandidate("Description", reconciled.description)}
${describeCandidate("Apply URL", reconciled.applyUrl)}
${describeCandidate("Salary text", reconciled.salaryText)}
${describeCandidate("Posted date text", reconciled.postedAtText)}

Page content, for anything the deterministic extraction missed:
${context.slice(0, 12_000)}

Instructions:
- Prefer the deterministic values above when present and plausible. Only replace title, company,
  location, description, or applyUrl if the deterministic value is clearly wrong given the page
  content.
- remoteType and employmentType are required on every job record, so make your best good-faith
  reading whenever the content gives any signal, and treat direct keywords as high confidence
  (0.8+), not as something to be cautious about — this is reading stated content, not inventing:
  "remote"/"work from home" -> REMOTE; "on-site"/"in office"/"in person" -> ONSITE; "hybrid" ->
  HYBRID; "full-time" -> FULL_TIME; "part-time" -> PART_TIME; "contract"/"contractor" -> CONTRACT;
  "internship"/"intern" -> INTERNSHIP; "temporary"/"temp" -> TEMPORARY. Only return null for
  either field if the content truly gives no such signal at all.
- Derive salaryMin/salaryMax/salaryCurrency/salaryPeriod, postedAt, closesAt, and skills from the
  page content the same way — if a field is not actually stated or clearly implied, return null
  for it rather than inventing a value with no basis in the content.
- Fill in every field of inferredFieldConfidence with your confidence (0 to 1) that the
  corresponding value above is correct and actually supported by the content — 0 means you found
  no support at all for that field (which is exactly what leaving remoteType/employmentType/etc.
  null above should look like), not something to avoid setting. Don't under-report confidence for
  something the content directly states — a field with a null value should get a confidence of 0.
- postedAt and closesAt must be ISO 8601 dates ("YYYY-MM-DD") or null.`;
}

function pickBaseField(
  candidate: ReconciledFields[keyof ReconciledFields],
  aiValue: string | null,
): { value: string | null; source: FieldSource; confidence: number } {
  if (candidate && aiValue === candidate.value) {
    return { value: candidate.value, source: candidate.source, confidence: candidate.confidence };
  }
  if (aiValue) {
    // The AI either filled a gap or overrode the deterministic candidate — either way, flag it as
    // AI-supplied so a human reviewing field provenance sees it wasn't a direct extraction.
    return { value: aiValue, source: "ai_inference", confidence: 0.5 };
  }
  if (candidate) {
    return { value: candidate.value, source: candidate.source, confidence: candidate.confidence };
  }
  return { value: null, source: "ai_inference", confidence: 0 };
}

function pickInferredField<T>(
  value: T | null,
  confidence: number | null | undefined,
): { value: T | null; confidence: number } {
  const clamped = typeof confidence === "number" ? confidence : 0;
  if (value === null || clamped < MIN_INFERENCE_CONFIDENCE) {
    return { value: null, confidence: 0 };
  }
  return { value, confidence: clamped };
}

/** Merges the AI's structured output with the deterministic candidates into the final
 *  AggregationResult — the "never invent missing information" guard lives in pickInferredField. */
export function toAggregationResult(externalUrl: string, reconciled: ReconciledFields, ai: AiOutput): AggregationResult {
  const normalized: NormalizedJobFields = {
    externalId: externalUrl,
    sourceUrl: externalUrl,
    title: null,
    company: null,
    location: null,
    description: null,
    applyUrl: null,
    remoteType: null,
    employmentType: null,
    salaryMin: null,
    salaryMax: null,
    salaryCurrency: null,
    salaryPeriod: null,
    skills: [],
    postedAt: null,
    closesAt: null,
  };
  const fieldConfidence: AggregationResult["fieldConfidence"] = {};
  const fieldSource: AggregationResult["fieldSource"] = {};

  for (const key of ["title", "company", "location", "description", "applyUrl"] as const) {
    const picked = pickBaseField(reconciled[key], ai[key]);
    normalized[key] = picked.value;
    if (picked.value !== null) {
      fieldConfidence[key] = picked.confidence;
      fieldSource[key] = picked.source;
    }
  }

  const confidence = ai.inferredFieldConfidence;
  const remote = pickInferredField(ai.remoteType, confidence.remoteType);
  normalized.remoteType = remote.value;
  const employment = pickInferredField(ai.employmentType, confidence.employmentType);
  normalized.employmentType = employment.value;
  const salaryMin = pickInferredField(ai.salaryMin, confidence.salaryMin);
  normalized.salaryMin = salaryMin.value;
  // salaryMax/salaryCurrency ride along with the salaryMin confidence — there's no separate
  // self-reported score for them and they're meaningless without a salaryMin.
  normalized.salaryMax = salaryMin.value !== null ? ai.salaryMax : null;
  normalized.salaryCurrency = salaryMin.value !== null ? ai.salaryCurrency : null;
  const salaryPeriod = pickInferredField(ai.salaryPeriod, confidence.salaryPeriod);
  normalized.salaryPeriod = salaryPeriod.value;
  const postedAt = pickInferredField(ai.postedAt, confidence.postedAt);
  normalized.postedAt = postedAt.value;
  const closesAt = pickInferredField(ai.closesAt, confidence.closesAt);
  normalized.closesAt = closesAt.value;
  const skills = pickInferredField(ai.skills.length > 0 ? ai.skills : null, confidence.skills);
  normalized.skills = skills.value ?? [];

  for (const [key, picked] of [
    ["remoteType", remote],
    ["employmentType", employment],
    ["salaryMin", salaryMin],
    ["salaryPeriod", salaryPeriod],
    ["postedAt", postedAt],
    ["closesAt", closesAt],
    ["skills", skills],
  ] as const) {
    if (picked.value !== null) {
      fieldConfidence[key] = picked.confidence;
      fieldSource[key] = "ai_inference";
    }
  }

  return { normalized, fieldConfidence, fieldSource };
}
