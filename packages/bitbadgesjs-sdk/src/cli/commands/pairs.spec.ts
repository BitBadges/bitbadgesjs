/**
 * Shape tests for the top-level `bb pairs` command, promoted in CLI v2
 * (#0399) from the v1 `bb swap asset-pairs` subcommand. The action
 * handlers are thin HTTP wrappers — this spec only locks the
 * subcommand surface and verifies it stays in lock-step with the
 * deprecated alias on swap.
 */

import { pairsCommand } from './pairs.js';
import { swapCommand } from './swap.js';

describe('pairsCommand shape', () => {
  it('exposes the documented analytics + listing subcommands', () => {
    const names = pairsCommand.commands.map((c) => c.name()).sort();
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
    const c = pairsCommand.commands.find((c) => c.name() === 'search')!;
    expect((c as any)._args.map((a: any) => a.name())).toEqual(['query']);
  });

  it('mirrors `swap asset-pairs` subcommand list (deprecated alias stays in lock-step)', () => {
    const top = pairsCommand.commands.map((c) => c.name()).sort();
    const swapPairs = swapCommand.commands.find((c) => c.name() === 'asset-pairs')!;
    const alias = swapPairs.commands.map((c) => c.name()).sort();
    expect(top).toEqual(alias);
  });
});
