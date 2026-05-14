/**
 * Command-tree shape tests for prediction-markets.ts.
 *
 * Note: `bb prediction-markets list` was reading `/browse?category=
 * predictionMarket` which returns 0 rows even for live PM collections —
 * the authoritative list lives at `/predictions`. The list-spec below
 * does not invoke the network, but the integration spec exercises the
 * path against a live indexer.
 */

import { predictionMarketsCommand } from './prediction-markets.js';

describe('predictionMarketsCommand shape', () => {
  it('exposes the documented subcommand verbs', () => {
    const names = predictionMarketsCommand.commands.map((c) => c.name()).sort();
    expect(names).toEqual([
      'build',
      'buy-no',
      'buy-yes',
      'cancel',
      'deposit',
      'list',
      'redeem',
      'resolve',
      'sell-no',
      'sell-yes',
      'show',
      'status'
    ]);
  });

  it('buy-yes + buy-no + sell-yes + sell-no require --creator + --token-amount + --payment-amount + --denom', () => {
    for (const verb of ['buy-yes', 'buy-no', 'sell-yes', 'sell-no']) {
      const cmd = predictionMarketsCommand.commands.find((c) => c.name() === verb);
      const required = (cmd! as any).options.filter((o: any) => o.required).map((o: any) => o.long);
      for (const f of ['--creator', '--token-amount', '--payment-amount', '--denom']) {
        expect(required).toContain(f);
      }
    }
  });

  it('buy/sell verbs accept --expiry + --approval-id', () => {
    for (const verb of ['buy-yes', 'buy-no', 'sell-yes', 'sell-no']) {
      const cmd = predictionMarketsCommand.commands.find((c) => c.name() === verb);
      const flagNames = (cmd! as any).options.map((o: any) => o.long);
      expect(flagNames).toContain('--expiry');
      expect(flagNames).toContain('--approval-id');
    }
  });

  it('cancel requires --creator + --side and accepts buy|sell only at runtime', () => {
    const cmd = predictionMarketsCommand.commands.find((c) => c.name() === 'cancel');
    expect((cmd! as any)._args.map((a: any) => a.name())).toEqual(['collection-id', 'approval-id']);
    const required = (cmd! as any).options.filter((o: any) => o.required).map((o: any) => o.long);
    expect(required).toContain('--creator');
    expect(required).toContain('--side');
  });

  it('deposit requires --creator + --amount', () => {
    const cmd = predictionMarketsCommand.commands.find((c) => c.name() === 'deposit');
    const required = (cmd! as any).options.filter((o: any) => o.required).map((o: any) => o.long);
    expect(required).toContain('--creator');
    expect(required).toContain('--amount');
  });

  it('redeem requires --creator + --state', () => {
    const cmd = predictionMarketsCommand.commands.find((c) => c.name() === 'redeem');
    const required = (cmd! as any).options.filter((o: any) => o.required).map((o: any) => o.long);
    expect(required).toContain('--creator');
    expect(required).toContain('--state');
  });

  it('resolve requires --creator + --outcome', () => {
    const cmd = predictionMarketsCommand.commands.find((c) => c.name() === 'resolve');
    const required = (cmd! as any).options.filter((o: any) => o.required).map((o: any) => o.long);
    expect(required).toContain('--creator');
    expect(required).toContain('--outcome');
  });

  it('list exposes --open filter', () => {
    const list = predictionMarketsCommand.commands.find((c) => c.name() === 'list');
    const flagNames = (list! as any).options.map((o: any) => o.long);
    expect(flagNames).toContain('--open');
  });

  it('build alias is registered', () => {
    const build = predictionMarketsCommand.commands.find((c) => c.name() === 'build');
    expect(build).toBeDefined();
    expect(build!.description()).toMatch(/Alias for `bb build prediction-market`/);
  });
});
