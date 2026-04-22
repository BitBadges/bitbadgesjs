/**
 * Tests for model catalog: resolveModel + computeCostUsd.
 *
 * Pricing arithmetic is load-bearing for `BuildResult.costUsd` — we
 * verify the multipliers (1.25x cache write, 0.10x cache read)
 * produce the expected totals on worked examples, and that zero-token
 * inputs don't NaN.
 */

import { MODELS, resolveModel, computeCostUsd } from './models.js';

describe('resolveModel', () => {
  it('returns sonnet info for undefined', () => {
    expect(resolveModel(undefined)).toBe(MODELS.sonnet);
  });

  it('returns sonnet info for empty string (falsy)', () => {
    expect(resolveModel('')).toBe(MODELS.sonnet);
  });

  it('resolves friendly name "haiku"', () => {
    const info = resolveModel('haiku');
    expect(info.id).toBe('claude-haiku-4-5-20251001');
    expect(info.inputPerMTok).toBe(1.0);
    expect(info.outputPerMTok).toBe(5.0);
  });

  it('resolves friendly name "sonnet"', () => {
    const info = resolveModel('sonnet');
    expect(info.id).toBe('claude-sonnet-4-6');
    expect(info.inputPerMTok).toBe(3.0);
    expect(info.outputPerMTok).toBe(15.0);
  });

  it('resolves friendly name "opus"', () => {
    const info = resolveModel('opus');
    expect(info.id).toBe('claude-opus-4-6');
  });

  it('unknown string is treated as a raw Anthropic model ID with opus pricing fallback', () => {
    const info = resolveModel('claude-4-future-model');
    expect(info.id).toBe('claude-4-future-model');
    expect(info.inputPerMTok).toBe(MODELS.opus.inputPerMTok);
    expect(info.outputPerMTok).toBe(MODELS.opus.outputPerMTok);
  });
});

describe('computeCostUsd', () => {
  const sonnet = MODELS.sonnet;

  it('zero tokens → zero cost (no NaN)', () => {
    expect(computeCostUsd(0, 0, sonnet)).toBe(0);
    expect(computeCostUsd(0, 0, sonnet, 0, 0)).toBe(0);
    expect(Number.isFinite(computeCostUsd(0, 0, sonnet, 0, 0))).toBe(true);
  });

  it('basic input+output cost — sonnet 1M in / 1M out', () => {
    // 1M * $3 + 1M * $15 = $18
    expect(computeCostUsd(1_000_000, 1_000_000, sonnet)).toBeCloseTo(18.0, 6);
  });

  it('small token counts produce small costs', () => {
    // 1000 input, 500 output on sonnet = 1000/1M * 3 + 500/1M * 15 = 0.003 + 0.0075 = 0.0105
    expect(computeCostUsd(1000, 500, sonnet)).toBeCloseTo(0.0105, 6);
  });

  it('cache write multiplier is 1.25x base input rate', () => {
    // 1M cache_creation on sonnet = 1_000_000 / 1M * 3 * 1.25 = $3.75
    expect(computeCostUsd(0, 0, sonnet, 1_000_000, 0)).toBeCloseTo(3.75, 6);
  });

  it('cache read multiplier is 0.10x base input rate', () => {
    // 1M cache_read on sonnet = 1_000_000 / 1M * 3 * 0.10 = $0.30
    expect(computeCostUsd(0, 0, sonnet, 0, 1_000_000)).toBeCloseTo(0.3, 6);
  });

  it('composite cost — input + output + cache write + cache read on sonnet', () => {
    // 100k input, 50k output, 200k cache write, 500k cache read
    const expected =
      (100_000 / 1_000_000) * 3 + // 0.30
      (50_000 / 1_000_000) * 15 + // 0.75
      (200_000 / 1_000_000) * 3 * 1.25 + // 0.75
      (500_000 / 1_000_000) * 3 * 0.1; // 0.15
    expect(computeCostUsd(100_000, 50_000, sonnet, 200_000, 500_000)).toBeCloseTo(expected, 6);
    expect(computeCostUsd(100_000, 50_000, sonnet, 200_000, 500_000)).toBeCloseTo(1.95, 6);
  });

  it('opus pricing > sonnet for same load', () => {
    const opusCost = computeCostUsd(10_000, 5_000, MODELS.opus);
    const sonnetCost = computeCostUsd(10_000, 5_000, MODELS.sonnet);
    expect(opusCost).toBeGreaterThan(sonnetCost);
  });

  it('cache_read alone is far cheaper than equivalent regular input', () => {
    const cached = computeCostUsd(0, 0, sonnet, 0, 1_000_000);
    const uncached = computeCostUsd(1_000_000, 0, sonnet);
    expect(cached).toBeLessThan(uncached);
    // 0.10x ratio
    expect(cached / uncached).toBeCloseTo(0.1, 6);
  });
});
