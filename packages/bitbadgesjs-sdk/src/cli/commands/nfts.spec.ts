/**
 * Command-tree shape tests for nfts.ts. Helpers live in core/bids.ts;
 * this spec guards the orderbook surface so accidental flag drift /
 * subcommand rename surfaces in unit CI.
 */

import { nftsCommand } from './nfts.js';

describe('nftsCommand shape', () => {
  it('exposes the documented orderbook verbs (no `build` alias for nfts)', () => {
    const names = nftsCommand.commands.map((c) => c.name()).sort();
    expect(names).toEqual([
      'bid',
      'buy',
      'cancel',
      'history',
      'list',
      'orders',
      'sell'
    ]);
  });

  it('bid declares --creator + --price + --denom as mandatory (requiredOption) and --token-id as optional', () => {
    const cmd = nftsCommand.commands.find((c) => c.name() === 'bid');
    const mandatory = (cmd! as any).options.filter((o: any) => o.mandatory).map((o: any) => o.long);
    for (const f of ['--creator', '--price', '--denom']) expect(mandatory).toContain(f);
    // --token-id must NOT be mandatory (collection-wide bid)
    expect(mandatory).not.toContain('--token-id');
    const allFlags = (cmd! as any).options.map((o: any) => o.long);
    expect(allFlags).toContain('--token-id');
  });

  it('list (sell-side) declares --creator + --token-id + --price + --denom as mandatory', () => {
    const cmd = nftsCommand.commands.find((c) => c.name() === 'list');
    const mandatory = (cmd! as any).options.filter((o: any) => o.mandatory).map((o: any) => o.long);
    for (const f of ['--creator', '--token-id', '--price', '--denom']) {
      expect(mandatory).toContain(f);
    }
  });

  it('cancel takes <collection-id> + <approval-id> and declares --creator + --side as mandatory', () => {
    const cmd = nftsCommand.commands.find((c) => c.name() === 'cancel');
    expect((cmd! as any)._args.map((a: any) => a.name())).toEqual(['collection-id', 'approval-id']);
    const mandatory = (cmd! as any).options.filter((o: any) => o.mandatory).map((o: any) => o.long);
    expect(mandatory).toContain('--creator');
    expect(mandatory).toContain('--side');
  });

  it('buy declares --creator + --approval-id + --seller as mandatory', () => {
    const cmd = nftsCommand.commands.find((c) => c.name() === 'buy');
    const mandatory = (cmd! as any).options.filter((o: any) => o.mandatory).map((o: any) => o.long);
    expect(mandatory).toContain('--creator');
    expect(mandatory).toContain('--approval-id');
    expect(mandatory).toContain('--seller');
  });

  it('sell declares --creator + --approval-id + --bidder as mandatory', () => {
    const cmd = nftsCommand.commands.find((c) => c.name() === 'sell');
    const mandatory = (cmd! as any).options.filter((o: any) => o.mandatory).map((o: any) => o.long);
    expect(mandatory).toContain('--creator');
    expect(mandatory).toContain('--approval-id');
    expect(mandatory).toContain('--bidder');
  });

  it('buy + sell take <collection-id> + <token-id>', () => {
    for (const verb of ['buy', 'sell']) {
      const cmd = nftsCommand.commands.find((c) => c.name() === verb);
      expect((cmd! as any)._args.map((a: any) => a.name())).toEqual(['collection-id', 'token-id']);
    }
  });

  it('orders takes --mine + --denom + --collection-offers', () => {
    const cmd = nftsCommand.commands.find((c) => c.name() === 'orders');
    const flagNames = (cmd! as any).options.map((o: any) => o.long);
    expect(flagNames).toContain('--mine');
    expect(flagNames).toContain('--denom');
    expect(flagNames).toContain('--collection-offers');
  });

  it('history takes --limit', () => {
    const cmd = nftsCommand.commands.find((c) => c.name() === 'history');
    const flagNames = (cmd! as any).options.map((o: any) => o.long);
    expect(flagNames).toContain('--limit');
  });
});
