/**
 * Command-tree shape tests for issuer-controlled.ts (BB-303).
 */

import { issuerControlledCommand } from './issuer-controlled.js';

describe('issuerControlledCommand shape', () => {
  it('exposes the documented subcommand verbs', () => {
    expect(issuerControlledCommand.name()).toBe('issuer-controlled');
    const names = issuerControlledCommand.commands.map((c) => c.name()).sort();
    expect(names).toEqual(['freeze', 'mint', 'revoke', 'show', 'status', 'transfer']);
  });

  it('mint, transfer, revoke, and freeze enforce required manager/counterparty flags', () => {
    const req = (verb: string) =>
      (issuerControlledCommand.commands.find((c) => c.name() === verb)! as any).options
        .filter((o: any) => o.mandatory)
        .map((o: any) => o.long);

    expect(req('mint')).toEqual(expect.arrayContaining(['--creator', '--to']));
    expect(req('transfer')).toEqual(expect.arrayContaining(['--creator', '--from', '--to']));
    expect(req('revoke')).toEqual(expect.arrayContaining(['--creator', '--from']));
    expect(req('freeze')).toEqual(expect.arrayContaining(['--creator']));
  });

  it('every verb takes <collection-id> and exposes network + output flags', () => {
    for (const verb of ['show', 'status', 'mint', 'transfer', 'revoke', 'freeze']) {
      const cmd = issuerControlledCommand.commands.find((c) => c.name() === verb)!;
      expect((cmd as any)._args.map((a: any) => a.name())).toEqual(['collection-id']);
      const flags = (cmd as any).options.map((o: any) => o.long);
      expect(flags).toEqual(expect.arrayContaining(['--testnet', '--local', '--url', '--api-key', '--output-file', '--condensed']));
    }
  });
});
