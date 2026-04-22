/**
 * Model catalog for BitBadgesAgent.
 *
 * Maps friendly names → actual Anthropic model IDs + pricing.
 * Pricing is used for the `costUsd` field on BuildResult.
 */

import type { ModelInfo as _ModelInfo, ModelName } from './types.js';

export type ModelInfo = _ModelInfo;

export const MODELS: Record<ModelName, ModelInfo> = {
  haiku: {
    id: 'claude-haiku-4-5-20251001',
    inputPerMTok: 1.0,
    outputPerMTok: 5.0
  },
  sonnet: {
    id: 'claude-sonnet-4-6',
    inputPerMTok: 3.0,
    outputPerMTok: 15.0
  },
  opus: {
    id: 'claude-opus-4-6',
    inputPerMTok: 5.0,
    outputPerMTok: 25.0
  }
};

export function resolveModel(name: ModelName | string | undefined): ModelInfo {
  if (!name) return MODELS.sonnet;
  if (name in MODELS) return MODELS[name as ModelName];
  // Assume it's already an Anthropic model ID and fall back to opus pricing as the safe upper bound.
  return { id: name, inputPerMTok: MODELS.opus.inputPerMTok, outputPerMTok: MODELS.opus.outputPerMTok };
}

export function computeCostUsd(inputTokens: number, outputTokens: number, model: ModelInfo): number {
  const inCost = (inputTokens / 1_000_000) * model.inputPerMTok;
  const outCost = (outputTokens / 1_000_000) * model.outputPerMTok;
  return inCost + outCost;
}
