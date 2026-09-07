/**
 * MCP server boot is model-agnostic.
 *
 * Regression guard for backlog #0367 — confirms `createServer()` and the
 * tool registry work without any LLM-provider env vars present. The
 * optional `BitBadgesBuilderAgent` self-driving loop (separate code path)
 * is the only consumer of `ANTHROPIC_API_KEY` / `OPENAI_API_KEY` etc.;
 * the MCP transport itself must not reach for them.
 */
import { createServer, getServerInstructions } from './server.js';
import { listTools, callTool, toolRegistry } from './tools/registry.js';

const MODEL_ENV_VARS = [
  'ANTHROPIC_API_KEY',
  'ANTHROPIC_AUTH_TOKEN',
  'ANTHROPIC_OAUTH_TOKEN',
  'OPENAI_API_KEY'
];

describe('MCP server boot is model-agnostic', () => {
  const saved: Record<string, string | undefined> = {};

  beforeEach(() => {
    for (const key of MODEL_ENV_VARS) {
      saved[key] = process.env[key];
      delete process.env[key];
    }
  });

  afterEach(() => {
    for (const key of MODEL_ENV_VARS) {
      const val = saved[key];
      if (val === undefined) delete process.env[key];
      else process.env[key] = val;
    }
  });

  it('createServer() does not throw without any LLM env var', () => {
    expect(() => createServer()).not.toThrow();
  });

  it('listTools() returns the full registry without LLM env vars', () => {
    const tools = listTools();
    // Sanity floor — registry has 50+ tools today; if it ever drops below
    // 40, something likely broke at module load.
    expect(tools.length).toBeGreaterThan(40);
    expect(tools.length).toBe(Object.keys(toolRegistry).length);
    // Every tool must have a name + description + inputSchema.type=object.
    for (const tool of tools) {
      expect(typeof tool.name).toBe('string');
      expect(tool.name.length).toBeGreaterThan(0);
      expect(typeof tool.description).toBe('string');
      expect(tool.inputSchema?.type).toBe('object');
    }
  });

  it('callTool dispatches a deterministic util tool without LLM env vars', async () => {
    // get_current_timestamp is a pure utility — no API, no LLM, no signing.
    // It's the cleanest way to confirm the dispatch path works end-to-end
    // when the process truly has no model credentials of any kind.
    const result = await callTool('get_current_timestamp', {});
    expect(result.isError).toBeFalsy();
    expect(typeof result.text).toBe('string');
    expect(result.text.length).toBeGreaterThan(0);
  });
});

describe('MCP server instructions', () => {
  // MCP clients inject `instructions` into the model's context on initialize.
  // Shipping none meant a cold agent saw 53 tool names, 11 resource URIs, and
  // no statement of the build order, the stateful session, or the fact that
  // the agent never signs. All of that steering existed only in the
  // programmatic agent's prompt, which the MCP surface never reads.
  it('ships instructions that name the happy path and the handoff', () => {
    const instructions = getServerInstructions();
    expect(instructions.length).toBeGreaterThan(400);
    for (const anchor of [
      'get_skill_instructions',
      'validate_transaction',
      'review_collection',
      'get_review_url',
      'reset_session',
      'bitbadges://master-prompt'
    ]) {
      expect(instructions).toContain(anchor);
    }
  });

  it('names only tools that actually exist', () => {
    const instructions = getServerInstructions();
    const named = instructions.match(/\b[a-z][a-z0-9]*(?:_[a-z0-9]+)+\b/g) ?? [];
    const toolLike = named.filter((n) => n in toolRegistry || /^(set|add|get|remove|list|validate|review|simulate|generate|reset|query|build|explain|search|lookup|verify|flag|analyze)_/.test(n));
    for (const name of new Set(toolLike)) {
      expect(Object.keys(toolRegistry)).toContain(name);
    }
  });
});

