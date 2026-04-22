/**
 * Model catalog for BitBadgesBuilderAgent.
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
    id: 'claude-opus-4-7',
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

/**
 * Anthropic prompt-cache pricing multipliers relative to regular input token cost.
 * See https://docs.anthropic.com/en/docs/build-with-claude/prompt-caching#pricing
 *   - cache creation (write): 1.25x base input rate
 *   - cache read:             0.10x base input rate
 */
export const CACHE_WRITE_MULTIPLIER = 1.25;
export const CACHE_READ_MULTIPLIER = 0.1;

export function computeCostUsd(
  inputTokens: number,
  outputTokens: number,
  model: ModelInfo,
  cacheCreationTokens = 0,
  cacheReadTokens = 0
): number {
  const inCost = (inputTokens / 1_000_000) * model.inputPerMTok;
  const outCost = (outputTokens / 1_000_000) * model.outputPerMTok;
  const cacheWriteCost = (cacheCreationTokens / 1_000_000) * model.inputPerMTok * CACHE_WRITE_MULTIPLIER;
  const cacheReadCost = (cacheReadTokens / 1_000_000) * model.inputPerMTok * CACHE_READ_MULTIPLIER;
  return inCost + outCost + cacheWriteCost + cacheReadCost;
}
