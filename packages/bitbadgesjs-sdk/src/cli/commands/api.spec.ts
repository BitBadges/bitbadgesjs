/**
 * Unit tests for api.ts.
 *
 * The api command builds a Commander tree from the static ROUTES registry
 * and exposes a top-level --search helper. We cover:
 *   - Every tag group from TAG_DESCRIPTIONS that has routes is present.
 *   - --search filters the registry by name/path/tag/description.
 *   - --search --format json emits structured output.
 *   - Unknown-route invocation errors (exercised by Commander itself).
 *
 * Live API calls are covered by cli-core.spec.ts integration.
 */

import { createApiCommand } from './api.js';

describe('createApiCommand shape', () => {
  it('builds an api command with tag groups + an "all" group', () => {
    const api = createApiCommand();
    const subNames = api.commands.map((c) => c.name()).sort();
    // From TAG_DESCRIPTIONS — we don't assert the exact list (it grows
    // with the route registry), only that the documented groups exist.
    expect(subNames).toEqual(
      expect.arrayContaining([
        'accounts',
        'tokens',
        'claims',
        'auth',
        'tx',
        'plugins',
        'stores',
        'onchain-stores',
        'pages',
        'assets',
        'misc',
        'all',
      ]),
    );
  });

  it('"all" group exposes the same flat list of routes', () => {
    const api = createApiCommand();
    const all = api.commands.find((c) => c.name() === 'all')!;
    // 106 routes per top-level help text on 2026-05-13. Lower bound is
    // safer than equality — the registry grows.
    expect(all.commands.length).toBeGreaterThan(50);
  });

  it('exposes --search + --format flags at the top level', () => {
    const api = createApiCommand();
    const longs = (api.options as any[]).map((o) => o.long);
    expect(longs).toEqual(expect.arrayContaining(['--search', '--format']));
  });

  it('group commands carry a "<n> routes" suffix in their description', () => {
    const api = createApiCommand();
    const accounts = api.commands.find((c) => c.name() === 'accounts')!;
    expect(accounts.description()).toMatch(/\(\d+ routes\)/);
  });
});

describe('api --search', () => {
  const captureStdout = () => {
    const chunks: string[] = [];
    const orig = process.stdout.write.bind(process.stdout);
    process.stdout.write = ((s: any) => {
      chunks.push(typeof s === 'string' ? s : s.toString('utf-8'));
      return true;
    }) as any;
    return {
      out: () => chunks.join(''),
      restore: () => {
        process.stdout.write = orig;
      },
    };
  };

  it('returns no-match message when keyword has no hits', async () => {
    const api = createApiCommand();
    const cap = captureStdout();
    try {
      await api.parseAsync(
        ['--search', 'this-keyword-does-not-exist-xyzzy'],
        { from: 'user' },
      );
    } finally {
      cap.restore();
    }
    expect(cap.out()).toMatch(/No routes match/);
  });

  it('--format json emits an array of route metadata', async () => {
    const api = createApiCommand();
    const cap = captureStdout();
    try {
      await api.parseAsync(['--search', 'account', '--format', 'json'], {
        from: 'user',
      });
    } finally {
      cap.restore();
    }
    const parsed = JSON.parse(cap.out().trim());
    expect(Array.isArray(parsed)).toBe(true);
    expect(parsed.length).toBeGreaterThan(0);
    for (const m of parsed) {
      expect(m).toEqual(
        expect.objectContaining({
          name: expect.any(String),
          method: expect.any(String),
          path: expect.any(String),
        }),
      );
    }
  });
});
