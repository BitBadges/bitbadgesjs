/**
 * Unit tests for gen-list-id.ts.
 *
 * Covers the address-validation guardrail added on 2026-05-13 — without it,
 * `gen-list-id alice charlie` silently emitted `alice:charlie` as a list ID
 * that the chain would reject. The CLI must fail loud at the input boundary.
 */

import { genListIdCommand } from './gen-list-id.js';

describe('genListIdCommand shape', () => {
  it('takes a variadic addresses argument', () => {
    const args = (genListIdCommand as any)._args;
    expect(args.length).toBe(1);
    expect(args[0].name()).toBe('addresses');
    expect(args[0].variadic).toBe(true);
  });

  it('exposes --blacklist option', () => {
    const longs = (genListIdCommand.options as any[]).map((o) => o.long);
    expect(longs).toContain('--blacklist');
  });
});

describe('genListIdCommand behavior', () => {
  // Drive the command via Commander's own parser (parseAsync) so the
  // variadic args + option flags walk through the same code path as the
  // CLI binary. Post-#0398 the command always emits an envelope to
  // stdout (process.stdout.write) — invalid input still exits 2 but the
  // error envelope lands on stdout, not stderr console.error.
  it('rejects non-address inputs with an error envelope', async () => {
    const writes: string[] = [];
    const stdoutSpy = jest.spyOn(process.stdout, 'write').mockImplementation((c: any) => {
      writes.push(typeof c === 'string' ? c : c.toString());
      return true;
    });
    const exitSpy = jest
      .spyOn(process, 'exit')
      .mockImplementation(((code?: number) => {
        throw new Error(`__exit__:${code}`);
      }) as any);

    try {
      await expect(
        genListIdCommand.parseAsync(['alice', 'charlie'], { from: 'user' }),
      ).rejects.toThrow(/__exit__:2/);
      const out = writes.join('');
      expect(out).toMatch(/invalid address/i);
      expect(out).toMatch(/alice/);
      expect(out).toMatch(/charlie/);
    } finally {
      stdoutSpy.mockRestore();
      exitSpy.mockRestore();
    }
  });

  it('accepts well-formed bb1 addresses', async () => {
    const writes: string[] = [];
    const stdoutSpy = jest.spyOn(process.stdout, 'write').mockImplementation((c: any) => {
      writes.push(typeof c === 'string' ? c : c.toString());
      return true;
    });
    try {
      await genListIdCommand.parseAsync(
        [
          'bb1kt3vp977rqxekursm0agj26ep4c6ksp6dfjpdx',
          'bb1m0cjg3mvjynjj3rt00wgk3m58shpp3z5w6gc7k',
        ],
        { from: 'user' },
      );
      const env = JSON.parse(writes.join(''));
      expect(env.ok).toBe(true);
      expect(env.data.listId).toMatch(
        /^bb1kt3vp977rqxekursm0agj26ep4c6ksp6dfjpdx:bb1m0cjg3mvjynjj3rt00wgk3m58shpp3z5w6gc7k$/,
      );
    } finally {
      stdoutSpy.mockRestore();
    }
  });

  it('--blacklist produces the !(...) wrapper', async () => {
    const writes: string[] = [];
    const stdoutSpy = jest.spyOn(process.stdout, 'write').mockImplementation((c: any) => {
      writes.push(typeof c === 'string' ? c : c.toString());
      return true;
    });
    try {
      await genListIdCommand.parseAsync(
        ['--blacklist', 'bb1kt3vp977rqxekursm0agj26ep4c6ksp6dfjpdx'],
        { from: 'user' },
      );
      const env = JSON.parse(writes.join(''));
      expect(env.ok).toBe(true);
      expect(env.data.listId).toMatch(/^!\(bb1kt3vp977rqxekursm0agj26ep4c6ksp6dfjpdx\)$/);
      expect(env.data.mode).toBe('blacklist');
    } finally {
      stdoutSpy.mockRestore();
    }
  });
});
