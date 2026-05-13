/**
 * Command-tree shape tests for swap.ts (top-level read paths).
 *
 * Pool + asset-pair surfaces have their own specs (swap-pools.spec.ts +
 * the live integration). This spec covers the rest of the swap surface
 * (assets / chains / balances / estimate / track / status / activities)
 * so the documented agent contract stays stable.
 */

import { swapCommand } from './swap.js';

describe('swapCommand shape', () => {
  it('exposes the documented top-level subcommands', () => {
    const names = swapCommand.commands.map((c) => c.name()).sort();
    expect(names).toEqual([
      'activities',
      'asset-pairs',
      'assets',
      'balances',
      'chains',
      'estimate',
      'pools',
      'status',
      'track',
    ]);
  });

  it('assets exposes --include-svm + --include-cw20', () => {
    const c = swapCommand.commands.find((cmd) => cmd.name() === 'assets')!;
    const longs = (c.options as any[]).map((o) => o.long);
    expect(longs).toEqual(expect.arrayContaining(['--include-svm', '--include-cw20']));
  });

  it('chains exposes --include-svm + --only-testnets', () => {
    const c = swapCommand.commands.find((cmd) => cmd.name() === 'chains')!;
    const longs = (c.options as any[]).map((o) => o.long);
    expect(longs).toEqual(expect.arrayContaining(['--include-svm', '--only-testnets']));
  });

  it('balances takes <chains-to-addresses-json>', () => {
    const c = swapCommand.commands.find((cmd) => cmd.name() === 'balances')!;
    expect((c as any)._args.map((a: any) => a.name())).toEqual(['chains-to-addresses-json']);
  });

  it('estimate takes <from> <to> <amount> + supports --addresses', () => {
    const c = swapCommand.commands.find((cmd) => cmd.name() === 'estimate')!;
    expect((c as any)._args.map((a: any) => a.name())).toEqual(['from', 'to', 'amount']);
    const longs = (c.options as any[]).map((o) => o.long);
    expect(longs).toEqual(
      expect.arrayContaining([
        '--source-chain',
        '--dest-chain',
        '--addresses',
        '--slippage',
        '--local-only',
      ]),
    );
  });

  it('track + status take <tx-hash> + --chain-id', () => {
    for (const verb of ['track', 'status']) {
      const c = swapCommand.commands.find((cmd) => cmd.name() === verb)!;
      expect((c as any)._args.map((a: any) => a.name())).toEqual(['tx-hash']);
      const longs = (c.options as any[]).map((o) => o.long);
      expect(longs).toContain('--chain-id');
    }
  });

  it('activities supports --bookmark', () => {
    const c = swapCommand.commands.find((cmd) => cmd.name() === 'activities')!;
    const longs = (c.options as any[]).map((o) => o.long);
    expect(longs).toContain('--bookmark');
  });

  it('every read subcommand supports network selection + output flags', () => {
    const expected = ['--testnet', '--local', '--url', '--api-key', '--output-file', '--condensed'];
    // pools + asset-pairs are command groups with their own subcommand
    // surfaces — drilled into by their own spec files.
    const flatSubs = ['assets', 'chains', 'balances', 'estimate', 'track', 'status', 'activities'];
    for (const verb of flatSubs) {
      const c = swapCommand.commands.find((cmd) => cmd.name() === verb)!;
      const longs = (c.options as any[]).map((o) => o.long);
      expect(longs).toEqual(expect.arrayContaining(expected));
    }
  });
});
