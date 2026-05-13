/**
 * Command-tree shape tests for assets.ts. Action handlers hit CoinGecko
 * and the indexer — live smoke is covered by the integration suite (or
 * via manual `node dist/esm/cli/index.js assets ...`). This spec locks
 * the surface so the CLI stays stable as the registry evolves.
 */

import { assetsCommand } from './assets.js';

describe('assetsCommand shape', () => {
  it('exposes the documented subcommands', () => {
    const names = assetsCommand.commands.map((c) => c.name()).sort();
    expect(names).toEqual(['browse', 'list', 'price', 'show']);
  });

  it('list supports --with-prices + --vs-currency + --include-24h-change', () => {
    const c = assetsCommand.commands.find((cmd) => cmd.name() === 'list')!;
    const longs = (c.options as any[]).map((o) => o.long);
    expect(longs).toEqual(expect.arrayContaining(['--with-prices', '--vs-currency', '--include-24h-change']));
  });

  it('show takes <symbol-or-denom>', () => {
    const c = assetsCommand.commands.find((cmd) => cmd.name() === 'show')!;
    expect((c as any)._args.map((a: any) => a.name())).toEqual(['symbol-or-denom']);
  });

  it('browse takes network flags + price flags', () => {
    const c = assetsCommand.commands.find((cmd) => cmd.name() === 'browse')!;
    const longs = (c.options as any[]).map((o) => o.long);
    expect(longs).toEqual(expect.arrayContaining(['--testnet', '--local', '--url', '--api-key', '--with-prices']));
  });

  it('price takes variadic <symbols-or-denoms...>', () => {
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
});
