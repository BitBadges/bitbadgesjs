/**
 * Shape tests for the top-level `bb pools` command, promoted in CLI v2
 * (#0399) from the v1 `bb swap pools` subcommand. The action handlers
 * are thin HTTP wrappers — this spec only locks the subcommand surface
 * and verifies it stays in lock-step with the deprecated alias on swap.
 */

import { poolsCommand } from './pools.js';
import { swapCommand } from './swap.js';

describe('poolsCommand shape', () => {
  it('exposes the documented subcommands', () => {
    const names = poolsCommand.commands.map((c) => c.name()).sort();
    expect(names).toEqual(['batch', 'by-assets', 'by-denom', 'list', 'show']);
  });

  it('list takes pagination + sort options', () => {
    const list = poolsCommand.commands.find((c) => c.name() === 'list')!;
    const longs = (list.options as any[]).map((o) => o.long);
    expect(longs).toEqual(expect.arrayContaining(['--bookmark', '--sort-by', '--sort-order']));
  });

  it('show takes <pool-id>', () => {
    const show = poolsCommand.commands.find((c) => c.name() === 'show')!;
    expect((show as any)._args.map((a: any) => a.name())).toEqual(['pool-id']);
  });

  it('mirrors `swap pools` subcommand list (deprecated alias stays in lock-step)', () => {
    const top = poolsCommand.commands.map((c) => c.name()).sort();
    const swapPools = swapCommand.commands.find((c) => c.name() === 'pools')!;
    const alias = swapPools.commands.map((c) => c.name()).sort();
    expect(top).toEqual(alias);
  });
});
