/**
 * Registry/reserved collision checks.
 *
 * Uses SDK's MAINNET_COINS_REGISTRY + TESTNET_COINS_REGISTRY (which is the same
 * underlying data the frontend's `CoinsRegistry` proxies over).
 */

import type { Finding } from '../review-types.js';
import type { UxCheck } from './shared.js';
import { MAINNET_COINS_REGISTRY, TESTNET_COINS_REGISTRY } from '../../common/constants.js';

const RESERVED_COIN_SYMBOLS: Set<string> = new Set(
  [...Object.values(MAINNET_COINS_REGISTRY), ...Object.values(TESTNET_COINS_REGISTRY)]
    .map((c: any) => (c.symbol || '').toUpperCase())
    .filter((s: string) => s.length > 0)
);

export const registriesChecks: UxCheck[] = [
  // Alias path symbols collide with reserved/registered coin symbols
  (value) => {
    const out: Finding[] = [];
    const aliasPaths: any[] = value?.aliasPaths || value?.aliasPathsToAdd || [];
    const conflicting = aliasPaths.filter((path: any) => {
      const denomUnits: any[] = path.denomUnits || [];
      return denomUnits.some(
        (u: any) => u.symbol && RESERVED_COIN_SYMBOLS.has(u.symbol.toUpperCase())
      );
    });
    if (conflicting.length > 0) {
      const symbols = conflicting
        .flatMap((p: any) =>
          (p.denomUnits || [])
            .filter((u: any) => u.symbol && RESERVED_COIN_SYMBOLS.has(u.symbol.toUpperCase()))
            .map((u: any) => u.symbol)
        )
        .slice(0, 3);
      out.push({
        code: 'review.ux.alias_symbol_reserved_collision',
        severity: 'warning',
        source: 'ux',
        category: 'registries',
        params: { symbols: symbols.join(', ') },
        messageEn: `Alias path symbol(s) "${symbols.join(', ')}" collide with registered coin symbols.`,
        recommendationEn: 'Rename the alias path symbol(s) to avoid confusion with existing tokens.'
      });
    }
    return out;
  }
];
