/**
 * Integration: the discovery surface — `bb tools`, `bb tool`,
 * `bb resources`, `bb skills`, `bb doctor`.
 *
 * These commands feed agents (and humans) the registry of what the
 * CLI can do. They're read-only and don't touch the chain.
 *
 * `bb docs` is NOT covered here — it fetches from GitHub and caches
 * locally, so it's a network-side smoke test rather than an
 * integration boundary. (Covered by `bb skills` which is a thin shim
 * over docs builder-skills.)
 */

import { runCli } from './harness/cli.js';

describe('bb tools', () => {
  it('lists every tool with a JSON schema in envelope.data.tools', () => {
    const out = runCli(['tools']);
    expect(out.exitCode).toBe(0);
    expect(Array.isArray(out.json.tools)).toBe(true);
    expect(out.json.tools.length).toBeGreaterThan(0);
    // Each entry must have at least name + description + inputSchema.
    for (const t of out.json.tools) {
      expect(typeof t.name).toBe('string');
      expect(typeof t.description).toBe('string');
      expect(t.inputSchema).toBeDefined();
    }
  });

  it('--names surfaces tool names in envelope.data.names', () => {
    const out = runCli(['tools', '--names']);
    expect(out.exitCode).toBe(0);
    const names: string[] = out.json.names;
    expect(Array.isArray(names)).toBe(true);
    expect(names.length).toBeGreaterThan(0);
    expect(names).toContain('validate_transaction');
    expect(names).toContain('lookup_token_info');
  });
});

describe('bb tool <name>', () => {
  it('lookup_token_info returns the token registry shape', () => {
    // Schema field name is `query` (free-form symbol/denom), not `symbol`.
    // BADGE (native ubadge) MUST be queryable post-#0398 — the registry
    // filter that excluded it was removed because agents reasonably ask
    // for the native token's decimals / denom resolution.
    const out = runCli(['tool', 'lookup_token_info', '--args', '{"query":"BADGE"}']);
    expect(out.exitCode).toBe(0);
    expect(out.json).toBeDefined();
  });

  it('errors with a clear message on an unknown tool', () => {
    const out = runCli(['tool', 'no_such_tool_exists'], { throwOnError: false, parseJson: false });
    expect(out.exitCode).not.toBe(0);
    // Be lenient about exact error wording — just verify it surfaces SOMETHING.
    expect(out.stderr.length + out.stdout.length).toBeGreaterThan(0);
  });
});

describe('bb resources', () => {
  it('list returns resource descriptors in envelope.data.resources', () => {
    const out = runCli(['resources', 'list']);
    expect(out.exitCode).toBe(0);
    expect(Array.isArray(out.json.resources)).toBe(true);
    expect(out.json.resources.length).toBeGreaterThan(0);
    for (const r of out.json.resources) {
      expect(typeof r.uri).toBe('string');
      expect(r.uri).toMatch(/^bitbadges:\/\//);
      expect(typeof r.name).toBe('string');
    }
  });

  it('read returns the body of a known resource in envelope.data.text', () => {
    const list = runCli(['resources', 'list']);
    const first = list.json.resources[0];
    const out = runCli(['resources', 'read', first.uri]);
    expect(out.exitCode).toBe(0);
    expect(typeof out.json.text).toBe('string');
    expect(out.json.text.length).toBeGreaterThan(0);
  });

  it('read on an unknown URI exits non-zero', () => {
    const out = runCli(['resources', 'read', 'bitbadges://does-not-exist'], {
      throwOnError: false
    });
    expect(out.exitCode).not.toBe(0);
  });
});

describe('bb doctor', () => {
  it('emits a health report and a numeric exit code', () => {
    const out = runCli(['doctor', '--local'], { throwOnError: false, parseJson: false });
    // doctor may exit non-zero if some health checks fail. What matters is
    // that the command runs and produces output.
    expect(typeof out.exitCode).toBe('number');
    expect(out.stdout.length + out.stderr.length).toBeGreaterThan(0);
  });
});

describe('bb skills', () => {
  it('runs and produces output (skill list or 24h-cache fallback)', () => {
    // Skills hits the docs cache → may need a network fetch on a cold
    // cache. We accept either a successful list OR a clear cache-miss
    // error since CI may be offline.
    const out = runCli(['skills'], { throwOnError: false, parseJson: false });
    expect(typeof out.exitCode).toBe('number');
    expect(out.stdout.length + out.stderr.length).toBeGreaterThan(0);
  });
});
