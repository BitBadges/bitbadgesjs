/**
 * MCP server boot is model-agnostic.
 *
 * Regression guard for backlog #0367 — confirms `createServer()` and the
 * tool registry work without any LLM-provider env vars present. The
 * optional `BitBadgesBuilderAgent` self-driving loop (separate code path)
 * is the only consumer of `ANTHROPIC_API_KEY` / `OPENAI_API_KEY` etc.;
 * the MCP transport itself must not reach for them.
 */
import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { spawnSync } from 'node:child_process';
import { createServer, getServerInstructions, getBuilderPackageVersion } from './server.js';
import { handleBuilderCliArgs } from './index.js';
import { listTools, callTool, toolRegistry, getToolToolsets, MCP_TOOLSET_NAMES } from './tools/registry.js';

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

describe('MCP server ergonomics (BB-313)', () => {
  const pkg = JSON.parse(readFileSync(join(__dirname, '../../package.json'), 'utf8')) as { version: string };

  it('reads server version from package.json instead of hardcoded 1.0.0', () => {
    expect(getBuilderPackageVersion()).toBe(pkg.version);
    expect(getBuilderPackageVersion()).not.toBe('1.0.0');
  });

  it('handles --version / -v and --help / -h before starting stdio transport', () => {
    expect(handleBuilderCliArgs(['--version'])).toEqual({ exit: true, stdout: `${pkg.version}\n` });
    expect(handleBuilderCliArgs(['-v'])).toEqual({ exit: true, stdout: `${pkg.version}\n` });
    const help = handleBuilderCliArgs(['--help']);
    expect(help.exit).toBe(true);
    expect(help.stdout).toContain('bitbadges-builder');
    expect(help.stdout).toContain('BITBADGES_MCP_TOOLSETS');
    expect(handleBuilderCliArgs(['-h']).exit).toBe(true);
    expect(handleBuilderCliArgs([])).toEqual({ exit: false });

    const entry = join(__dirname, 'index.ts');
    const verRun = spawnSync('bun', [entry, '--version'], { encoding: 'utf-8', timeout: 10_000 });
    expect(verRun.status).toBe(0);
    expect(verRun.stdout.trim()).toBe(pkg.version);

    const helpRun = spawnSync('bun', [entry, '--help'], { encoding: 'utf-8', timeout: 10_000 });
    expect(helpRun.status).toBe(0);
    expect(helpRun.stdout).toContain('BITBADGES_MCP_TOOLSETS');
  });

  it('validate_address returns isError: false for invalid addresses', async () => {
    const res = await callTool('validate_address', { address: 'garbage' });
    expect(res.isError).toBe(false);
    expect(res.result.valid).toBe(false);
  });

  it('diagnose_error returns isError: false when no pattern matches', async () => {
    const res = await callTool('diagnose_error', { error: 'xyzzy totally unrelated gibberish 98765' });
    expect(res.isError).toBe(false);
    expect(res.result.diagnosis).toBeNull();
  });

  it('filters tools/list via BITBADGES_MCP_TOOLSETS and assigns every tool to at least one toolset', () => {
    for (const name of Object.keys(toolRegistry)) {
      expect(getToolToolsets(name).length).toBeGreaterThan(0);
    }
    expect(MCP_TOOLSET_NAMES).toEqual(expect.arrayContaining(['build', 'query', 'standards', 'validate', 'docs']));

    const saved = process.env.BITBADGES_MCP_TOOLSETS;
    try {
      delete process.env.BITBADGES_MCP_TOOLSETS;
      const all = listTools();
      expect(all.length).toBe(Object.keys(toolRegistry).length);

      process.env.BITBADGES_MCP_TOOLSETS = 'docs';
      const docsOnly = listTools();
      expect(docsOnly.length).toBeGreaterThan(0);
      expect(docsOnly.length).toBeLessThan(all.length);
      expect(docsOnly.map((t) => t.name)).toContain('list_skills');
      expect(docsOnly.map((t) => t.name)).not.toContain('query_collection');

      process.env.BITBADGES_MCP_TOOLSETS = 'query,validate';
      const queryAndValidate = listTools();
      expect(queryAndValidate.map((t) => t.name)).toContain('query_collection');
      expect(queryAndValidate.map((t) => t.name)).toContain('validate_transaction');
      expect(queryAndValidate.map((t) => t.name)).not.toContain('set_standards');
    } finally {
      if (saved === undefined) delete process.env.BITBADGES_MCP_TOOLSETS;
      else process.env.BITBADGES_MCP_TOOLSETS = saved;
    }
  });
});

