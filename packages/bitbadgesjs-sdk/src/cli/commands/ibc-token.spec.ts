/**
 * Command-tree shape tests for ibc-token.ts (BB-303).
 */

import { ibcTokenCommand } from './ibc-token.js';

describe('ibcTokenCommand shape', () => {
  it('exposes the documented subcommand verbs and ibc-tokens alias', () => {
    expect(ibcTokenCommand.name()).toBe('ibc-token');
    expect(ibcTokenCommand.aliases()).toContain('ibc-tokens');
    const names = ibcTokenCommand.commands.map((c) => c.name()).sort();
    expect(names).toEqual(['show', 'status', 'unwrap', 'wrap']);
  });

  it('wrap and unwrap require --creator and --amount and accept --denom, --token-id, --base-units, --approval-id', () => {
    for (const verb of ['wrap', 'unwrap']) {
      const cmd = ibcTokenCommand.commands.find((c) => c.name() === verb)!;
      const mandatory = (cmd as any).options.filter((o: any) => o.mandatory).map((o: any) => o.long);
      expect(mandatory).toEqual(expect.arrayContaining(['--creator', '--amount']));
      expect((cmd as any)._args.map((a: any) => a.name())).toEqual(['collection-id']);
      const all = (cmd as any).options.map((o: any) => o.long);
      expect(all).toEqual(expect.arrayContaining(['--denom', '--token-id', '--base-units', '--approval-id', '--browser', '--burner']));
    }
  });

  it('every verb supports network and output flags and takes <collection-id>', () => {
    for (const verb of ['show', 'status', 'wrap', 'unwrap']) {
      const cmd = ibcTokenCommand.commands.find((c) => c.name() === verb)!;
      expect((cmd as any)._args.map((a: any) => a.name())).toEqual(['collection-id']);
      const flags = (cmd as any).options.map((o: any) => o.long);
      expect(flags).toEqual(expect.arrayContaining(['--testnet', '--local', '--url', '--api-key', '--output-file', '--condensed']));
    }
  });
});
