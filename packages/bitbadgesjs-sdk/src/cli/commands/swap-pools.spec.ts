/**
 * Command-tree shape tests for the swap-pools / swap-asset-pairs additions
 * to swap.ts. Action handlers are thin HTTP wrappers — this spec only
 * locks the subcommand surface so we notice regressions.
 */

import { swapCommand } from './swap.js';

describe('swap pools surface', () => {
  const pools = swapCommand.commands.find((c) => c.name() === 'pools')!;

  it('is registered under bb swap', () => {
    expect(pools).toBeDefined();
  });

  it('exposes the documented subcommands', () => {
    const names = pools.commands.map((c) => c.name()).sort();
    expect(names).toEqual(['batch', 'by-assets', 'by-denom', 'list', 'show']);
  });

  it('list takes pagination + sort options', () => {
    const list = pools.commands.find((c) => c.name() === 'list')!;
    const longs = (list.options as any[]).map((o) => o.long);
    expect(longs).toEqual(expect.arrayContaining(['--bookmark', '--sort-by', '--sort-order']));
  });

  it('show takes <pool-id>', () => {
    const show = pools.commands.find((c) => c.name() === 'show')!;
    expect((show as any)._args.map((a: any) => a.name())).toEqual(['pool-id']);
  });

  it('by-denom takes <symbol|denom>', () => {
    const c = pools.commands.find((c) => c.name() === 'by-denom')!;
    expect((c as any)._args.map((a: any) => a.name())).toEqual(['symbol|denom']);
  });

  it('by-assets takes <denom-a> <denom-b>', () => {
    const c = pools.commands.find((c) => c.name() === 'by-assets')!;
    expect((c as any)._args.map((a: any) => a.name())).toEqual(['denom-a', 'denom-b']);
  });

  it('batch takes variadic <pool-ids...>', () => {
    const c = pools.commands.find((c) => c.name() === 'batch')!;
    const args = (c as any)._args;
    expect(args.length).toBe(1);
    expect(args[0].name()).toBe('pool-ids');
    expect(args[0].variadic).toBe(true);
  });
});

describe('swap asset-pairs surface', () => {
  const pairs = swapCommand.commands.find((c) => c.name() === 'asset-pairs')!;

  it('is registered under bb swap', () => {
    expect(pairs).toBeDefined();
  });

  it('exposes the analytics subcommands', () => {
    const names = pairs.commands.map((c) => c.name()).sort();
    expect(names).toEqual([
      'by-denoms',
      'highest-volume',
      'list',
      'price-sorted',
      'search',
      'top-gainers',
      'top-losers',
      'weekly-top-gainers',
      'weekly-top-losers'
    ]);
  });

  it('search takes <query>', () => {
    const c = pairs.commands.find((c) => c.name() === 'search')!;
    expect((c as any)._args.map((a: any) => a.name())).toEqual(['query']);
  });

  it('by-denoms takes variadic <denoms...>', () => {
    const c = pairs.commands.find((c) => c.name() === 'by-denoms')!;
    const args = (c as any)._args;
    expect(args[0].variadic).toBe(true);
  });

  it('top-gainers / top-losers / highest-volume support --limit + --bookmark', () => {
    for (const verb of ['top-gainers', 'top-losers', 'highest-volume', 'weekly-top-gainers', 'weekly-top-losers', 'price-sorted']) {
      const c = pairs.commands.find((c) => c.name() === verb)!;
      const longs = (c.options as any[]).map((o) => o.long);
      expect(longs).toEqual(expect.arrayContaining(['--bookmark', '--limit']));
    }
  });
});
