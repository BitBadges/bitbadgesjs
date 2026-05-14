/**
 * Shape tests for `bb account` — the contract is the verb tree
 * (subcommands present, mandatory flags per subcommand). Accidental flag
 * drift here would silently break agent snapshots, so we lock the
 * surface in.
 *
 * Renamed from `portfolio` for CLI v2 (#0399). The old top-level
 * `bb portfolio ...` form is registered as a deprecated alias in
 * `cli/index.ts` and verified in cli-core / cli-discovery specs.
 */

import { accountCommand } from './account.js';

function getSub(name: string) {
  const sub = accountCommand.commands.find((c) => c.name() === name);
  if (!sub) throw new Error(`account subcommand "${name}" not found`);
  return sub;
}

function mandatoryFlags(sub: ReturnType<typeof getSub>): string[] {
  return (sub as any).options.filter((o: any) => o.mandatory).map((o: any) => o.long);
}

function allFlags(sub: ReturnType<typeof getSub>): string[] {
  return (sub as any).options.map((o: any) => o.long);
}

describe('accountCommand shape', () => {
  it('exposes every documented subcommand (read views + absorbed utilities)', () => {
    const names = accountCommand.commands.map((c) => c.name()).sort();
    // Read-only views: profile (was account) / tokens / balances / assets /
    //   activity / approvals / all / me
    // Absorbed utilities: convert / validate / lookup / alias / gen-list-id
    expect(names).toEqual([
      'activity',
      'alias',
      'all',
      'approvals',
      'assets',
      'balances',
      'convert',
      'gen-list-id',
      'lookup',
      'me',
      'profile',
      'tokens',
      'validate'
    ]);
  });

  it.each(['profile', 'tokens', 'balances', 'assets', 'activity', 'approvals', 'all'])(
    '%s requires --address',
    (name) => {
      expect(mandatoryFlags(getSub(name))).toContain('--address');
    }
  );

  it('tokens exposes --view / --bookmark / --oldest-first', () => {
    const flags = allFlags(getSub('tokens'));
    for (const f of ['--view', '--bookmark', '--oldest-first']) expect(flags).toContain(f);
  });

  it('activity exposes --type / --bookmark / --oldest-first', () => {
    const flags = allFlags(getSub('activity'));
    for (const f of ['--type', '--bookmark', '--oldest-first']) expect(flags).toContain(f);
  });

  it('balances exposes --bookmark / --oldest-first', () => {
    const flags = allFlags(getSub('balances'));
    for (const f of ['--bookmark', '--oldest-first']) expect(flags).toContain(f);
  });

  it('assets exposes --chain / --all-chains', () => {
    const flags = allFlags(getSub('assets'));
    for (const f of ['--chain', '--all-chains']) expect(flags).toContain(f);
  });

  it('approvals exposes the documented filter surface', () => {
    const flags = allFlags(getSub('approvals'));
    for (const f of [
      '--collection',
      '--token-id',
      '--time',
      '--has-coin-transfers',
      '--price-min',
      '--price-max',
      '--denom',
      '--sort'
    ]) {
      expect(flags).toContain(f);
    }
  });

  it('all exposes --include / --exclude / --chain / --all-chains for scoping', () => {
    const flags = allFlags(getSub('all'));
    for (const f of ['--include', '--exclude', '--chain', '--all-chains']) {
      expect(flags).toContain(f);
    }
  });

  it('me mirrors all but does not require --address (auto-resolved from session)', () => {
    const me = getSub('me');
    expect(mandatoryFlags(me)).not.toContain('--address');
    // Same scoping knobs as `all` so users can downscope.
    const flags = allFlags(me);
    for (const f of ['--include', '--exclude', '--chain', '--all-chains']) {
      expect(flags).toContain(f);
    }
  });

  it('convert / validate / lookup / gen-list-id mirror the absorbed top-level surfaces', () => {
    const convert = getSub('convert');
    expect((convert as any)._args.map((a: any) => a.name())).toEqual(['address']);
    expect(allFlags(convert)).toContain('--to');

    const validate = getSub('validate');
    expect((validate as any)._args.map((a: any) => a.name())).toEqual(['address']);

    const lookup = getSub('lookup');
    expect((lookup as any)._args.map((a: any) => a.name())).toEqual(['symbol']);

    const genListId = getSub('gen-list-id');
    const args = (genListId as any)._args;
    expect(args.length).toBe(1);
    expect(args[0].variadic).toBe(true);
  });

  it('alias mirrors the protocol-derived address generator triad', () => {
    const alias = getSub('alias');
    const subNames = alias.commands.map((c: any) => c.name()).sort();
    expect(subNames).toEqual(['for-ibc-backing', 'for-mint-escrow', 'for-wrapper']);
  });

  it('every snapshot subcommand inherits the standard indexer network + output flags', () => {
    for (const name of ['profile', 'tokens', 'balances', 'assets', 'activity', 'approvals', 'all', 'me']) {
      const flags = allFlags(getSub(name));
      for (const f of ['--testnet', '--local', '--url', '--api-key', '--output-file', '--condensed']) {
        expect(flags).toContain(f);
      }
    }
  });
});
