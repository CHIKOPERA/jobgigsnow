import "server-only";
import { prisma } from "@/lib/prisma";
import { JOBGIGSNOW_EDITORIAL_GUIDE } from "./editorial-guide";

const SETTING_ID = "singleton";

export const DEFAULT_SEO_REWRITE_PROMPT = `${JOBGIGSNOW_EDITORIAL_GUIDE}

Job: {{title}} at {{company}}
Location: {{location}}
Work arrangement: {{remoteType}}
Employment type: {{employmentType}}
Current tags: {{tags}}
Application URL: {{applyUrl}}

Current description:
{{description}}

Return:
- The exact original title without additions.
- A useful HTML opportunity guide that follows the editorial rules above.
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

export const DEFAULT_AGENT_SETTINGS = {
  agentEnabled: true,
  dailyViewGoal: 300,
  dailyPublishMin: 5,
  dailyPublishMax: 10,
  categoryMinimum: 5,
} as const;

export async function getAgentSettings() {
  const setting = await prisma.adminSetting.findUnique({
    where: { id: SETTING_ID },
    select: {
      agentEnabled: true,
      dailyViewGoal: true,
      dailyPublishMin: true,
      dailyPublishMax: true,
      categoryMinimum: true,
    },
  });
  return setting ?? DEFAULT_AGENT_SETTINGS;
}

export async function setAgentSettings(settings: {
  agentEnabled: boolean;
  dailyViewGoal: number;
  dailyPublishMin: number;
  dailyPublishMax: number;
  categoryMinimum: number;
}) {
  return prisma.adminSetting.upsert({
    where: { id: SETTING_ID },
    update: settings,
    create: { id: SETTING_ID, seoRewritePrompt: DEFAULT_SEO_REWRITE_PROMPT, ...settings },
    select: {
      agentEnabled: true,
      dailyViewGoal: true,
      dailyPublishMin: true,
      dailyPublishMax: true,
      categoryMinimum: true,
    },
  });
}
