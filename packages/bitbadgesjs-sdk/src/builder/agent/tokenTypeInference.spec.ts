/**
 * Unit tests for the smart token-type inference module.
 *
 * The LLM branch is exercised via a fake `LLMProvider.classify()`
 * implementation that returns a canned response — no peer-dep required.
 * Both Anthropic and OpenAI providers route through the same
 * `provider.classify()` boundary so a single fake covers both.
 */

import {
  buildInferenceSchema,
  buildInferenceSystemPrompt,
  buildInferenceUserPrompt,
  extractStandards,
  getTokenTypeSkillIds,
  getTokenTypeSkills,
  inferFromStandards,
  inferTokenTypeFromPrompt,
  validateInferenceObject,
  STANDARD_TO_TOKEN_TYPE
} from './tokenTypeInference.js';
import type { LLMProvider, ProviderClassifyArgs, ProviderClassifyResponse } from './providers/types.js';

function makeFakeProvider(
  result: { parsed: Record<string, unknown> | null; usage?: any; model?: string; costUsd?: number } | { error: Error },
  opts: { captureArgs?: { value: any }; name?: string; defaultClassifyModel?: string } = {}
): LLMProvider & { classifyMock: jest.Mock } {
  const classifyMock = jest.fn(async (args: ProviderClassifyArgs): Promise<ProviderClassifyResponse> => {
    if (opts.captureArgs) opts.captureArgs.value = args;
    if ('error' in result) throw result.error;
    return {
      parsed: result.parsed,
      text: result.parsed ? JSON.stringify(result.parsed) : '',
      usage: result.usage ?? { inputTokens: 120, outputTokens: 40, cacheCreationTokens: 0, cacheReadTokens: 0 },
      model: result.model ?? args.model,
      costUsd: result.costUsd ?? 0
    };
  });
  return {
    name: opts.name ?? 'anthropic',
    client: {},
    init: () => undefined,
    toolsForRequest: () => [],
    chat: () => Promise.reject(new Error('not used in tests')),
    defaultModel: () => 'unused',
    defaultClassifyModel: () => opts.defaultClassifyModel ?? 'claude-haiku-4-5-20251001',
    classify: classifyMock,
    classifyMock
  };
}

describe('tokenTypeInference catalog helpers', () => {
  it('getTokenTypeSkillIds includes every user-facing core token type', () => {
    const ids = getTokenTypeSkillIds();
    // The 15 frontend marketplace entries — all should be present.
    for (const expected of [
      'smart-token',
      'fungible-token',
      'nft-collection',
      'subscription',
      'custom-2fa',
      'credit-token',
      'address-list',
      'payment-protocol',
      'liquidity-pools',
      'quest',
      'bounty',
      'payment-request',
      'crowdfund',
      'auction',
      'product-catalog',
      'prediction-market'
    ]) {
      expect(ids).toContain(expected);
    }
  });

  it('every mapped standard resolves to a real token-type skill id', () => {
    const ids = new Set(getTokenTypeSkillIds());
    for (const { skillId } of STANDARD_TO_TOKEN_TYPE) {
      expect(ids.has(skillId)).toBe(true);
    }
  });

  it('getTokenTypeSkills returns full SkillInstruction records', () => {
    const skills = getTokenTypeSkills();
    expect(skills.length).toBeGreaterThanOrEqual(15);
    expect(skills.every((s) => s.category === 'token-type')).toBe(true);
  });
});

describe('extractStandards', () => {
  it('returns [] for undefined / null / non-object', () => {
    expect(extractStandards(undefined)).toEqual([]);
    expect(extractStandards(null)).toEqual([]);
    expect(extractStandards('nope')).toEqual([]);
  });

  it('pulls standards from the top-level field', () => {
    expect(extractStandards({ standards: ['Smart Token'] })).toEqual(['Smart Token']);
  });

  it('tolerates nested collection shapes', () => {
    expect(extractStandards({ collection: { standards: ['Subscription'] } })).toEqual(['Subscription']);
    expect(extractStandards({ collections: [{ standards: ['NFT Collection'] }] })).toEqual(['NFT Collection']);
  });

  it('tolerates object-form standards with a name field', () => {
    expect(extractStandards({ standards: [{ name: 'Payment Protocol' }, 'Something Else'] })).toEqual([
      'Payment Protocol',
      'Something Else'
    ]);
  });
});

describe('inferFromStandards (deterministic fast-path)', () => {
  const allowedAll = new Set(getTokenTypeSkillIds());

  it('maps Smart Token → smart-token', () => {
    expect(inferFromStandards(['Smart Token'], allowedAll)).toBe('smart-token');
  });

  it('maps Liquidity Pools → liquidity-pools (tradable asset)', () => {
    expect(inferFromStandards(['Liquidity Pools'], allowedAll)).toBe('liquidity-pools');
  });

  it('is case-insensitive', () => {
    expect(inferFromStandards(['smart token'], allowedAll)).toBe('smart-token');
    expect(inferFromStandards(['SUBSCRIPTION'], allowedAll)).toBe('subscription');
  });

  it('returns null when no standard matches', () => {
    expect(inferFromStandards(['Unknown Standard'], allowedAll)).toBeNull();
    expect(inferFromStandards([], allowedAll)).toBeNull();
  });

  it('respects the allowedIds filter', () => {
    const allowed = new Set(['subscription']);
    expect(inferFromStandards(['Smart Token'], allowed)).toBeNull();
    expect(inferFromStandards(['Subscription'], allowed)).toBe('subscription');
  });
});

describe('validateInferenceObject', () => {
  const allowed = new Set(['subscription', 'smart-token']);

  it('accepts a valid high-confidence pick', () => {
    const r = validateInferenceObject(
      { id: 'subscription', confidence: 'high', reasoning: 'recurring $10/mo' },
      allowed
    );
    expect(r.tokenType).toBe('subscription');
    expect(r.confidence).toBe('high');
    expect(r.reasoning).toBe('recurring $10/mo');
  });

  it('returns null when confidence is not high', () => {
    const r = validateInferenceObject(
      { id: 'subscription', confidence: 'low', reasoning: 'ambiguous' },
      allowed
    );
    expect(r.tokenType).toBeNull();
    expect(r.confidence).toBe('low');
  });

  it('returns null when id is not allowed', () => {
    const r = validateInferenceObject(
      { id: 'fungible-token', confidence: 'high', reasoning: 'x' },
      allowed
    );
    expect(r.tokenType).toBeNull();
  });

  it('handles null id as explicit freestyle', () => {
    const r = validateInferenceObject(
      { id: null, confidence: 'high', reasoning: 'too vague' },
      allowed
    );
    expect(r.tokenType).toBeNull();
    expect(r.confidence).toBe('high');
  });

  it('returns null on non-object input (provider parse failure)', () => {
    expect(validateInferenceObject(null, allowed).tokenType).toBeNull();
    expect(validateInferenceObject('string', allowed).tokenType).toBeNull();
    expect(validateInferenceObject([], allowed).tokenType).toBeNull();
  });
});

describe('buildInferenceSchema', () => {
  it('produces a strict-output-friendly schema with allowed ids in enum', () => {
    const schema = buildInferenceSchema(['subscription', 'smart-token']);
    expect(schema.type).toBe('object');
    expect(schema.required).toEqual(['id', 'confidence', 'reasoning']);
    expect(schema.additionalProperties).toBe(false);
    expect((schema.properties.id as any).enum).toEqual(['subscription', 'smart-token', null]);
    expect((schema.properties.confidence as any).enum).toEqual(['high', 'low']);
  });
});

describe('buildInferenceUserPrompt', () => {
  it('just the prompt for create mode', () => {
    const out = buildInferenceUserPrompt({ prompt: 'monthly sub for $10', mode: 'create' });
    expect(out).toContain('User build request');
    expect(out).toContain('monthly sub for $10');
    expect(out).not.toContain('Original build intent');
  });

  it('refine mode prepends original intent + prior turns', () => {
    const out = buildInferenceUserPrompt({
      prompt: 'raise the supply to 2000',
      mode: 'refine',
      originalPrompt: 'mint a fungible governance token',
      priorRefinePrompts: ['change the name to Gov', 'also make it transferable']
    });
    expect(out).toContain('Original build intent');
    expect(out).toContain('mint a fungible governance token');
    expect(out).toContain('change the name to Gov');
    expect(out).toContain('Current refinement turn');
    expect(out).toContain('raise the supply to 2000');
  });

  it('includes existing standards when provided', () => {
    const out = buildInferenceUserPrompt({
      prompt: 'fix the validation error',
      mode: 'refine',
      existingStandards: ['Smart Token']
    });
    expect(out).toContain('Existing collection standards');
    expect(out).toContain('Smart Token');
  });

  it('caps priorRefinePrompts to the last three turns', () => {
    const out = buildInferenceUserPrompt({
      prompt: 'latest',
      mode: 'refine',
      originalPrompt: 'orig',
      priorRefinePrompts: ['t1', 't2', 't3', 't4', 't5']
    });
    expect(out).not.toContain('t1');
    expect(out).not.toContain('t2');
    expect(out).toContain('t3');
    expect(out).toContain('t4');
    expect(out).toContain('t5');
  });
});

describe('buildInferenceSystemPrompt', () => {
  it('enumerates every supplied skill + states the JSON contract', () => {
    const catalog = getTokenTypeSkills();
    const sys = buildInferenceSystemPrompt(catalog);
    expect(sys).toContain('"id"');
    expect(sys).toContain('"confidence"');
    expect(sys).toContain('"high"');
    expect(sys).toContain('Freestyle is a valid outcome');
    for (const s of catalog) {
      expect(sys).toContain(s.id);
    }
  });
});

describe('inferTokenTypeFromPrompt (end-to-end with fake provider)', () => {
  it('fast-paths existing standards without calling provider.classify', async () => {
    const provider = makeFakeProvider({ parsed: null });
    const r = await inferTokenTypeFromPrompt({
      prompt: 'fix the supply cap',
      mode: 'refine',
      existingTransaction: { standards: ['Smart Token'] },
      provider
    });
    expect(r.tokenType).toBe('smart-token');
    expect(r.source).toBe('standards');
    expect(r.confidence).toBe('high');
    expect(provider.classifyMock).not.toHaveBeenCalled();
    expect(r.tokenUsage).toBeUndefined();
  });

  it('calls provider.classify when no standards signal is available (anthropic)', async () => {
    const provider = makeFakeProvider({
      parsed: { id: 'subscription', confidence: 'high', reasoning: 'recurring monthly payment pattern' },
      model: 'claude-haiku-4-5-20251001',
      costUsd: 0.000234
    });
    const r = await inferTokenTypeFromPrompt({
      prompt: 'monthly subscription for $10, max 500 subscribers',
      mode: 'create',
      provider
    });
    expect(r.tokenType).toBe('subscription');
    expect(r.source).toBe('llm');
    expect(r.tokenUsage?.model).toMatch(/haiku/);
    expect(r.tokenUsage?.costUsd).toBe(0.000234);
    expect(provider.classifyMock).toHaveBeenCalledTimes(1);
  });

  it('uses gpt-4o-mini when provider is openai', async () => {
    const captured = { value: null as any };
    const provider = makeFakeProvider(
      { parsed: { id: 'subscription', confidence: 'high', reasoning: 'monthly recurring' }, model: 'gpt-4o-mini' },
      { captureArgs: captured, name: 'openai', defaultClassifyModel: 'gpt-4o-mini' }
    );
    const r = await inferTokenTypeFromPrompt({
      prompt: 'monthly subscription for $10',
      provider
    });
    expect(r.tokenType).toBe('subscription');
    expect(r.tokenUsage?.model).toBe('gpt-4o-mini');
    expect(captured.value.model).toBe('gpt-4o-mini');
  });

  it('honors an explicit modelId override', async () => {
    const captured = { value: null as any };
    const provider = makeFakeProvider(
      { parsed: { id: 'subscription', confidence: 'high', reasoning: '...' } },
      { captureArgs: captured }
    );
    await inferTokenTypeFromPrompt({
      prompt: 'monthly subscription',
      provider,
      modelId: 'claude-sonnet-4-6'
    });
    expect(captured.value.model).toBe('claude-sonnet-4-6');
  });

  it('returns null when classify reports low confidence', async () => {
    const provider = makeFakeProvider({
      parsed: { id: 'fungible-token', confidence: 'low', reasoning: 'too vague' }
    });
    const r = await inferTokenTypeFromPrompt({
      prompt: 'I want to make some kind of token thing for my community',
      provider
    });
    expect(r.tokenType).toBeNull();
    expect(r.confidence).toBe('low');
    expect(r.source).toBeNull();
  });

  it('returns null on classify errors (freestyle is valid)', async () => {
    const provider = makeFakeProvider({ error: new Error('network down') });
    const r = await inferTokenTypeFromPrompt({ prompt: 'any prompt', provider });
    expect(r.tokenType).toBeNull();
    expect(r.source).toBeNull();
    expect(provider.classifyMock).toHaveBeenCalledTimes(1);
  });

  it('returns null when provider is absent and no standards hint', async () => {
    const r = await inferTokenTypeFromPrompt({
      prompt: 'anything',
      provider: undefined as unknown as LLMProvider
    });
    expect(r.tokenType).toBeNull();
  });

  it('returns null when classify returns parsed=null (parse failure)', async () => {
    const provider = makeFakeProvider({ parsed: null });
    const r = await inferTokenTypeFromPrompt({
      prompt: 'something',
      provider
    });
    expect(r.tokenType).toBeNull();
    expect(provider.classifyMock).toHaveBeenCalledTimes(1);
  });

  it('restricts candidates via allowedTokenTypeIds', async () => {
    const captured = { value: null as any };
    const provider = makeFakeProvider(
      { parsed: { id: 'fungible-token', confidence: 'high', reasoning: '...' } },
      { captureArgs: captured }
    );
    const r = await inferTokenTypeFromPrompt({
      prompt: 'simple fungible token',
      allowedTokenTypeIds: ['subscription'],
      provider
    });
    // fungible-token is not in the allowlist → must be rejected.
    expect(r.tokenType).toBeNull();
    const sysText: string = captured.value.systemPrompt;
    expect(sysText).toContain('subscription');
    expect(sysText).not.toContain('`fungible-token`');
    // Schema enum is also restricted to the allow-list + null.
    expect((captured.value.schema.properties.id as any).enum).toEqual(['subscription', null]);
  });

  it('sends a systemCacheControl hint for Anthropic prompt-cache stability', async () => {
    const captured = { value: null as any };
    const provider = makeFakeProvider(
      { parsed: { id: null, confidence: 'low', reasoning: '...' } },
      { captureArgs: captured }
    );
    await inferTokenTypeFromPrompt({ prompt: 'x', provider });
    expect(captured.value.systemCacheControl).toEqual({ type: 'ephemeral' });
  });

  it('folds refine context into the user prompt', async () => {
    const captured = { value: null as any };
    const provider = makeFakeProvider(
      { parsed: { id: 'fungible-token', confidence: 'high', reasoning: 'gov token' } },
      { captureArgs: captured }
    );
    await inferTokenTypeFromPrompt({
      prompt: 'fix this',
      mode: 'refine',
      originalPrompt: 'make a governance token called GOV, supply 1000',
      priorRefinePrompts: ['add a logo'],
      provider
    });
    const userPrompt: string = captured.value.userPrompt;
    expect(userPrompt).toContain('Original build intent');
    expect(userPrompt).toContain('governance token');
    expect(userPrompt).toContain('Current refinement turn');
  });
});
