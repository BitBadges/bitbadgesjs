/**
 * Supply-shape decisions.
 *
 * Answers "is the supply capped?" using `invariants.maxSupplyPerId` —
 * a genesis-frozen field, so "pass" here is a permanent guarantee, not
 * a mutable state the manager can change later.
 */

import type { DesignDecision } from '../review-types.js';

function toBigIntOrNull(v: unknown): bigint | null {
  if (v === null || v === undefined || v === '') return null;
  try {
    return typeof v === 'bigint' ? v : BigInt(v as any);
  } catch {
    return null;
  }
}

export function supplyDecisions(collection: any): DesignDecision[] {
  if (!collection || typeof collection !== 'object') return [];
  const out: DesignDecision[] = [];

  const raw = collection.invariants?.maxSupplyPerId;
  const capped = toBigIntOrNull(raw);
  const hasCap = capped !== null && capped > 0n;

  out.push({
    code: 'design.supply.has_cap',
    category: 'supply',
    title: { en: 'Supply is capped per token ID' },
    detail: hasCap
      ? { en: 'A permanent per-token-ID supply cap is set at genesis — no balance for any token ID can exceed this value.' }
      : { en: 'No per-token-ID supply cap. Mint volume is bounded only by mint approvals, not by a hard invariant.' },
    status: hasCap ? 'pass' : 'fail',
    evidence: hasCap ? `maxSupplyPerId = ${capped}` : 'invariants.maxSupplyPerId unset or zero'
  });

  return out;
}
