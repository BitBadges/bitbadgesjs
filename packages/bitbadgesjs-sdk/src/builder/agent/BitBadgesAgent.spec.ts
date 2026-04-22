/**
 * BitBadgesAgent smoke tests — verify the zero-config path works
 * with a fully mocked Anthropic client.
 *
 * These tests do NOT require @anthropic-ai/sdk installed — the agent
 * accepts a pre-built client via `anthropicClient`, so the test can
 * stub out the whole peer dep.
 */

import { BitBadgesAgent, MemoryStore, ValidationFailedError } from './index.js';

describe('BitBadgesAgent', () => {
  it('throws a clear error when no Anthropic credentials are provided', () => {
    const origKey = process.env.ANTHROPIC_API_KEY;
    const origAuth = process.env.ANTHROPIC_AUTH_TOKEN;
    const origOauth = process.env.ANTHROPIC_OAUTH_TOKEN;
    delete process.env.ANTHROPIC_API_KEY;
    delete process.env.ANTHROPIC_AUTH_TOKEN;
    delete process.env.ANTHROPIC_OAUTH_TOKEN;
    try {
      expect(() => new BitBadgesAgent({})).toThrow(/Anthropic credentials/i);
    } finally {
      if (origKey) process.env.ANTHROPIC_API_KEY = origKey;
      if (origAuth) process.env.ANTHROPIC_AUTH_TOKEN = origAuth;
      if (origOauth) process.env.ANTHROPIC_OAUTH_TOKEN = origOauth;
    }
  });

  it('rejects unknown skills at construction time', () => {
    expect(
      () =>
        new BitBadgesAgent({
          anthropicKey: 'test-key',
          skills: ['does-not-exist' as any]
        })
    ).toThrow(/Unknown skills/);
  });

  it('accepts an OAuth token as alternative to API key', () => {
    expect(
      () =>
        new BitBadgesAgent({
          anthropicAuthToken: 'oauth-token-123'
        })
    ).not.toThrow();
  });

  it('reads ANTHROPIC_API_KEY from environment', () => {
    const orig = process.env.ANTHROPIC_API_KEY;
    process.env.ANTHROPIC_API_KEY = 'env-key';
    try {
      expect(() => new BitBadgesAgent({})).not.toThrow();
    } finally {
      if (orig) process.env.ANTHROPIC_API_KEY = orig;
      else delete process.env.ANTHROPIC_API_KEY;
    }
  });

  it('exposes getSystemPrompt() for prompt introspection', () => {
    const agent = new BitBadgesAgent({ anthropicKey: 'test-key' });
    const sys = agent.getSystemPrompt('create');
    expect(sys).toContain('BitBadges AI Builder');
    expect(sys).toContain('Security');
    expect(sys.length).toBeGreaterThan(1000);
  });

  it('exposes getSystemPrompt() with the append slot applied', () => {
    const agent = new BitBadgesAgent({
      anthropicKey: 'test-key',
      systemPromptAppend: 'ALWAYS include XYZ'
    });
    const sys = agent.getSystemPrompt();
    expect(sys).toContain('ALWAYS include XYZ');
  });

  it('tool registry filters out removed tools', () => {
    const agent = new BitBadgesAgent({
      anthropicKey: 'test-key',
      tools: { remove: ['build_claim'] }
    });
    expect(agent.tools.has('build_claim')).toBe(false);
    expect(agent.tools.has('add_approval')).toBe(true);
  });

  it('tool registry keeps every builtin when no filter is set', () => {
    const agent = new BitBadgesAgent({ anthropicKey: 'test-key' });
    expect(agent.tools.has('add_approval')).toBe(true);
    expect(agent.tools.has('set_permissions')).toBe(true);
    expect(agent.tools.has('validate_transaction')).toBe(true);
    expect(agent.tools.has('get_transaction')).toBe(true);
  });

  it('model defaults to sonnet with correct Anthropic ID', () => {
    const agent = new BitBadgesAgent({ anthropicKey: 'test-key' });
    expect(agent.modelInfo.id).toBe('claude-sonnet-4-6');
  });

  it('supports opus model override', () => {
    const agent = new BitBadgesAgent({ anthropicKey: 'test-key', model: 'opus' });
    expect(agent.modelInfo.id).toBe('claude-opus-4-6');
  });

  it('substituteImages swaps IMAGE_N tokens inside nested structures', () => {
    const agent = new BitBadgesAgent({ anthropicKey: 'test-key' });
    const tx = {
      messages: [
        {
          value: {
            _meta: {
              metadataPlaceholders: {
                'ipfs://METADATA_COLLECTION': { name: 'X', description: 'Y', image: 'IMAGE_1' }
              }
            }
          }
        }
      ]
    };
    const result = agent.substituteImages(tx, { IMAGE_1: 'https://cdn.example.com/1.png' });
    expect((result as any).messages[0].value._meta.metadataPlaceholders['ipfs://METADATA_COLLECTION'].image).toBe('https://cdn.example.com/1.png');
    // Original untouched
    expect((tx as any).messages[0].value._meta.metadataPlaceholders['ipfs://METADATA_COLLECTION'].image).toBe('IMAGE_1');
  });

  it('collectImageReferences finds every IMAGE_N token', () => {
    const agent = new BitBadgesAgent({ anthropicKey: 'test-key' });
    const tx = {
      a: { image: 'IMAGE_1' },
      b: [{ image: 'IMAGE_3' }, { image: 'IMAGE_2' }],
      c: 'not a placeholder'
    };
    expect(agent.collectImageReferences(tx)).toEqual(['IMAGE_1', 'IMAGE_2', 'IMAGE_3']);
  });

  it('sessionStore defaults to MemoryStore', () => {
    // Not directly observable, but we exercise the default path by constructing.
    expect(() => new BitBadgesAgent({ anthropicKey: 'test-key' })).not.toThrow();
  });

  it('accepts a custom KVStore', async () => {
    const store = new MemoryStore();
    await store.set('agent-test-key', 'hello', { ttlSeconds: 60 });
    expect(await store.get('agent-test-key')).toBe('hello');
    const agent = new BitBadgesAgent({ anthropicKey: 'test-key', sessionStore: store });
    expect(agent).toBeDefined();
  });
});

describe('BitBadgesAgent — end-to-end with mocked Anthropic', () => {
  // Scripted Anthropic responses: first round returns a tool_use for
  // get_transaction, second round stops with text.
  function makeMockClient(scripted: any[]) {
    let i = 0;
    return {
      messages: {
        create: async () => scripted[i++]
      }
    };
  }

  it('runs a build end-to-end, returns a typed result, and fires hooks', async () => {
    const onToolCall = jest.fn();
    const onTokenUsage = jest.fn();
    const onCompletion = jest.fn();

    const client = makeMockClient([
      {
        usage: { input_tokens: 100, output_tokens: 50 },
        stop_reason: 'tool_use',
        content: [
          {
            type: 'tool_use',
            id: 'toolu_1',
            name: 'get_transaction',
            input: {}
          }
        ]
      },
      {
        usage: { input_tokens: 120, output_tokens: 20 },
        stop_reason: 'end_turn',
        content: [{ type: 'text', text: 'Done.' }]
      }
    ]);

    const agent = new BitBadgesAgent({
      anthropicClient: client,
      anthropicKey: 'unused-with-client',
      validation: 'off', // skip validation in this smoke test — tx is empty
      hooks: { onToolCall, onTokenUsage, onCompletion },
      defaultCreatorAddress: 'bb1test'
    });

    const result = await agent.build('make a collection');

    expect(result.tokensUsed).toBe(290);
    expect(result.costUsd).toBeGreaterThan(0);
    expect(result.rounds).toBe(2);
    expect(result.fixRounds).toBe(0);
    expect(onTokenUsage).toHaveBeenCalledTimes(2);
    expect(onToolCall).toHaveBeenCalledWith(expect.objectContaining({ name: 'get_transaction' }));
    expect(onCompletion).toHaveBeenCalled();
    expect(typeof result.toString()).toBe('string');
    expect(result.toString()).toMatch(/BitBadgesAgent build/);
  });

  it('throws ValidationFailedError in strict mode when gate fails', async () => {
    // Drive a single tool_use that does nothing useful, then stop.
    const client = makeMockClient([
      {
        usage: { input_tokens: 100, output_tokens: 50 },
        stop_reason: 'end_turn',
        content: [{ type: 'text', text: 'done' }]
      }
    ]);

    const agent = new BitBadgesAgent({
      anthropicClient: client,
      anthropicKey: 'unused',
      validation: 'strict',
      fixLoopMaxRounds: 0, // no fixes
      defaultCreatorAddress: 'bb1test'
    });

    await expect(agent.build('do nothing')).rejects.toBeInstanceOf(ValidationFailedError);
  });

  it('lenient validation returns result even on failure', async () => {
    const client = makeMockClient([
      {
        usage: { input_tokens: 100, output_tokens: 50 },
        stop_reason: 'end_turn',
        content: [{ type: 'text', text: 'done' }]
      }
    ]);

    const agent = new BitBadgesAgent({
      anthropicClient: client,
      anthropicKey: 'unused',
      validation: 'lenient',
      fixLoopMaxRounds: 0,
      defaultCreatorAddress: 'bb1test'
    });

    const result = await agent.build('do nothing');
    expect(result.valid).toBe(false);
    expect(result.errors.length).toBeGreaterThan(0);
  });
});
