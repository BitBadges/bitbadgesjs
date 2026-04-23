/**
 * Asset-backing decisions.
 *
 * Cross-field read of whether the collection has an IBC-wrapped coin
 * backing path. When present, each token is 1:1 backed by the wrapped
 * coin via the mint escrow — a materially different asset model than
 * an unbacked badge collection.
 *
 * If no wrapper path is configured, this check is `n/a` rather than
 * `fail` — "no backing" is the default for most collection types and
 * not a negative outcome.
 */

import type { DesignDecision } from '../review-types.js';

export function backingDecisions(collection: any): DesignDecision[] {
  if (!collection || typeof collection !== 'object') return [];
  const paths: any[] = Array.isArray(collection.cosmosCoinWrapperPaths)
    ? collection.cosmosCoinWrapperPaths
    : Array.isArray(collection.cosmosCoinWrapperPathsToAdd)
      ? collection.cosmosCoinWrapperPathsToAdd
      : [];

  const out: DesignDecision[] = [];
  if (paths.length === 0) {
    out.push({
      code: 'design.backing.cosmos_coin_wrapper',
      category: 'backing',
      title: { en: '1:1 coin-backed (IBC wrapper)' },
      detail: { en: 'Collection is not configured with an IBC coin wrapper path — tokens are not backed by an external coin.' },
      status: 'n/a'
    });
    return out;
  }

  // Backed — one or more wrapper paths configured. Each path declares
  // its denom + conversion ratio.
  const denoms = paths
    .map((p) => p?.denom)
    .filter((d) => typeof d === 'string' && d.length > 0);

  out.push({
    code: 'design.backing.cosmos_coin_wrapper',
    category: 'backing',
    title: { en: '1:1 coin-backed (IBC wrapper)' },
    detail: { en: 'Each token is backed by an IBC-wrapped coin via the mint escrow. Redemptions unwrap back to the underlying coin at the declared conversion ratio.' },
    status: 'pass',
    evidence: denoms.length > 0
      ? `${paths.length} wrapper path(s); denom(s): ${denoms.join(', ')}`
      : `${paths.length} wrapper path(s) configured`
  });

  return out;
}
