import "server-only";
import { generateText, Output } from "ai";
import { z } from "zod";
import { getAiModel } from "./ai-model";
import { sanitizeJobDescription } from "@/lib/job-rich-text";
import { renderSeoRewritePrompt, type SeoRewriteContext } from "./seo-rewrite-prompt";
import { getSeoRewritePrompt } from "./settings";

const seoOutputSchema = z.object({
  title: z.string().min(1),
  descriptionHtml: z.string().min(1),
  tags: z.array(z.string()),
});

export interface SeoRewriteOutcome {
  title: string;
  description: string;
  tags: string[];
  promptTemplate: string;
  inputTokens: number | undefined;
  outputTokens: number | undefined;
}

const SYSTEM_PROMPT =
  "You are an SEO editor for a job board. Rewrite for search visibility and readability without " +
  "inventing requirements, benefits, salary, dates, locations, or company facts not present in " +
  "the input. Return a clean HTML fragment for the description using only paragraphs, h2/h3, " +
  "bullet or numbered lists, strong, em, and links already present.";

/**
 * The post-aggregation SEO rewrite stage: takes an already-validated, already-aggregated job
 * (title/description/tags all guaranteed non-null by normalize.ts) and rewrites them for search
 * visibility using the admin-editable template from src/lib/ingest/settings.ts. This is what a
 * reviewer sees first in /admin/review — a pure text-quality pass, not a data-extraction step.
 */
export async function seoRewrite(ctx: SeoRewriteContext): Promise<SeoRewriteOutcome> {
  const template = await getSeoRewritePrompt();
  const prompt = renderSeoRewritePrompt(template, ctx);

  const { output, usage } = await generateText({
    model: getAiModel(),
    system: SYSTEM_PROMPT,
    prompt,
    output: Output.object({ schema: seoOutputSchema }),
  });

  const description = sanitizeJobDescription(output.descriptionHtml);
  if (!description) throw new Error("The SEO rewrite returned an empty description.");

  return {
    title: output.title.trim() || ctx.title,
    description,
    tags: output.tags.length > 0 ? output.tags : ctx.tags,
    promptTemplate: template,
    inputTokens: usage.inputTokens,
    outputTokens: usage.outputTokens,
  };
}
