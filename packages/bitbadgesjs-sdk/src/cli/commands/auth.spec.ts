/**
 * Command-tree shape tests for auth.ts.
 *
 * Auth flows are exercised end-to-end in cli-core / cli-discovery
 * integration specs. This unit spec just locks the public verb surface.
 */

import { authCommand } from './auth.js';

describe('authCommand shape', () => {
  it('exposes the documented verbs', () => {
    const names = authCommand.commands.map((c) => c.name()).sort();
    expect(names).toEqual([
      'challenge',
      'login',
      'logout',
      'path',
      'status',
      'use',
      'verify',
      'whoami',
    ]);
  });

  it('login requires --address and exposes --browser / --signature paths', () => {
    const login = authCommand.commands.find((c) => c.name() === 'login')!;
    const requiredLongs = (login.options as any[])
      .filter((o) => o.required)
      .map((o) => o.long);
    expect(requiredLongs).toContain('--address');
    const longs = (login.options as any[]).map((o) => o.long);
    expect(longs).toEqual(
      expect.arrayContaining([
        '--signature',
        '--public-key',
        '--message',
        '--message-file',
        '--browser',
        '--no-open',
        '--timeout',
        '--port',
      ]),
    );
  });

  it('challenge requires --address and exposes --json + --no-save-pending', () => {
    const challenge = authCommand.commands.find((c) => c.name() === 'challenge')!;
    const requiredLongs = (challenge.options as any[])
      .filter((o) => o.required)
      .map((o) => o.long);
    expect(requiredLongs).toContain('--address');
    const longs = (challenge.options as any[]).map((o) => o.long);
    expect(longs).toEqual(expect.arrayContaining(['--json', '--no-save-pending']));
  });

  it('use takes <address>', () => {
    const use = authCommand.commands.find((c) => c.name() === 'use')!;
    expect((use as any)._args.map((a: any) => a.name())).toEqual(['address']);
  });

  it('path is a flat command (no flags)', () => {
    const pathCmd = authCommand.commands.find((c) => c.name() === 'path')!;
    expect(pathCmd.commands.length).toBe(0);
  });
});
