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
  // CLI binary.
  it('rejects non-address inputs with a clear error', async () => {
    const errs: string[] = [];
    const errSpy = jest.spyOn(console, 'error').mockImplementation((m: any) => {
      errs.push(String(m));
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
      expect(errs.join('\n')).toMatch(/invalid address/i);
      expect(errs.join('\n')).toMatch(/alice/);
      expect(errs.join('\n')).toMatch(/charlie/);
    } finally {
      errSpy.mockRestore();
      exitSpy.mockRestore();
    }
  });

  it('accepts well-formed bb1 addresses', async () => {
    const logs: string[] = [];
    const logSpy = jest.spyOn(console, 'log').mockImplementation((m: any) => {
      logs.push(String(m));
    });
    try {
      await genListIdCommand.parseAsync(
        [
          'bb1kt3vp977rqxekursm0agj26ep4c6ksp6dfjpdx',
          'bb1m0cjg3mvjynjj3rt00wgk3m58shpp3z5w6gc7k',
        ],
        { from: 'user' },
      );
      expect(logs[0]).toMatch(
        /^bb1kt3vp977rqxekursm0agj26ep4c6ksp6dfjpdx:bb1m0cjg3mvjynjj3rt00wgk3m58shpp3z5w6gc7k$/,
      );
    } finally {
      logSpy.mockRestore();
    }
  });

  it('--blacklist produces the !(...) wrapper', async () => {
    const logs: string[] = [];
    const logSpy = jest.spyOn(console, 'log').mockImplementation((m: any) => {
      logs.push(String(m));
    });
    try {
      await genListIdCommand.parseAsync(
        ['--blacklist', 'bb1kt3vp977rqxekursm0agj26ep4c6ksp6dfjpdx'],
        { from: 'user' },
      );
      expect(logs[0]).toMatch(/^!\(bb1kt3vp977rqxekursm0agj26ep4c6ksp6dfjpdx\)$/);
    } finally {
      logSpy.mockRestore();
    }
  });
});
