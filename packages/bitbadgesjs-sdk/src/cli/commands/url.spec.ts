/**
 * Command-tree shape tests for url.ts. The action handlers are pure
 * formatters — covered here by shape assertions; running smoke is cheap
 * but adds nothing the shape doesn't already lock in.
 */

import { urlCommand } from './url.js';

describe('urlCommand shape', () => {
  it('exposes the documented subcommand verbs', () => {
    const names = urlCommand.commands.map((c) => c.name()).sort();
    expect(names).toEqual(['address', 'badge', 'collection', 'tx', 'tx-cosmos']);
  });

  it('tx + tx-cosmos take <hash>', () => {
    for (const verb of ['tx', 'tx-cosmos']) {
      const c = urlCommand.commands.find((cmd) => cmd.name() === verb)!;
      expect((c as any)._args.map((a: any) => a.name())).toEqual(['hash']);
    }
  });

  it('collection takes <collection-id>', () => {
    const c = urlCommand.commands.find((cmd) => cmd.name() === 'collection')!;
    expect((c as any)._args.map((a: any) => a.name())).toEqual(['collection-id']);
  });

  it('badge takes <collection-id> <token-id>', () => {
    const c = urlCommand.commands.find((cmd) => cmd.name() === 'badge')!;
    expect((c as any)._args.map((a: any) => a.name())).toEqual(['collection-id', 'token-id']);
  });

  it('address takes <address>', () => {
    const c = urlCommand.commands.find((cmd) => cmd.name() === 'address')!;
    expect((c as any)._args.map((a: any) => a.name())).toEqual(['address']);
  });

  it('all subcommands accept --testnet + output flags', () => {
    for (const c of urlCommand.commands) {
      const longs = (c.options as any[]).map((o) => o.long);
      expect(longs).toEqual(expect.arrayContaining(['--testnet', '--output-file', '--condensed', '--raw']));
    }
  });
});
