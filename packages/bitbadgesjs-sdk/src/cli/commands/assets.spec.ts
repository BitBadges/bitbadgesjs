/**
 * Command-tree shape tests for assets.ts. Every subcommand hits the
 * BitBadges indexer's `/assetPairs` endpoints — no static registry,
 * no CoinGecko. Live smoke lives in the integration suite. This spec
 * locks the surface so the CLI stays stable.
 */

import { assetsCommand } from './assets.js';

describe('assetsCommand shape', () => {
  it('exposes the documented subcommands', () => {
    const names = assetsCommand.commands.map((c) => c.name()).sort();
    expect(names).toEqual(['browse', 'list', 'price', 'show']);
  });

  it('list supports pagination + sort flags', () => {
    const c = assetsCommand.commands.find((cmd) => cmd.name() === 'list')!;
    const longs = (c.options as any[]).map((o) => o.long);
    expect(longs).toEqual(expect.arrayContaining(['--bookmark', '--sort-by', '--sort-direction', '--limit']));
  });

  it('show takes <denom-or-symbol>', () => {
    const c = assetsCommand.commands.find((cmd) => cmd.name() === 'show')!;
    expect((c as any)._args.map((a: any) => a.name())).toEqual(['denom-or-symbol']);
  });

  it('all subcommands carry indexer network flags', () => {
    for (const c of assetsCommand.commands) {
      const longs = (c.options as any[]).map((o) => o.long);
      expect(longs).toEqual(expect.arrayContaining(['--testnet', '--local', '--url', '--api-key']));
    }
  });

  it('price takes variadic <denoms-or-symbols...>', () => {
    const c = assetsCommand.commands.find((cmd) => cmd.name() === 'price')!;
    const args = (c as any)._args;
    expect(args.length).toBe(1);
    expect(args[0].variadic).toBe(true);
  });

  it('all subcommands accept --output-file + --condensed', () => {
    for (const c of assetsCommand.commands) {
      const longs = (c.options as any[]).map((o) => o.long);
      expect(longs).toEqual(expect.arrayContaining(['--output-file', '--condensed']));
    }
  });

  it('parent description references the indexer (not external sources)', () => {
    const desc = assetsCommand.description();
    expect(desc).toMatch(/indexer/i);
    expect(desc).not.toMatch(/coingecko/i);
  });
});
