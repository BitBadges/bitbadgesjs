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
      const symbolsJoined = symbols.join('", "');
      out.push({
        code: 'review.ux.alias_symbol_reserved_collision',
        severity: 'warning',
        source: 'ux',
        category: 'registries',
        title: {
          en: 'Alias symbol conflicts with an existing coin'
        },
        detail: {
          en: `The symbols "${symbolsJoined}" match existing registered coins on the network. This can cause confusion. Use unique symbols with a "w" prefix instead.`
        },
        recommendation: {
          en: 'Rename the conflicting alias symbols to avoid confusion with existing coins (e.g., prefix with "w")'
        }
      });
    }
    return out;
  }
];
