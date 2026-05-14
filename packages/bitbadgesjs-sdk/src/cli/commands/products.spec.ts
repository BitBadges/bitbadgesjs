/**
 * Command-tree shape tests for products.ts. Action handlers are
 * integration-heavy — see `cli/integration/products.spec.ts` for the
 * live-chain build → list → purchase loop and `core/products.spec.ts` for
 * helper coverage. This spec guards the CLI's documented surface against
 * silent drift.
 */

import { productsCommand } from './products.js';

describe('productsCommand shape', () => {
  it('exposes the documented subcommand verbs', () => {
    const names = productsCommand.commands.map((c) => c.name()).sort();
    // Per-standard `build` removed in CLI v2 (#0399); use `bb build product-catalog`.
    expect(names).toEqual(['list', 'purchase', 'show']);
  });

  it('purchase requires --creator and --token-id', () => {
    const purchase = productsCommand.commands.find((c) => c.name() === 'purchase');
    expect(purchase).toBeDefined();
    const required = (purchase! as any).options.filter((o: any) => o.required).map((o: any) => o.long);
    expect(required).toContain('--creator');
    expect(required).toContain('--token-id');
  });

  it('list / show / purchase take a collection-id argument', () => {
    for (const verb of ['list', 'show', 'purchase']) {
      const c = productsCommand.commands.find((cmd) => cmd.name() === verb);
      expect((c! as any)._args.map((a: any) => a.name())).toEqual(['collection-id']);
    }
  });

  it('no longer registers a `build` subcommand — use `bb build product-catalog` instead', () => {
    const build = productsCommand.commands.find((c) => c.name() === 'build');
    expect(build).toBeUndefined();
  });

  it('every verb supports the network + output flags', () => {
    for (const verb of ['list', 'show', 'purchase']) {
      const c = productsCommand.commands.find((cmd) => cmd.name() === verb);
      const flagNames = (c! as any).options.map((o: any) => o.long);
      expect(flagNames).toEqual(expect.arrayContaining(['--testnet', '--local', '--url', '--api-key', '--output-file', '--condensed']));
    }
  });
});
