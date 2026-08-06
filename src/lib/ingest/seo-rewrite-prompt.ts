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
}

const PLACEHOLDERS: Record<string, (ctx: SeoRewriteContext) => string> = {
  "{{title}}": (ctx) => ctx.title,
  "{{company}}": (ctx) => ctx.companyName,
  "{{location}}": (ctx) => ctx.location,
  "{{remoteType}}": (ctx) => ctx.remoteType,
  "{{employmentType}}": (ctx) => ctx.employmentType,
  "{{description}}": (ctx) => ctx.description,
  "{{tags}}": (ctx) => ctx.tags.join(", "),
};

/** Substitutes every known {{placeholder}} in an admin-edited template with the job's fields.
 *  Unknown placeholders (e.g. a typo) are left as-is rather than silently dropped, so a broken
 *  template is visibly broken in the AI's input instead of failing invisibly. */
export function renderSeoRewritePrompt(template: string, ctx: SeoRewriteContext): string {
  let result = template;
  for (const [placeholder, resolve] of Object.entries(PLACEHOLDERS)) {
    result = result.split(placeholder).join(resolve(ctx));
  }
  return result;
}
