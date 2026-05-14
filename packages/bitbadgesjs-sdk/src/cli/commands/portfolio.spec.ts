/**
 * Shape tests for `bb portfolio`. The command is a single verb (no
 * subcommands) — the contract is the flag surface + the section list it
 * documents. Accidental flag drift here would silently break agent
 * snapshots, so we lock it in.
 */

import { portfolioCommand } from './portfolio.js';

describe('portfolioCommand shape', () => {
  it('has no subcommands — it is a single aggregator verb', () => {
    expect(portfolioCommand.commands.length).toBe(0);
  });

  it('declares --address as the only mandatory option', () => {
    const mandatory = (portfolioCommand as any).options
      .filter((o: any) => o.mandatory)
      .map((o: any) => o.long);
    expect(mandatory).toEqual(['--address']);
  });

  it('exposes --include / --exclude / --chain / --all-chains for scoping', () => {
    const flagNames = (portfolioCommand as any).options.map((o: any) => o.long);
    for (const f of ['--include', '--exclude', '--chain', '--all-chains']) {
      expect(flagNames).toContain(f);
    }
  });

  it('inherits the standard indexer network + output flags', () => {
    const flagNames = (portfolioCommand as any).options.map((o: any) => o.long);
    for (const f of ['--testnet', '--local', '--url', '--api-key', '--output-file', '--condensed']) {
      expect(flagNames).toContain(f);
    }
  });

  it('description names every section it returns so agents can predict the payload', () => {
    const desc = portfolioCommand.description();
    for (const section of ['account', 'tokens', 'balance', 'assets', 'activity']) {
      expect(desc.toLowerCase()).toContain(section);
    }
  });

  it('--include / --exclude carry a value placeholder so commander treats them as string options', () => {
    const include = (portfolioCommand as any).options.find((o: any) => o.long === '--include');
    const exclude = (portfolioCommand as any).options.find((o: any) => o.long === '--exclude');
    expect(include?.required || include?.optional).toBeTruthy();
    expect(exclude?.required || exclude?.optional).toBeTruthy();
  });
});
