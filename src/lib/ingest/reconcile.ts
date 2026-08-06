import type { FieldCandidate, ReconciledFields } from "./types";

const TIER_RANK: Record<FieldCandidate["source"], number> = {
  jsonld: 0,
  selectors: 1,
  general_html: 2,
  readability: 3,
  ai_inference: 4,
};

const FIELD_KEYS: (keyof ReconciledFields)[] = [
  "title",
  "company",
  "location",
  "description",
  "applyUrl",
  "salaryText",
  "postedAtText",
];

/**
 * Deterministic merge across every extractor's candidates, by preference order: JSON-LD > source
 * selectors > general HTML > Readability/Markdown (AI inference is a later stage, not an input
 * here). Each extractor already tags its own candidates with the correct tier, so this function
 * is extractor-agnostic — it just picks, per field, whichever candidate has the lowest tier rank.
 */
export function reconcile(...candidateSets: Partial<ReconciledFields>[]): ReconciledFields {
  const result = {} as ReconciledFields;

  for (const key of FIELD_KEYS) {
    let best: FieldCandidate | null = null;
    for (const set of candidateSets) {
      const candidate = set[key];
      if (!candidate) continue;
      if (!best || TIER_RANK[candidate.source] < TIER_RANK[best.source]) {
        best = candidate;
      }
    }
    result[key] = best;
  }

  return result;
}
