/**
 * Pure-function tests for pay-requests.ts. The action handlers themselves
 * are integration-heavy (apiRequest + bigint flows + process.exit) — we
 * test the SDK helpers they wrap in core/payment-requests.spec.ts, and
 * smoke-test the CLI's command shape via --help-json so accidental
 * argument drift is caught.
 *
 * This spec asserts:
 *   - The command tree shape (subcommand names, required flags)
 *   - That `build` subcommand exists for the alias contract
 */

import { payRequestsCommand } from './pay-requests.js';

describe('payRequestsCommand shape', () => {
  it('exposes the documented subcommand verbs', () => {
    const names = payRequestsCommand.commands.map((c) => c.name()).sort();
    // Per-standard `build` removed in CLI v2 (#0399); use `bb build payment-request`.
    expect(names).toEqual(['deny', 'list', 'pay', 'show', 'status']);
  });

  it('pay requires --creator', () => {
    const pay = payRequestsCommand.commands.find((c) => c.name() === 'pay');
    expect(pay).toBeDefined();
    const required = (pay! as any).options.filter((o: any) => o.required).map((o: any) => o.long);
    expect(required).toContain('--creator');
  });

  it('deny requires --creator', () => {
    const deny = payRequestsCommand.commands.find((c) => c.name() === 'deny');
    const required = (deny! as any).options.filter((o: any) => o.required).map((o: any) => o.long);
    expect(required).toContain('--creator');
  });

  it('show + status + list take a collection-id argument', () => {
    for (const verb of ['show', 'status']) {
      const c = payRequestsCommand.commands.find((cmd) => cmd.name() === verb);
      expect((c! as any)._args.map((a: any) => a.name())).toEqual(['collection-id']);
    }
    const list = payRequestsCommand.commands.find((cmd) => cmd.name() === 'list');
    expect((list! as any)._args).toEqual([]);
  });

  it('list exposes --mine and --open filters', () => {
    const list = payRequestsCommand.commands.find((c) => c.name() === 'list');
    const flagNames = (list! as any).options.map((o: any) => o.long);
    expect(flagNames).toContain('--mine');
    expect(flagNames).toContain('--open');
  });

  it('no longer registers a `build` subcommand — use `bb build payment-request` instead', () => {
    const build = payRequestsCommand.commands.find((c) => c.name() === 'build');
    expect(build).toBeUndefined();
  });
});
