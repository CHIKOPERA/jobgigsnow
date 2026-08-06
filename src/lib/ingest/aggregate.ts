import "server-only";
import { generateText, Output } from "ai";
import { getAiModel } from "./ai-model";
import { aiOutputSchema, buildPrompt, toAggregationResult } from "./aggregate-merge";
import type { AggregationResult, ReconciledFields } from "./types";

export interface AggregateParams {
  externalUrl: string;
  reconciled: ReconciledFields;
  markdown: string | null;
  readableText: string | null;
}

export interface AggregateOutcome {
  result: AggregationResult;
  inputTokens: number | undefined;
  outputTokens: number | undefined;
}

export async function aggregate(params: AggregateParams): Promise<AggregateOutcome> {
  const context = params.markdown ?? params.readableText ?? "(no page content available)";
  const prompt = buildPrompt(params.externalUrl, params.reconciled, context);

  const { output, usage } = await generateText({
    model: getAiModel(),
    prompt,
    output: Output.object({ schema: aiOutputSchema }),
  });

  return {
    result: toAggregationResult(params.externalUrl, params.reconciled, output),
    inputTokens: usage.inputTokens,
    outputTokens: usage.outputTokens,
  };
}
