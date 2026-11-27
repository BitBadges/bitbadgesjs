/**
 * Command-tree shape tests for vault.ts (BB-303).
 */

import { vaultCommand } from './vault.js';

describe('vaultCommand shape', () => {
  it('exposes the documented subcommand verbs and vaults alias', () => {
    expect(vaultCommand.name()).toBe('vault');
    expect(vaultCommand.aliases()).toContain('vaults');
    const names = vaultCommand.commands.map((c) => c.name()).sort();
    expect(names).toEqual(['deposit', 'emergency-migrate', 'list', 'show', 'status', 'withdraw']);
  });

  it('deposit and withdraw require --creator and --amount and take <collection-id>', () => {
    for (const verb of ['deposit', 'withdraw']) {
      const cmd = vaultCommand.commands.find((c) => c.name() === verb)!;
      const mandatory = (cmd as any).options.filter((o: any) => o.mandatory).map((o: any) => o.long);
      expect(mandatory).toEqual(expect.arrayContaining(['--creator', '--amount']));
      expect((cmd as any)._args.map((a: any) => a.name())).toEqual(['collection-id']);
      const all = (cmd as any).options.map((o: any) => o.long);
      expect(all).toEqual(expect.arrayContaining(['--base-units', '--approval-id', '--browser', '--burner']));
    }
  });

  it('emergency-migrate requires --creator, --from, and --amount', () => {
    const cmd = vaultCommand.commands.find((c) => c.name() === 'emergency-migrate')!;
    const mandatory = (cmd as any).options.filter((o: any) => o.mandatory).map((o: any) => o.long);
    expect(mandatory).toEqual(expect.arrayContaining(['--creator', '--from', '--amount']));
    expect((cmd as any)._args.map((a: any) => a.name())).toEqual(['collection-id']);
  });

  it('every verb supports network and output flags', () => {
    for (const verb of ['list', 'show', 'status', 'deposit', 'withdraw', 'emergency-migrate']) {
      const cmd = vaultCommand.commands.find((c) => c.name() === verb)!;
      const flags = (cmd as any).options.map((o: any) => o.long);
      expect(flags).toEqual(expect.arrayContaining(['--testnet', '--local', '--url', '--api-key', '--output-file', '--condensed']));
    }
  });
});
