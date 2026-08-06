import { load } from "cheerio";
import type { FieldCandidate, JobPostingJsonLd, ReconciledFields } from "../types";

function isJobPosting(obj: unknown): obj is JobPostingJsonLd {
  if (!obj || typeof obj !== "object") return false;
  const type = (obj as Record<string, unknown>)["@type"];
  if (typeof type === "string") return type === "JobPosting";
  if (Array.isArray(type)) return type.includes("JobPosting");
  return false;
}

function flatten(parsed: unknown): unknown[] {
  if (Array.isArray(parsed)) return parsed.flatMap(flatten);
  if (parsed && typeof parsed === "object") {
    const graph = (parsed as Record<string, unknown>)["@graph"];
    if (Array.isArray(graph)) return graph.flatMap(flatten);
    return [parsed];
  }
  return [];
}

/** Finds every <script type="application/ld+json"> block whose @type is (or includes) JobPosting. */
export function extractJsonLd(html: string): JobPostingJsonLd[] {
  const $ = load(html);
  const results: JobPostingJsonLd[] = [];

  $('script[type="application/ld+json"]').each((_, el) => {
    const raw = $(el).contents().text();
    try {
      const parsed = JSON.parse(raw);
      for (const candidate of flatten(parsed)) {
        if (isJobPosting(candidate)) results.push(candidate as JobPostingJsonLd);
      }
    } catch {
      // Malformed JSON-LD on the page — not fatal, just no candidates from this block.
    }
  });

  return results;
}

function stringField(value: unknown): string | null {
  return typeof value === "string" && value.trim().length > 0 ? value.trim() : null;
}

function formatCompany(org: unknown): string | null {
  if (typeof org === "string") return stringField(org);
  if (org && typeof org === "object") return stringField((org as Record<string, unknown>).name);
  return null;
}

function formatLocation(jobLocation: unknown): string | null {
  const loc = Array.isArray(jobLocation) ? jobLocation[0] : jobLocation;
  if (typeof loc === "string") return stringField(loc);
  if (!loc || typeof loc !== "object") return null;

  const address = (loc as Record<string, unknown>).address;
  const addr = Array.isArray(address) ? address[0] : address;
  if (typeof addr === "string") return stringField(addr);
  if (!addr || typeof addr !== "object") return null;

  const a = addr as Record<string, unknown>;
  const parts = [a.addressLocality, a.addressRegion, a.addressCountry].filter(
    (p): p is string => typeof p === "string" && p.trim().length > 0,
  );
  return parts.length > 0 ? parts.join(", ") : null;
}

function formatSalary(baseSalary: unknown): string | null {
  if (!baseSalary || typeof baseSalary !== "object") return null;
  const bs = baseSalary as Record<string, unknown>;
  const currency = stringField(bs.currency) ?? "";
  const value = bs.value;

  if (value && typeof value === "object") {
    const v = value as Record<string, unknown>;
    const unit = stringField(v.unitText) ?? "";
    const range = [v.minValue, v.maxValue].filter((n) => typeof n === "number");
    if (range.length > 0) return [currency, range.join("-"), unit].filter(Boolean).join(" ").trim() || null;
    if (typeof v.value === "number") return [currency, v.value, unit].filter(Boolean).join(" ").trim() || null;
  }
  if (typeof value === "number") return [currency, value].filter(Boolean).join(" ").trim() || null;
  return null;
}

function plainTextDescription(description: unknown): string | null {
  const raw = stringField(description);
  if (!raw) return null;
  return /<[a-z][\s\S]*>/i.test(raw) ? load(raw).text().trim() : raw;
}

/** Converts JobPosting JSON-LD objects into reconciliation candidates (Section preference tier 1). */
export function jsonLdToCandidates(postings: JobPostingJsonLd[]): Partial<ReconciledFields> {
  const candidates: Partial<ReconciledFields> = {};
  const confidence = 0.95;

  const set = <K extends keyof ReconciledFields>(key: K, value: string | null) => {
    if (value && !candidates[key]) {
      candidates[key] = { value, source: "jsonld", confidence } as FieldCandidate;
    }
  };

  for (const posting of postings) {
    set("title", stringField(posting.title));
    set("company", formatCompany(posting.hiringOrganization));
    set("location", formatLocation(posting.jobLocation));
    set("description", plainTextDescription(posting.description));
    set("salaryText", formatSalary(posting.baseSalary));
    set("postedAtText", stringField(posting.datePosted));
  }

  return candidates;
}
