/**
 * Command-tree shape tests for crowdfunds.ts. Validators + helper builders
 * are exercised in core/crowdfunds.spec.ts.
 */

import { crowdfundsCommand } from './crowdfunds.js';

describe('crowdfundsCommand shape', () => {
  it('is named `crowdfunds` and exposes `crowdfund` as a backwards-compat alias', () => {
    expect(crowdfundsCommand.name()).toBe('crowdfunds');
    expect(crowdfundsCommand.aliases()).toContain('crowdfund');
  });

  it('exposes the documented subcommand verbs', () => {
    const names = crowdfundsCommand.commands.map((c) => c.name()).sort();
    expect(names).toEqual([
      'build',
      'contribute',
      'list',
      'refund',
      'show',
      'status',
      'withdraw'
    ]);
  });

  it('contribute + refund require --creator + --amount', () => {
    for (const verb of ['contribute', 'refund']) {
      const cmd = crowdfundsCommand.commands.find((c) => c.name() === verb);
      const required = (cmd! as any).options.filter((o: any) => o.required).map((o: any) => o.long);
      expect(required).toContain('--creator');
      expect(required).toContain('--amount');
    }
  });

  it('withdraw requires --creator', () => {
    const cmd = crowdfundsCommand.commands.find((c) => c.name() === 'withdraw');
    const required = (cmd! as any).options.filter((o: any) => o.required).map((o: any) => o.long);
    expect(required).toContain('--creator');
  });

  it('list exposes --mine + --open filters', () => {
    const list = crowdfundsCommand.commands.find((c) => c.name() === 'list');
    const flagNames = (list! as any).options.map((o: any) => o.long);
    expect(flagNames).toContain('--mine');
    expect(flagNames).toContain('--open');
  });

  it('contribute / withdraw / refund / show / status take <collection-id>', () => {
    for (const verb of ['contribute', 'withdraw', 'refund', 'show', 'status']) {
      const c = crowdfundsCommand.commands.find((cmd) => cmd.name() === verb);
      expect((c! as any)._args[0].name()).toBe('collection-id');
    }
  });

  it('build alias is registered and points at `bb build crowdfund`', () => {
    const build = crowdfundsCommand.commands.find((c) => c.name() === 'build');
    expect(build).toBeDefined();
    expect(build!.description()).toMatch(/Alias for `bb build crowdfund`/);
  });
});
