import { JSDOM } from "jsdom";
import { Readability } from "@mozilla/readability";
import type { ReconciledFields } from "../types";

export interface ReadabilityResult {
  text: string | null;
  title: string | null;
}

/** Isolates the main readable content of the page — the lowest-confidence pre-AI tier. */
export function extractReadable(html: string, pageUrl: string): ReadabilityResult {
  try {
    const dom = new JSDOM(html, { url: pageUrl });
    const article = new Readability(dom.window.document).parse();
    return {
      text: article?.textContent?.trim() || null,
      title: article?.title?.trim() || null,
    };
  } catch {
    return { text: null, title: null };
  }
}

export function readabilityToCandidates(result: ReadabilityResult): Partial<ReconciledFields> {
  if (!result.text) return {};
  return { description: { value: result.text, source: "readability", confidence: 0.4 } };
}
