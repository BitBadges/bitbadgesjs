/**
 * Command-tree shape tests for price.ts. The action handler hits the
 * indexer's /assetPairs endpoints — real-network smoke lives in the
 * integration suite. This spec locks the public CLI surface (args +
 * options + descriptions) so we notice regressions without spinning
 * up the subprocess.
 *
 * Source-of-truth invariant: prices come from the BitBadges indexer,
 * NOT CoinGecko. Description must reference the indexer + the chain.
 */

import { priceCommand } from './price.js';

describe('priceCommand shape', () => {
  it('takes a variadic <denoms-or-symbols...> argument', () => {
    const args = (priceCommand as any)._args;
    expect(args.length).toBe(1);
    expect(args[0].name()).toBe('denoms-or-symbols');
    expect(args[0].variadic).toBe(true);
    expect(args[0].required).toBe(true);
  });

  it('exposes network + output flags', () => {
    const longFlags = (priceCommand.options as any[]).map((o) => o.long);
    expect(longFlags).toEqual(
      expect.arrayContaining(['--testnet', '--local', '--url', '--api-key', '--output-file', '--condensed'])
    );
  });

  it('boolean network flags default to false', () => {
    for (const long of ['--testnet', '--local']) {
      const opt = (priceCommand.options as any[]).find((o) => o.long === long);
      expect(opt.defaultValue).toBe(false);
    }
  });

  it('description references indexer + chain — not external price oracles', () => {
    const desc = priceCommand.description();
    expect(desc).toMatch(/indexer/i);
    expect(desc).not.toMatch(/coingecko/i);
  });

  it('points cross-chain callers to bb swap (Skip:Go) in description', () => {
    expect(priceCommand.description()).toMatch(/swap/i);
  });
});
