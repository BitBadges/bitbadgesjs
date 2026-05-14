/**
 * Shape tests for `bb portfolio` — the contract is the verb tree
 * (subcommands present, mandatory flags per subcommand). Accidental flag
 * drift here would silently break agent snapshots, so we lock the
 * surface in.
 */

import { portfolioCommand } from './portfolio.js';

function getSub(name: string) {
  const sub = portfolioCommand.commands.find((c) => c.name() === name);
  if (!sub) throw new Error(`portfolio subcommand "${name}" not found`);
  return sub;
}

function mandatoryFlags(sub: ReturnType<typeof getSub>): string[] {
  return (sub as any).options.filter((o: any) => o.mandatory).map((o: any) => o.long);
}

function allFlags(sub: ReturnType<typeof getSub>): string[] {
  return (sub as any).options.map((o: any) => o.long);
}

describe('portfolioCommand shape', () => {
  it('exposes all seven subcommands', () => {
    const names = portfolioCommand.commands.map((c) => c.name()).sort();
    expect(names).toEqual(['account', 'activity', 'all', 'approvals', 'assets', 'balances', 'tokens']);
  });

  it.each(['account', 'tokens', 'balances', 'assets', 'activity', 'approvals', 'all'])(
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

  it('all-description names every section so agents can predict the payload', () => {
    const desc = getSub('all').description();
    for (const section of ['account', 'tokens', 'balance', 'assets', 'activity', 'approvals']) {
      expect(desc.toLowerCase()).toContain(section);
    }
  });

  it('every subcommand inherits the standard indexer network + output flags', () => {
    for (const name of ['account', 'tokens', 'balances', 'assets', 'activity', 'approvals', 'all']) {
      const flags = allFlags(getSub(name));
      for (const f of ['--testnet', '--local', '--url', '--api-key', '--output-file', '--condensed']) {
        expect(flags).toContain(f);
      }
    }
  });
});
