/**
 * Pure prompt-templating logic — no server-only/AI-SDK imports, so it's unit-testable directly
 * (mirrors discovery-diff.ts / normalize-fields.ts / aggregate-merge.ts).
 */

export interface SeoRewriteContext {
  title: string;
  companyName: string;
  location: string;
  remoteType: string;
  employmentType: string;
  description: string;
  tags: string[];
  applyUrl: string | null;
}

const PLACEHOLDERS: Record<string, { label: string; resolve: (ctx: SeoRewriteContext) => string }> = {
  "{{title}}": { label: "Job title", resolve: (ctx) => ctx.title },
  "{{company}}": { label: "Company", resolve: (ctx) => ctx.companyName },
  "{{location}}": { label: "Location", resolve: (ctx) => ctx.location },
  "{{remoteType}}": { label: "Work arrangement", resolve: (ctx) => ctx.remoteType },
  "{{employmentType}}": { label: "Employment type", resolve: (ctx) => ctx.employmentType },
  "{{description}}": { label: "Source description", resolve: (ctx) => ctx.description },
  "{{tags}}": { label: "Current tags", resolve: (ctx) => ctx.tags.join(", ") },
  "{{applyUrl}}": { label: "Application URL", resolve: (ctx) => ctx.applyUrl ?? "(not provided)" },
};

/** Substitutes every known {{placeholder}} in an admin-edited template with the job's fields.
 *  Unknown placeholders (e.g. a typo) are left as-is rather than silently dropped, so a broken
 *  template is visibly broken in the AI's input instead of failing invisibly. */
export function renderSeoRewritePrompt(template: string, ctx: SeoRewriteContext): string {
  let result = template;
  for (const [placeholder, { resolve }] of Object.entries(PLACEHOLDERS)) {
    result = result.split(placeholder).join(resolve(ctx));
  }
  return result;
}

/** Renders an admin template and appends every authoritative job field that the template omitted.
 * This keeps free-form custom instructions safe: a template with no placeholders still receives
 * the actual job instead of asking the model to rewrite content it was never shown. */
export function buildSeoRewritePrompt(template: string, ctx: SeoRewriteContext): string {
  const rendered = renderSeoRewritePrompt(template, ctx);
  const omittedFacts = Object.entries(PLACEHOLDERS)
    .filter(([placeholder]) => !template.includes(placeholder))
    .map(([, { label, resolve }]) => `${label}: ${resolve(ctx)}`);

  if (omittedFacts.length === 0) return rendered;
  return `${rendered}\n\nAuthoritative job input (do not replace these facts):\n${omittedFacts.join("\n")}`;
}

function normalizedWords(value: string): string[] {
  const ignored = new Set(["the", "and", "for", "with", "from", "this", "that", "advert", "readvert"]);
  return value
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, " ")
    .trim()
    .split(/\s+/)
    .filter((word) => word.length >= 3 && !ignored.has(word));
}

function normalizeText(value: string): string {
  return value.toLowerCase().replace(/[^a-z0-9]+/g, " ").replace(/\s+/g, " ").trim();
}

function linksIn(html: string): string[] {
  return [...html.matchAll(/<a\b[^>]*>/gi)].map((anchor) => {
    const href = anchor[0].match(/\bhref\s*=\s*(?:"([^"]*)"|'([^']*)'|([^\s>]+))/i);
    return href?.[1] ?? href?.[2] ?? href?.[3] ?? "";
  });
}

/** Returns a reason when an SEO rewrite is not grounded in its source. The caller falls back to
 * the already-valid aggregated fields instead of publishing the untrusted rewrite. */
export function seoRewriteGroundingError(
  ctx: SeoRewriteContext,
  output: { title: string; descriptionHtml: string },
): string | null {
  const sourceTitleWords = normalizedWords(ctx.title);
  const outputTitleWords = new Set(normalizedWords(output.title));
  const requiredOverlap = Math.max(1, Math.ceil(sourceTitleWords.length * 0.4));
  const overlap = sourceTitleWords.filter((word) => outputTitleWords.has(word)).length;
  if (overlap < requiredOverlap) return "The SEO rewrite title is not grounded in the source job title.";

  const combinedOutput = normalizeText(`${output.title} ${output.descriptionHtml}`);
  if (!combinedOutput.includes(normalizeText(ctx.companyName))) {
    return "The SEO rewrite does not identify the source company.";
  }

  const allowedUrl = ctx.applyUrl ? new URL(ctx.applyUrl).toString() : null;
  for (const href of linksIn(output.descriptionHtml)) {
    let normalizedHref: string;
    try {
      normalizedHref = new URL(href).toString();
    } catch {
      return "The SEO rewrite contains an invalid application link.";
    }
    if (!allowedUrl || normalizedHref !== allowedUrl) {
      return "The SEO rewrite contains a link that was not present in the source job.";
    }
  }

  return null;
}
