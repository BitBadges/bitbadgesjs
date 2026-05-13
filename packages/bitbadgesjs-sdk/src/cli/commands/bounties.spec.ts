/**
 * Command-tree shape tests for bounties.ts. Action handlers are
 * integration-heavy — we rely on `core/bounties.spec.ts` for the
 * underlying helper coverage and this spec for command-surface
 * regressions.
 */

import { bountiesCommand } from './bounties.js';

describe('bountiesCommand shape', () => {
  it('exposes the documented subcommand verbs', () => {
    const names = bountiesCommand.commands.map((c) => c.name()).sort();
    expect(names).toEqual(['accept', 'build', 'claim-refund', 'deny', 'list', 'show', 'status']);
  });

  it('accept / deny / claim-refund all require --creator', () => {
    for (const verb of ['accept', 'deny', 'claim-refund']) {
      const c = bountiesCommand.commands.find((cmd) => cmd.name() === verb);
      expect(c).toBeDefined();
      const required = (c! as any).options.filter((o: any) => o.required).map((o: any) => o.long);
      expect(required).toContain('--creator');
    }
  });

  it('show + status + accept + deny + claim-refund take a collection-id argument', () => {
    for (const verb of ['show', 'status', 'accept', 'deny', 'claim-refund']) {
      const c = bountiesCommand.commands.find((cmd) => cmd.name() === verb);
      expect((c! as any)._args.map((a: any) => a.name())).toEqual(['collection-id']);
    }
  });

  it('list exposes --mine and --open filters', () => {
    const list = bountiesCommand.commands.find((c) => c.name() === 'list');
    const flagNames = (list! as any).options.map((o: any) => o.long);
    expect(flagNames).toContain('--mine');
    expect(flagNames).toContain('--open');
  });

  it('build alias is registered and matches the standard contract', () => {
    const build = bountiesCommand.commands.find((c) => c.name() === 'build');
    expect(build).toBeDefined();
    expect(build!.description()).toMatch(/Alias for `bb build bounty`/);
  });
});
