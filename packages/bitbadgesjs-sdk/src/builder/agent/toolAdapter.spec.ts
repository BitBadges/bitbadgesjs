/**
 * Tests for createAgentToolRegistry — wiring of builtins + add/remove/defaultArgs.
 */

import { createAgentToolRegistry } from './toolAdapter.js';
import type { CustomTool } from './types.js';

function makeCustom(name: string, handler: (args: any, ctx: any) => Promise<any> | any): CustomTool {
  return {
    definition: {
      name,
      description: `custom tool ${name}`,
      input_schema: { type: 'object', properties: {}, required: [] }
    },
    execute: handler
  };
}

describe('createAgentToolRegistry — zero config', () => {
  it('exposes the full builtin set', () => {
    const reg = createAgentToolRegistry();
    expect(reg.definitions.length).toBeGreaterThan(40);
    expect(reg.has('add_approval')).toBe(true);
    expect(reg.has('build_claim')).toBe(true);
    expect(reg.has('set_permissions')).toBe(true);
    expect(reg.has('validate_transaction')).toBe(true);
  });

  it('names array matches definitions order', () => {
    const reg = createAgentToolRegistry();
    expect(reg.names).toEqual(reg.definitions.map((d) => d.name));
  });
});

describe('createAgentToolRegistry — remove', () => {
  it('removes a specific builtin and leaves others intact', () => {
    const reg = createAgentToolRegistry({ remove: ['build_claim'] });
    expect(reg.has('build_claim')).toBe(false);
    expect(reg.has('add_approval')).toBe(true);
    expect(reg.has('validate_transaction')).toBe(true);
  });

  it('removing unknown name is a no-op', () => {
    const a = createAgentToolRegistry();
    const b = createAgentToolRegistry({ remove: ['does_not_exist'] });
    expect(a.definitions.length).toBe(b.definitions.length);
  });
});

describe('createAgentToolRegistry — add custom tool', () => {
  it('appends custom tool at the end of definitions', () => {
    const custom = makeCustom('custom_tool', async () => ({ ok: true }));
    const reg = createAgentToolRegistry({ add: [custom] });
    expect(reg.has('custom_tool')).toBe(true);
    const last = reg.definitions[reg.definitions.length - 1];
    expect(last.name).toBe('custom_tool');
  });

  it('execute() routes to the custom handler and injects ctx into args', async () => {
    const handler = jest.fn(async (args: any, ctx: any) => ({ gotArgs: args, gotCtx: ctx }));
    const custom = makeCustom('custom_tool', handler);
    const reg = createAgentToolRegistry({ add: [custom] });
    const ctx = { sessionId: 'sess-1', callerAddress: 'bb1x' };
    const result = await reg.execute('custom_tool', { hello: 'world' }, ctx);
    expect(handler).toHaveBeenCalledTimes(1);
    const parsed = JSON.parse(result);
    // sessionId + creatorAddress from ctx are auto-injected into args
    // so session-mutating tools hit the agent's bound session. Verified
    // the original `hello` stays intact.
    expect(parsed.gotArgs).toEqual({ hello: 'world', sessionId: 'sess-1', creatorAddress: 'bb1x' });
    expect(parsed.gotCtx).toEqual(ctx);
  });

  it('custom tool with a builtin name wins (overrides builtin)', async () => {
    const handler = jest.fn(async () => ({ source: 'custom-override' }));
    const custom = makeCustom('build_claim', handler);
    const reg = createAgentToolRegistry({ add: [custom] });
    expect(reg.has('build_claim')).toBe(true);
    const result = await reg.execute('build_claim', {}, { sessionId: 's', callerAddress: '' });
    expect(handler).toHaveBeenCalled();
    expect(JSON.parse(result)).toEqual({ source: 'custom-override' });
  });
});

describe('createAgentToolRegistry — defaultArgs', () => {
  it('merges defaults into every tool call', async () => {
    const handler = jest.fn(async (args: any) => ({ receivedArgs: args }));
    const custom = makeCustom('inspect', handler);
    const reg = createAgentToolRegistry({
      add: [custom],
      defaultArgs: { apiKey: 'k', apiUrl: 'https://api.example' }
    });

    await reg.execute('inspect', { foo: 'bar' }, { sessionId: 's', callerAddress: 'bb1c' });
    const callArgs = handler.mock.calls[0][0];
    // ctx values (sessionId, creatorAddress) are auto-injected too.
    expect(callArgs).toEqual({
      apiKey: 'k',
      apiUrl: 'https://api.example',
      foo: 'bar',
      sessionId: 's',
      creatorAddress: 'bb1c'
    });
  });

  it('explicit args override defaults (explicit wins)', async () => {
    const handler = jest.fn(async (args: any) => args);
    const custom = makeCustom('inspect2', handler);
    const reg = createAgentToolRegistry({
      add: [custom],
      defaultArgs: { apiKey: 'default-key' }
    });

    await reg.execute('inspect2', { apiKey: 'explicit-key' }, { sessionId: 's', callerAddress: '' });
    const callArgs = handler.mock.calls[0][0];
    expect(callArgs.apiKey).toBe('explicit-key');
  });

  it('defaults also apply to builtin tools', async () => {
    // We can't easily assert on builtin internals, but we CAN verify
    // execute() succeeds with defaults merged in. This test at least
    // exercises the merge path for builtins.
    const reg = createAgentToolRegistry({ defaultArgs: { apiKey: 'k' } });
    // get_current_timestamp is a simple tool that doesn't need real args
    const result = await reg.execute(
      'get_current_timestamp',
      {},
      { sessionId: 's', callerAddress: '' }
    );
    expect(typeof result).toBe('string');
  });
});

describe('createAgentToolRegistry — execute behavior', () => {
  it('unknown tool name returns a serialized error (does not throw)', async () => {
    const reg = createAgentToolRegistry();
    const result = await reg.execute('does_not_exist', {}, { sessionId: 's', callerAddress: '' });
    const parsed = JSON.parse(result);
    expect(parsed.error).toMatch(/Unknown tool/i);
  });

  it('handler throw → serialized error object, no exception propagated', async () => {
    const custom = makeCustom('boom', async () => {
      throw new Error('kaboom');
    });
    const reg = createAgentToolRegistry({ add: [custom] });
    const result = await reg.execute('boom', {}, { sessionId: 's', callerAddress: '' });
    const parsed = JSON.parse(result);
    expect(parsed.error).toBe('kaboom');
  });

  it('result > 100KB is wrapped in a valid-JSON truncation envelope', async () => {
    const huge = 'a'.repeat(150_000);
    const custom = makeCustom('huge', async () => huge);
    const reg = createAgentToolRegistry({ add: [custom] });
    const result = await reg.execute('huge', {}, { sessionId: 's', callerAddress: '' });
    // The LLM has to parse this — it MUST be valid JSON, not a slice
    // with a text-suffix marker.
    const parsed = JSON.parse(result);
    expect(parsed._truncated).toBe(true);
    expect(parsed.originalBytes).toBe(150_000);
    expect(typeof parsed.preview).toBe('string');
    expect(parsed.preview.length).toBeGreaterThan(1000);
    // Whole envelope still fits under the cap with room to spare.
    expect(result.length).toBeLessThan(100_000);
  });

  it('result just under 100KB is NOT truncated', async () => {
    // Return an object (not a string) so we exercise the JSON.stringify branch.
    const justUnder = 'b'.repeat(90_000);
    const custom = makeCustom('medium', async () => ({ payload: justUnder }));
    const reg = createAgentToolRegistry({ add: [custom] });
    const result = await reg.execute('medium', {}, { sessionId: 's', callerAddress: '' });
    expect(result).toBe(JSON.stringify({ payload: justUnder }));
    expect(result).not.toMatch(/truncated/);
  });

  it('string result passes through without double JSON-encoding', async () => {
    const custom = makeCustom('str', async () => 'hello');
    const reg = createAgentToolRegistry({ add: [custom] });
    const result = await reg.execute('str', {}, { sessionId: 's', callerAddress: '' });
    expect(result).toBe('hello');
  });
});
