/**
 * Unit tests for resources.ts.
 *
 * resources.list / read both delegate to the builder registry — the
 * registry itself is covered by other tests. This spec covers:
 *   - The command-tree shape stays stable (list, read).
 *   - --uris flag emits one URI per line (the agent-friendly output).
 *   - read with an unknown URI exits non-zero so scripts can short-circuit.
 */

import { resourcesCommand } from './resources.js';

describe('resourcesCommand shape', () => {
  it('exposes list + read subcommands', () => {
    const names = resourcesCommand.commands.map((c) => c.name()).sort();
    expect(names).toEqual(['list', 'read']);
  });

  it('list supports --uris', () => {
    const c = resourcesCommand.commands.find((cmd) => cmd.name() === 'list')!;
    const longs = (c.options as any[]).map((o) => o.long);
    expect(longs).toContain('--uris');
  });

  it('read takes <uri>', () => {
    const c = resourcesCommand.commands.find((cmd) => cmd.name() === 'read')!;
    expect((c as any)._args.map((a: any) => a.name())).toEqual(['uri']);
  });
});

describe('resourcesCommand behavior', () => {
  const captureStdout = () => {
    const chunks: string[] = [];
    const orig = process.stdout.write.bind(process.stdout);
    process.stdout.write = ((s: any) => {
      chunks.push(typeof s === 'string' ? s : s.toString('utf-8'));
      return true;
    }) as any;
    return {
      chunks,
      restore: () => {
        process.stdout.write = orig;
      },
    };
  };

  it('list --uris surfaces every URI in envelope.data.uris', async () => {
    const cap = captureStdout();
    try {
      await resourcesCommand.parseAsync(['list', '--uris'], { from: 'user' });
    } finally {
      cap.restore();
    }
    const env = JSON.parse(cap.chunks.join(''));
    expect(env.ok).toBe(true);
    expect(Array.isArray(env.data.uris)).toBe(true);
    expect(env.data.uris.length).toBeGreaterThan(0);
    for (const uri of env.data.uris) {
      expect(uri).toMatch(/^bitbadges:\/\//);
    }
  });

  it('read returns text body for a known URI', async () => {
    const cap = captureStdout();
    try {
      await resourcesCommand.parseAsync(['read', 'bitbadges://tokens/registry'], {
        from: 'user',
      });
    } finally {
      cap.restore();
    }
    expect(cap.chunks.join('').length).toBeGreaterThan(0);
    expect(process.exitCode).not.toBe(1);
  });

  it('read sets exitCode=1 on an unknown URI', async () => {
    const prev = process.exitCode;
    process.exitCode = 0;
    const cap = captureStdout();
    try {
      await resourcesCommand.parseAsync(['read', 'bitbadges://nonexistent'], {
        from: 'user',
      });
    } finally {
      cap.restore();
    }
    expect(process.exitCode).toBe(1);
    process.exitCode = prev;
  });
});
