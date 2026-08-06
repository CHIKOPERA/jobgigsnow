import "server-only";
import { createAnthropic } from "@ai-sdk/anthropic";
import { createOpenAI } from "@ai-sdk/openai";
import type { LanguageModel } from "ai";
import { ai } from "@/config/ai";

/** Resolves the active provider's model per src/config/ai.ts — the only place that needs to
 *  change to swap providers (Section 2 of the plan's confirmed decisions). */
export function getAiModel(): LanguageModel {
  if (ai.provider === "anthropic") {
    return createAnthropic({ apiKey: ai.anthropicApiKey })(ai.model);
  }
  return createOpenAI({ apiKey: ai.openaiApiKey })(ai.model);
}
