import "server-only";
import { prisma } from "@/lib/prisma";

const SETTING_ID = "singleton";

export const DEFAULT_SEO_REWRITE_PROMPT = `Rewrite this job posting for search engine visibility and readability, in clear South African
English. Keep every factual requirement — never invent responsibilities, benefits, salary,
dates, or company facts that aren't already present below.

Job: {{title}} at {{company}}
Location: {{location}}
Work arrangement: {{remoteType}}
Employment type: {{employmentType}}
Current tags: {{tags}}
Application URL: {{applyUrl}}

Current description:
{{description}}

Return:
- An SEO-friendly title that naturally includes the role and location.
- A rewritten HTML description: short sections, useful bullet points for responsibilities and
  requirements, natural keyword usage — no keyword stuffing.
- 3 to 8 relevant tags (skills, tools, or role keywords a candidate might search for).`;

/** Returns the admin-editable SEO rewrite prompt template, or the built-in default if no admin
 *  has customized it yet. */
export async function getSeoRewritePrompt(): Promise<string> {
  const setting = await prisma.adminSetting.findUnique({ where: { id: SETTING_ID } });
  return setting?.seoRewritePrompt ?? DEFAULT_SEO_REWRITE_PROMPT;
}

export async function setSeoRewritePrompt(prompt: string): Promise<void> {
  await prisma.adminSetting.upsert({
    where: { id: SETTING_ID },
    update: { seoRewritePrompt: prompt },
    create: { id: SETTING_ID, seoRewritePrompt: prompt },
  });
}
