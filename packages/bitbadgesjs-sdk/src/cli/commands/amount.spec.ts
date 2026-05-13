/**
 * Command-tree shape tests for amount.ts. Helper math is covered by
 * `core/coin-utils.spec.ts`; this spec locks the public CLI surface.
 */

import { amountCommand } from './amount.js';

describe('amountCommand shape', () => {
  it('exposes the documented subcommand verbs', () => {
    const names = amountCommand.commands.map((c) => c.name()).sort();
    expect(names).toEqual([
      'max-wrappable',
      'min-amount',
      'slippage',
      'to-display',
      'to-raw',
      'unwrap-preview',
      'wrap-preview'
    ]);
  });

  it('to-raw takes <display> + supports --denom OR --decimals', () => {
    const c = amountCommand.commands.find((cmd) => cmd.name() === 'to-raw')!;
    expect((c as any)._args.map((a: any) => a.name())).toEqual(['display']);
    const longs = (c.options as any[]).map((o) => o.long);
    expect(longs).toEqual(expect.arrayContaining(['--denom', '--decimals', '--round']));
  });

  it('to-display takes <raw>', () => {
    const c = amountCommand.commands.find((cmd) => cmd.name() === 'to-display')!;
    expect((c as any)._args.map((a: any) => a.name())).toEqual(['raw']);
    const longs = (c.options as any[]).map((o) => o.long);
    expect(longs).toEqual(expect.arrayContaining(['--denom', '--decimals', '--precision', '--round']));
  });

  it('slippage requires --expected + --actual', () => {
    const c = amountCommand.commands.find((cmd) => cmd.name() === 'slippage')!;
    const required = (c.options as any[]).filter((o) => o.required).map((o) => o.long);
    expect(required).toEqual(expect.arrayContaining(['--expected', '--actual']));
  });

  it('min-amount requires --expected and offers --slippage-bps + --slippage-pct', () => {
    const c = amountCommand.commands.find((cmd) => cmd.name() === 'min-amount')!;
    const required = (c.options as any[]).filter((o) => o.required).map((o) => o.long);
    const longs = (c.options as any[]).map((o) => o.long);
    expect(required).toContain('--expected');
    expect(longs).toEqual(expect.arrayContaining(['--slippage-bps', '--slippage-pct']));
  });

  it('max-wrappable / wrap-preview / unwrap-preview take <collection-id>', () => {
    for (const verb of ['max-wrappable', 'wrap-preview', 'unwrap-preview']) {
      const c = amountCommand.commands.find((cmd) => cmd.name() === verb)!;
      expect((c as any)._args.map((a: any) => a.name())).toEqual(['collection-id']);
    }
  });

  it('max-wrappable requires --address', () => {
    const c = amountCommand.commands.find((cmd) => cmd.name() === 'max-wrappable')!;
    const required = (c.options as any[]).filter((o) => o.required).map((o) => o.long);
    expect(required).toContain('--address');
  });

  it('wrap-preview requires --coin-amount, unwrap-preview requires --token-amount', () => {
    const wrap = amountCommand.commands.find((cmd) => cmd.name() === 'wrap-preview')!;
    expect((wrap.options as any[]).filter((o) => o.required).map((o) => o.long)).toContain('--coin-amount');
    const unwrap = amountCommand.commands.find((cmd) => cmd.name() === 'unwrap-preview')!;
    expect((unwrap.options as any[]).filter((o) => o.required).map((o) => o.long)).toContain('--token-amount');
  });
});
