import "server-only";
import { env } from "./env";

export const ai = {
  provider: env.AI_PROVIDER,
  model: env.AI_MODEL,
  anthropicApiKey: env.ANTHROPIC_API_KEY,
  openaiApiKey: env.OPENAI_API_KEY,
  promptVersion: "v1",
} as const;
