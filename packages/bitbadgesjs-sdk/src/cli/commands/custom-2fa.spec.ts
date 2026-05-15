/**
 * Command-tree shape tests for custom-2fa.ts (ticket 0420). Behavioural
 * parse/guard coverage (comma-split recipients, expiry→duration, the
 * future-window guard) lives in cli/integration/cli-build-pipeline.spec.ts
 * (runCli emit-only, no devnet); the on-chain broadcast lives in
 * cli/integration/custom-2fa.spec.ts. This guards flag/subcommand drift
 * in the fast unit suite.
 */

import { custom2faCommand } from './custom-2fa.js';

describe('custom2faCommand shape', () => {
  it('exposes only the mint subcommand', () => {
    expect(custom2faCommand.commands.map((c) => c.name()).sort()).toEqual(['mint']);
  });

  it('mint requires --creator + --to, takes a <collection-id> arg', () => {
    const cmd = custom2faCommand.commands.find((c) => c.name() === 'mint')!;
    const mandatory = (cmd as any).options.filter((o: any) => o.mandatory).map((o: any) => o.long);
    expect(mandatory).toEqual(expect.arrayContaining(['--creator', '--to']));
    expect((cmd as any)._args.map((a: any) => a.name())).toEqual(['collection-id']);
  });

  it('mint exposes canonical --expiration + hidden --expiry alias + the shared deploy flags', () => {
    const cmd = custom2faCommand.commands.find((c) => c.name() === 'mint')!;
    const all = (cmd as any).options.map((o: any) => o.long);
    expect(all).toContain('--expiration');
    expect(all).toContain('--expiry'); // deprecated hidden alias
    expect(all).toEqual(expect.arrayContaining(['--browser', '--burner']));
  });
});
