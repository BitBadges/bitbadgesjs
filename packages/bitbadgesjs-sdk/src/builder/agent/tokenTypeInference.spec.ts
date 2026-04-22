/**
 * Unit tests for the smart token-type inference module.
 *
 * The LLM branch is exercised via a fake `anthropicClient` that
 * returns a canned response shape — no peer-dep required.
 */

import {
  buildInferenceSystemPrompt,
  buildInferenceUserPrompt,
  extractStandards,
  getTokenTypeSkillIds,
  getTokenTypeSkills,
  inferFromStandards,
  inferTokenTypeFromPrompt,
  parseInferenceResponse,
  STANDARD_TO_TOKEN_TYPE
} from './tokenTypeInference.js';

function makeFakeClient(response: any, opts: { captureArgs?: { value: any } } = {}) {
  return {
    messages: {
      create: jest.fn(async (args: any) => {
        if (opts.captureArgs) opts.captureArgs.value = args;
        return response;
      })
    }
  };
}

function mkMessagesResponse(bodyText: string) {
  return {
    content: [{ type: 'text', text: bodyText }],
    usage: {
      input_tokens: 120,
      output_tokens: 40,
      cache_creation_input_tokens: 0,
      cache_read_input_tokens: 0
    }
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

describe('parseInferenceResponse', () => {
  const allowed = new Set(['subscription', 'smart-token']);

  it('accepts a valid high-confidence pick', () => {
    const r = parseInferenceResponse(
      '{"id":"subscription","confidence":"high","reasoning":"recurring $10/mo"}',
      allowed
    );
    expect(r.tokenType).toBe('subscription');
    expect(r.confidence).toBe('high');
    expect(r.reasoning).toBe('recurring $10/mo');
  });

  it('strips ```json fences that Claude occasionally adds', () => {
    const r = parseInferenceResponse(
      '```json\n{"id":"smart-token","confidence":"high","reasoning":"wraps USDC"}\n```',
      allowed
    );
    expect(r.tokenType).toBe('smart-token');
  });

  it('returns null when confidence is not high', () => {
    const r = parseInferenceResponse(
      '{"id":"subscription","confidence":"low","reasoning":"ambiguous"}',
      allowed
    );
    expect(r.tokenType).toBeNull();
    expect(r.confidence).toBe('low');
  });

  it('returns null when id is not allowed', () => {
    const r = parseInferenceResponse(
      '{"id":"fungible-token","confidence":"high","reasoning":"x"}',
      allowed
    );
    expect(r.tokenType).toBeNull();
  });

  it('handles null id as explicit freestyle', () => {
    const r = parseInferenceResponse('{"id":null,"confidence":"high","reasoning":"too vague"}', allowed);
    expect(r.tokenType).toBeNull();
    expect(r.confidence).toBe('high');
  });

  it('returns null on malformed JSON', () => {
    const r = parseInferenceResponse('not json', allowed);
    expect(r.tokenType).toBeNull();
    expect(r.confidence).toBeNull();
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

describe('inferTokenTypeFromPrompt (end-to-end with fake client)', () => {
  it('fast-paths existing standards without calling Claude', async () => {
    const client = makeFakeClient(mkMessagesResponse(''));
    const r = await inferTokenTypeFromPrompt({
      prompt: 'fix the supply cap',
      mode: 'refine',
      existingTransaction: { standards: ['Smart Token'] },
      anthropicClient: client
    });
    expect(r.tokenType).toBe('smart-token');
    expect(r.source).toBe('standards');
    expect(r.confidence).toBe('high');
    expect(client.messages.create).not.toHaveBeenCalled();
    expect(r.tokenUsage).toBeUndefined();
  });

  it('calls Claude when no standards signal is available', async () => {
    const client = makeFakeClient(
      mkMessagesResponse(
        '{"id":"subscription","confidence":"high","reasoning":"recurring monthly payment pattern"}'
      )
    );
    const r = await inferTokenTypeFromPrompt({
      prompt: 'monthly subscription for $10, max 500 subscribers',
      mode: 'create',
      anthropicClient: client
    });
    expect(r.tokenType).toBe('subscription');
    expect(r.source).toBe('llm');
    expect(r.tokenUsage?.model).toMatch(/haiku/);
    expect(client.messages.create).toHaveBeenCalledTimes(1);
  });

  it('returns null when Claude reports low confidence', async () => {
    const client = makeFakeClient(
      mkMessagesResponse('{"id":"fungible-token","confidence":"low","reasoning":"too vague"}')
    );
    const r = await inferTokenTypeFromPrompt({
      prompt: 'I want to make some kind of token thing for my community',
      anthropicClient: client
    });
    expect(r.tokenType).toBeNull();
    expect(r.confidence).toBe('low');
    expect(r.source).toBeNull();
  });

  it('returns null on network errors (freestyle is valid)', async () => {
    const client = {
      messages: {
        create: jest.fn(async () => {
          throw new Error('network down');
        })
      }
    };
    const r = await inferTokenTypeFromPrompt({
      prompt: 'any prompt',
      anthropicClient: client
    });
    expect(r.tokenType).toBeNull();
    expect(r.source).toBeNull();
    expect(client.messages.create).toHaveBeenCalledTimes(1);
  });

  it('returns null when anthropicClient is absent and no standards hint', async () => {
    const r = await inferTokenTypeFromPrompt({
      prompt: 'anything',
      anthropicClient: null
    });
    expect(r.tokenType).toBeNull();
  });

  it('restricts candidates via allowedTokenTypeIds', async () => {
    const captured = { value: null as any };
    const client = makeFakeClient(
      mkMessagesResponse('{"id":"fungible-token","confidence":"high","reasoning":"..."}'),
      { captureArgs: captured }
    );
    const r = await inferTokenTypeFromPrompt({
      prompt: 'simple fungible token',
      allowedTokenTypeIds: ['subscription'],
      anthropicClient: client
    });
    // fungible-token is not in the allowlist → must be rejected.
    expect(r.tokenType).toBeNull();
    const sysText: string = captured.value.system[0].text;
    expect(sysText).toContain('subscription');
    expect(sysText).not.toContain('`fungible-token`');
  });

  it('sends a cache_control hint on the system prompt', async () => {
    const captured = { value: null as any };
    const client = makeFakeClient(
      mkMessagesResponse('{"id":null,"confidence":"low","reasoning":"..."}'),
      { captureArgs: captured }
    );
    await inferTokenTypeFromPrompt({ prompt: 'x', anthropicClient: client });
    expect(captured.value.system[0].cache_control).toEqual({ type: 'ephemeral' });
  });

  it('folds refine context into the user message', async () => {
    const captured = { value: null as any };
    const client = makeFakeClient(
      mkMessagesResponse('{"id":"fungible-token","confidence":"high","reasoning":"gov token"}'),
      { captureArgs: captured }
    );
    await inferTokenTypeFromPrompt({
      prompt: 'fix this',
      mode: 'refine',
      originalPrompt: 'make a governance token called GOV, supply 1000',
      priorRefinePrompts: ['add a logo'],
      anthropicClient: client
    });
    const userMsg: string = captured.value.messages[0].content;
    expect(userMsg).toContain('Original build intent');
    expect(userMsg).toContain('governance token');
    expect(userMsg).toContain('Current refinement turn');
  });
});
