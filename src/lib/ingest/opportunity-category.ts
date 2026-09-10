import type { z } from "zod";
import type { opportunityCategorySchema } from "@/lib/validation/common";
import type { NormalizedJobFields } from "./types";

export type OpportunityCategory = z.infer<typeof opportunityCategorySchema>;

type CategoryRule = {
  category: Exclude<OpportunityCategory, "JOB">;
  pattern: RegExp;
};

// Specific opportunity types must win over generic wording such as "job", "position", or
// "applications are open". Title matches are checked first because a description can mention,
// for example, an internship as prior experience without the advertised role being one.
const TITLE_RULES: CategoryRule[] = [
  {
    category: "FUNDING",
    pattern: /\b(?:bursar(?:y|ies)|scholarships?|student funding|study grants?|research grants?|funding opportunit(?:y|ies)|financial aid)\b/i,
  },
  { category: "LEARNERSHIP", pattern: /\blearnerships?\b/i },
  { category: "APPRENTICESHIP", pattern: /\bapprenticeships?\b/i },
  { category: "INTERNSHIP", pattern: /\b(?:internships?|intern programme|intern program|student intern)\b/i },
  {
    category: "GRADUATE_PROGRAMME",
    pattern: /\b(?:graduate|graduates|young professional|management trainee)\s+(?:development\s+)?(?:programme|program|scheme|opportunit(?:y|ies))\b/i,
  },
  { category: "CALL_FOR_APPLICATIONS", pattern: /\bcall\s+for\s+(?:applications?|proposals?|submissions?|nominations?)\b/i },
];

// Description-only matches intentionally require wording that describes the opportunity itself.
// This avoids categorising a normal job from incidental phrases such as "previous internship".
const DESCRIPTION_RULES: CategoryRule[] = [
  {
    category: "FUNDING",
    pattern: /\b(?:apply|applications?|eligible|awarded?|funding)\b[\s\S]{0,100}\b(?:bursar(?:y|ies)|scholarships?|study grants?|research grants?|financial aid)\b|\b(?:bursar(?:y|ies)|scholarships?|study grants?|research grants?|financial aid)\b[\s\S]{0,100}\b(?:apply|applications?|eligible|awarded?|funding)\b/i,
  },
  { category: "LEARNERSHIP", pattern: /\b(?:this|the|a|our|offers? a|apply for (?:a|the))\s+learnership\b/i },
  { category: "APPRENTICESHIP", pattern: /\b(?:this|the|an|our|offers? an|apply for (?:an|the))\s+apprenticeship\b/i },
  { category: "INTERNSHIP", pattern: /\b(?:this|the|an|our|paid|unpaid|offers? an|apply for (?:an|the))\s+internship\b/i },
  {
    category: "GRADUATE_PROGRAMME",
    pattern: /\b(?:this|the|our|apply for (?:a|the))\s+(?:graduate|young professional|management trainee)\s+(?:development\s+)?(?:programme|program|scheme)\b/i,
  },
  { category: "CALL_FOR_APPLICATIONS", pattern: /\bcall\s+for\s+(?:applications?|proposals?|submissions?|nominations?)\b/i },
];

function plainText(value: string | null): string {
  return (value ?? "").replace(/<[^>]*>/g, " ").replace(/\s+/g, " ").trim();
}

/** Classifies an aggregated listing, falling back to JOB only when no specific signal exists. */
export function classifyOpportunity(fields: NormalizedJobFields): OpportunityCategory {
  const title = plainText(fields.title);
  const description = plainText(fields.description);

  for (const rule of TITLE_RULES) {
    if (rule.pattern.test(title)) return rule.category;
  }

  // The aggregation model already maps direct internship language to this employment type.
  if (fields.employmentType === "INTERNSHIP") return "INTERNSHIP";

  for (const rule of DESCRIPTION_RULES) {
    if (rule.pattern.test(description)) return rule.category;
  }

  return "JOB";
}
