import { z } from "zod";

const guidanceItemsSchema = z.array(z.string().max(300)).max(12);

/**
 * Structured applicant help extracted from the official vacancy. Empty strings, arrays, and a
 * zero estimate mean the source did not provide enough information; the public mapper removes
 * them instead of publishing guessed requirements.
 */
export const applicationGuidanceSchema = z.object({
  summary: z.string().max(600),
  essentialRequirements: guidanceItemsSchema,
  preferredRequirements: guidanceItemsSchema,
  qualifications: guidanceItemsSchema,
  experience: guidanceItemsSchema,
  documents: guidanceItemsSchema,
  licences: guidanceItemsSchema,
  applicationMethod: z.string().max(600),
  referenceNumber: z.string().max(160),
  estimatedApplicationMinutes: z.number().int().min(0).max(120),
});

export type ApplicationGuidance = z.infer<typeof applicationGuidanceSchema>;

export const EMPTY_APPLICATION_GUIDANCE: ApplicationGuidance = {
  summary: "",
  essentialRequirements: [],
  preferredRequirements: [],
  qualifications: [],
  experience: [],
  documents: [],
  licences: [],
  applicationMethod: "",
  referenceNumber: "",
  estimatedApplicationMinutes: 0,
};

export const APPLICATION_GUIDANCE_PROMPT = `Build applicationGuidance as a separate, quick-scan companion to the full description.
- summary: Write one or two sentences naming the two or three capabilities the employer or organisation emphasizes most and telling the applicant what evidence to foreground. Use "appears to" for interpretation.
- essentialRequirements, preferredRequirements, qualifications, experience, documents, and licences: Return concise items grounded in explicit source statements. Keep an array empty when the source does not state anything for it. Never turn JobGigsNow advice into an official requirement.
- applicationMethod and referenceNumber: Copy or concisely explain only what the source states; use an empty string when absent.
- estimatedApplicationMinutes: Estimate only the time to complete the stated application steps, excluding time to obtain documents or write a CV. Use 0 when the steps are too unclear to estimate.
- Do not repeat the deadline inside applicationGuidance; it is stored separately from the authoritative closing date.`;

function cleanItems(items: string[]): string[] {
  return [...new Set(items.map((item) => item.trim()).filter(Boolean))].slice(0, 12);
}

export function cleanApplicationGuidance(guidance: ApplicationGuidance): ApplicationGuidance {
  return {
    summary: guidance.summary.trim(),
    essentialRequirements: cleanItems(guidance.essentialRequirements),
    preferredRequirements: cleanItems(guidance.preferredRequirements),
    qualifications: cleanItems(guidance.qualifications),
    experience: cleanItems(guidance.experience),
    documents: cleanItems(guidance.documents),
    licences: cleanItems(guidance.licences),
    applicationMethod: guidance.applicationMethod.trim(),
    referenceNumber: guidance.referenceNumber.trim(),
    estimatedApplicationMinutes: guidance.estimatedApplicationMinutes,
  };
}

export function hasApplicationGuidance(guidance: ApplicationGuidance): boolean {
  return Boolean(
    guidance.summary ||
      guidance.essentialRequirements.length ||
      guidance.preferredRequirements.length ||
      guidance.qualifications.length ||
      guidance.experience.length ||
      guidance.documents.length ||
      guidance.licences.length ||
      guidance.applicationMethod ||
      guidance.referenceNumber ||
      guidance.estimatedApplicationMinutes,
  );
}
