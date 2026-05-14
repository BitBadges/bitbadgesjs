import { describe, expect, it } from 'bun:test';
import { Command } from 'commander';
import { addUnifiedNetworkOptions } from './network-options.js';
import { addIndexerNetworkOptions } from './indexer-options.js';
import { addNetworkOptions } from './io.js';

function flagNames(cmd: Command): string[] {
  return cmd.options.map((o) => o.long ?? o.short ?? '');
}

describe('addUnifiedNetworkOptions', () => {
  it('exposes the full union surface by default', () => {
    const cmd = new Command();
    addUnifiedNetworkOptions(cmd);
    const flags = flagNames(cmd);
    expect(flags).toContain('--network');
    expect(flags).toContain('--mainnet');
    expect(flags).toContain('--testnet');
    expect(flags).toContain('--local');
    expect(flags).toContain('--url');
    expect(flags).toContain('--api-key');
  });

  it('omits --api-key when includeApiKey: false', () => {
    const cmd = new Command();
    addUnifiedNetworkOptions(cmd, { includeApiKey: false });
    const flags = flagNames(cmd);
    expect(flags).toContain('--testnet');
    expect(flags).not.toContain('--api-key');
  });

  it('omits --network long form when includeNetworkFlag: false', () => {
    const cmd = new Command();
    addUnifiedNetworkOptions(cmd, { includeNetworkFlag: false });
    const flags = flagNames(cmd);
    expect(flags).toContain('--testnet');
    expect(flags).not.toContain('--network');
  });

  it('returns the same Command for chaining', () => {
    const cmd = new Command();
    const ret = addUnifiedNetworkOptions(cmd);
    expect(ret).toBe(cmd);
  });
});

describe('legacy aliases delegate to unified helper', () => {
  it('addIndexerNetworkOptions exposes the full surface', () => {
    const cmd = new Command();
    addIndexerNetworkOptions(cmd);
    const flags = flagNames(cmd);
    // Old surface (still there)
    expect(flags).toContain('--testnet');
    expect(flags).toContain('--local');
    expect(flags).toContain('--url');
    expect(flags).toContain('--api-key');
    // New surface (now added by the alias)
    expect(flags).toContain('--network');
    expect(flags).toContain('--mainnet');
  });

  it('addNetworkOptions (io.ts) now exposes --api-key too', () => {
    const cmd = new Command();
    addNetworkOptions(cmd);
    const flags = flagNames(cmd);
    // Old surface (still there)
    expect(flags).toContain('--network');
    expect(flags).toContain('--mainnet');
    expect(flags).toContain('--testnet');
    expect(flags).toContain('--local');
    expect(flags).toContain('--url');
    // New surface (now added by the alias)
    expect(flags).toContain('--api-key');
  });
});
