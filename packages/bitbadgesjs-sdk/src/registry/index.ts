/**
 * BitBadges asset / chain registry — canonical metadata for the assets
 * the BitBadges chain knows about. Sourced from a Cosmos chain-registry-style
 * JSON document at `assets.json`; exported as typed helpers so both the
 * CLI and the frontend can query the same data without re-implementing
 * the lookup.
 *
 * NOTE: this used to live at `bitbadges-frontend/src/registry/`. The
 * frontend now re-exports from `bitbadges` so there's a single source
 * of truth.
 */

import { ASSET_REGISTRY } from './assets.js';
import type { AssetRegistry, EnhancedAsset } from './types.js';

const assetsJson: AssetRegistry = ASSET_REGISTRY;

// Selective re-exports — avoid collisions with `Chain` (in transactions/)
// and `DenomUnit` (in core/) which already exist in the SDK at different
// shapes. Consumers needing the chain/IBC registry types can `import
// type { Chain, DenomUnit } from 'bitbadges/registry/types'`.
export type {
  Asset,
  EnhancedAsset,
  AssetRegistry,
  IBCChainConfig,
  RegistryUtils
} from './types.js';

/**
 * Get the canonical asset registry (parsed `assets.json`).
 *
 * Each entry includes `denom`, `symbol`, `name`, `decimals`, `chain_id`,
 * `logo_URIs`, `coingecko_id`, `description`, `is_native`, `ibc_chains[]`.
 */
export function loadAssetRegistry(): AssetRegistry {
  return assetsJson as unknown as AssetRegistry;
}

/**
 * Get every asset record as a flat array.
 */
export function getAllAssets(): EnhancedAsset[] {
  return (assetsJson as unknown as AssetRegistry).assets as EnhancedAsset[];
}

/**
 * Find an asset by symbol (case-insensitive) or by denom (exact match).
 *
 * Returns `undefined` if no asset matches.
 *
 * @example
 *   findAsset('ATOM')       // → { symbol: 'ATOM', denom: 'uatom', ... }
 *   findAsset('uatom')      // → same record
 *   findAsset('cosmos')     // → also resolves the CoinGecko ID
 */
export function findAsset(symbolOrDenomOrCoingeckoId: string): EnhancedAsset | undefined {
  const q = symbolOrDenomOrCoingeckoId.trim();
  if (!q) return undefined;
  const lower = q.toLowerCase();
  const upper = q.toUpperCase();

  for (const asset of getAllAssets()) {
    if (asset.denom === q) return asset;
    if (asset.symbol.toUpperCase() === upper) return asset;
    if (asset.coingecko_id && asset.coingecko_id.toLowerCase() === lower) return asset;
  }
  return undefined;
}

/**
 * Resolve a symbol/denom/CoinGecko-ID input to a CoinGecko ID. Returns
 * `undefined` if there's no matching asset or no `coingecko_id` field.
 *
 * @example
 *   resolveCoinGeckoId('ATOM')   // → 'cosmos'
 *   resolveCoinGeckoId('uatom')  // → 'cosmos'
 *   resolveCoinGeckoId('cosmos') // → 'cosmos' (passthrough match)
 */
export function resolveCoinGeckoId(symbolOrDenomOrCoingeckoId: string): string | undefined {
  const asset = findAsset(symbolOrDenomOrCoingeckoId);
  return asset?.coingecko_id || undefined;
}

/**
 * Map an iterable of symbols/denoms/CoinGecko-IDs to their CoinGecko IDs.
 * Inputs that don't resolve are dropped. Order preserved, deduped.
 */
export function resolveCoinGeckoIds(inputs: string[]): { id: string; input: string }[] {
  const seen = new Set<string>();
  const out: { id: string; input: string }[] = [];
  for (const input of inputs) {
    const id = resolveCoinGeckoId(input);
    if (id && !seen.has(id)) {
      seen.add(id);
      out.push({ id, input });
    }
  }
  return out;
}
