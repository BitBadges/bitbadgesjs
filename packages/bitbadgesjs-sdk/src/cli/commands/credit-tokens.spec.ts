/**
 * Command-tree shape tests for credit-tokens.ts. Action handlers are
 * integration-heavy — see `core/credit-tokens.spec.ts` for the underlying
 * helper coverage and `cli/integration/credit-tokens.spec.ts` for live-chain
 * flows. This spec guards the CLI's documented surface against silent drift.
 */

import { creditTokensCommand } from './credit-tokens.js';

describe('creditTokensCommand shape', () => {
  it('exposes the documented subcommand verbs', () => {
    const names = creditTokensCommand.commands.map((c) => c.name()).sort();
    // Per-standard `build` removed in CLI v2 (#0399); use `bb build credit-token`.
    expect(names).toEqual(['list', 'purchase', 'show']);
  });

  it('purchase requires --creator and --units', () => {
    const purchase = creditTokensCommand.commands.find((c) => c.name() === 'purchase');
    expect(purchase).toBeDefined();
    const required = (purchase! as any).options.filter((o: any) => o.required).map((o: any) => o.long);
    expect(required).toContain('--creator');
    expect(required).toContain('--units');
  });

  it('purchase exposes an optional --tier flag', () => {
    const purchase = creditTokensCommand.commands.find((c) => c.name() === 'purchase');
    const flagNames = (purchase! as any).options.map((o: any) => o.long);
    expect(flagNames).toContain('--tier');
  });

  it('list / show / purchase take a collection-id argument', () => {
    for (const verb of ['list', 'show', 'purchase']) {
      const c = creditTokensCommand.commands.find((cmd) => cmd.name() === verb);
      expect((c! as any)._args.map((a: any) => a.name())).toEqual(['collection-id']);
    }
  });

  it('no longer registers a `build` subcommand — use `bb build credit-token` instead', () => {
    const build = creditTokensCommand.commands.find((c) => c.name() === 'build');
    expect(build).toBeUndefined();
  });

  it('every verb supports the network + output flags', () => {
    for (const verb of ['list', 'show', 'purchase']) {
      const c = creditTokensCommand.commands.find((cmd) => cmd.name() === verb);
      const flagNames = (c! as any).options.map((o: any) => o.long);
      expect(flagNames).toEqual(expect.arrayContaining(['--testnet', '--local', '--url', '--api-key', '--output-file', '--condensed']));
    }
  });
});
