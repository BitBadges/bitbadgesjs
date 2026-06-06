/**
 * Command-tree shape tests for agent-vaults.ts. Helpers/builders are exercised
 * in core/agent-vaults.spec.ts + core/builders/agent-vault.spec.ts; this spec
 * guards the CLI surface against accidental flag/subcommand drift.
 *
 * Note: the `build` alias is wired in cli/index.ts (makeBuildAlias), not in this
 * command file, so it is intentionally absent here.
 */

import { agentVaultsCommand } from './agent-vaults.js';

describe('agentVaultsCommand shape', () => {
  it('exposes the documented subcommand verbs', () => {
    const names = agentVaultsCommand.commands.map((c) => c.name()).sort();
    expect(names).toEqual(['deposit', 'list', 'pay', 'recover', 'show', 'status', 'vote', 'withdraw']);
  });

  it('recover requires --creator, --from, --amount', () => {
    const cmd = agentVaultsCommand.commands.find((c) => c.name() === 'recover')!;
    const required = (cmd as any).options.filter((o: any) => o.required).map((o: any) => o.long);
    for (const f of ['--creator', '--from', '--amount']) expect(required).toContain(f);
  });

  it('deposit + withdraw require --creator and --amount', () => {
    for (const verb of ['deposit', 'withdraw']) {
      const cmd = agentVaultsCommand.commands.find((c) => c.name() === verb)!;
      const required = (cmd as any).options.filter((o: any) => o.required).map((o: any) => o.long);
      for (const f of ['--creator', '--amount']) expect(required).toContain(f);
    }
  });

  it('pay requires --creator, --amount, --to', () => {
    const cmd = agentVaultsCommand.commands.find((c) => c.name() === 'pay')!;
    const required = (cmd as any).options.filter((o: any) => o.required).map((o: any) => o.long);
    for (const f of ['--creator', '--amount', '--to']) expect(required).toContain(f);
  });

  it('vote requires --creator', () => {
    const cmd = agentVaultsCommand.commands.find((c) => c.name() === 'vote')!;
    const required = (cmd as any).options.filter((o: any) => o.required).map((o: any) => o.long);
    expect(required).toContain('--creator');
  });

  it('every subcommand takes <collection-id> as the first positional', () => {
    for (const verb of ['show', 'status', 'deposit', 'withdraw', 'pay', 'recover', 'vote']) {
      const c = agentVaultsCommand.commands.find((cmd) => cmd.name() === verb)!;
      expect((c as any)._args[0].name()).toBe('collection-id');
    }
  });
});
