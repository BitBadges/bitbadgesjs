/**
 * Registry image URL hygiene.
 *
 * Smoke testing found both USDC registry entries shipping a dead
 * `github.com/...blob...?raw=true` image URL (the file moved in
 * chain-registry and the blob redirect 404s). Consumers that fall back to
 * the SDK image — e.g. the indexer's swap asset list for denoms Skip
 * doesn't serve — rendered a broken icon.
 *
 * Unit tests can't HEAD-request URLs, so pin the *format* instead: the
 * `blob/...?raw=true` redirect style is the rot-prone one (it depends on a
 * UI route AND a redirect); registry images must use direct
 * raw.githubusercontent.com URLs (or non-GitHub hosts). The specific USDC
 * URL is pinned because it was verified 200 when introduced.
 */
import {
  MAINNET_COINS_REGISTRY,
  TESTNET_COINS_REGISTRY,
  USDC_DENOM,
  USDC_NOBLE_DENOM
} from './constants.js';
import { MAINNET_COINS_REGISTRY as BUILDER_COINS_REGISTRY } from '../builder/sdk/coinRegistry.js';

const VERIFIED_USDC_IMAGE = 'https://raw.githubusercontent.com/cosmos/chain-registry/master/_non-cosmos/ethereum/images/usdc.png';

// Matches the rot-prone GitHub UI-route style: github.com/<...>/blob/<...>
// (with or without ?raw=true) instead of a direct raw content URL.
const BLOB_STYLE = /github\.com\/.*\/blob\//;

describe('registry image URLs', () => {
  const registries: Array<[string, Record<string, { image?: string }>]> = [
    ['common MAINNET_COINS_REGISTRY', MAINNET_COINS_REGISTRY],
    ['common TESTNET_COINS_REGISTRY', TESTNET_COINS_REGISTRY],
    ['builder MAINNET_COINS_REGISTRY', BUILDER_COINS_REGISTRY]
  ];

  it.each(registries)('%s uses no github.com/.../blob/... image URLs', (_name, registry) => {
    const offenders = Object.entries(registry)
      .filter(([, d]) => d.image && BLOB_STYLE.test(d.image))
      .map(([denom, d]) => `${denom}: ${d.image}`);
    expect(offenders).toEqual([]);
  });

  it('both USDC entries carry the verified-200 raw URL in both registries', () => {
    for (const registry of [MAINNET_COINS_REGISTRY, BUILDER_COINS_REGISTRY]) {
      expect(registry[USDC_DENOM].image).toBe(VERIFIED_USDC_IMAGE);
      expect(registry[USDC_NOBLE_DENOM].image).toBe(VERIFIED_USDC_IMAGE);
    }
  });
});
