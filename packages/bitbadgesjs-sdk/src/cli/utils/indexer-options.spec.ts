/**
 * Unit tests for the shared indexer-flag helpers.
 *
 * These guarantee every drifted command that migrates onto the helpers
 * keeps the same flag surface. The flag *names* and *types* (boolean vs
 * value) are the contract — descriptions and default values may vary
 * across commands without breaking scripts.
 */
import { Command } from 'commander';
import {
  addIndexerOptions,
  addIndexerNetworkOptions,
  addIndexerOutputOptions,
  resolveIndexerNetwork,
} from './indexer-options.js';

function flagSet(cmd: Command): Set<string> {
  return new Set(cmd.options.map((o) => o.long).filter((s): s is string => Boolean(s)));
}

describe('addIndexerNetworkOptions', () => {
  it('adds --testnet, --local, --url, --api-key', () => {
    const cmd = addIndexerNetworkOptions(new Command('x'));
    const flags = flagSet(cmd);
    expect(flags).toContain('--testnet');
    expect(flags).toContain('--local');
    expect(flags).toContain('--url');
    expect(flags).toContain('--api-key');
  });

  it('--testnet and --local are booleans (no value placeholder)', () => {
    const cmd = addIndexerNetworkOptions(new Command('x'));
    const testnet = cmd.options.find((o) => o.long === '--testnet');
    const local = cmd.options.find((o) => o.long === '--local');
    expect(testnet?.required).toBeFalsy();
    expect(testnet?.optional).toBeFalsy();
    expect(local?.required).toBeFalsy();
    expect(local?.optional).toBeFalsy();
  });

  it('--url and --api-key take a value', () => {
    const cmd = addIndexerNetworkOptions(new Command('x'));
    const url = cmd.options.find((o) => o.long === '--url');
    const apiKey = cmd.options.find((o) => o.long === '--api-key');
    expect(url?.required || url?.optional).toBeTruthy();
    expect(apiKey?.required || apiKey?.optional).toBeTruthy();
  });
});

describe('addIndexerOutputOptions', () => {
  it('adds --output-file and --condensed', () => {
    const cmd = addIndexerOutputOptions(new Command('x'));
    const flags = flagSet(cmd);
    expect(flags).toContain('--output-file');
    expect(flags).toContain('--condensed');
  });
});

describe('addIndexerOptions', () => {
  it('bundles network + output (six flags)', () => {
    const cmd = addIndexerOptions(new Command('x'));
    const flags = flagSet(cmd);
    expect(flags).toContain('--testnet');
    expect(flags).toContain('--local');
    expect(flags).toContain('--url');
    expect(flags).toContain('--api-key');
    expect(flags).toContain('--output-file');
    expect(flags).toContain('--condensed');
  });
});

describe('resolveIndexerNetwork', () => {
  it('maps --testnet to testnet', () => {
    expect(resolveIndexerNetwork({ testnet: true })).toBe('testnet');
  });
  it('maps --local to local', () => {
    expect(resolveIndexerNetwork({ local: true })).toBe('local');
  });
  it('defaults to mainnet', () => {
    expect(resolveIndexerNetwork({})).toBe('mainnet');
  });
  it('--testnet wins over --local when both set (legacy precedence)', () => {
    expect(resolveIndexerNetwork({ testnet: true, local: true })).toBe('testnet');
  });
});
