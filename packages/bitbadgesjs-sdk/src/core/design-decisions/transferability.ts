/**
 * Transferability-shape decisions.
 *
 * Cross-field roll-ups of what the approval set implies about transfers:
 *
 *   - Non-transferable: no post-mint collection approval allows transfers
 *     between holders (any non-`Mint` fromListId approval that is not a
 *     burn-to-burn-address).
 *   - Forceful-transfers forbidden: `invariants.noForcefulPostMintTransfers`
 *     permanently disallows approvals that bypass user-level approvals.
 *     This is a genesis invariant, not a mutable permission.
 */

import type { DesignDecision } from '../review-types.js';

const BURN_ADDRESS = 'bb1qqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqs7gvmv';

function isBurnApproval(a: any): boolean {
  return a?.toListId === BURN_ADDRESS;
}

export function transferabilityDecisions(collection: any): DesignDecision[] {
  if (!collection || typeof collection !== 'object') return [];
  const approvals: any[] = Array.isArray(collection.collectionApprovals) ? collection.collectionApprovals : [];

  // Non-transferable: every approval either originates at Mint (mint
  // approvals don't count as "transfers" between holders) or sends to
  // the burn address.
  const postMintTransferApprovals = approvals.filter((a) => a?.fromListId !== 'Mint' && !isBurnApproval(a));
  const nonTransferable = postMintTransferApprovals.length === 0;

  const out: DesignDecision[] = [];
  out.push({
    code: 'design.transferability.non_transferable',
    category: 'transferability',
    title: { en: 'Non-transferable (soulbound)' },
    detail: nonTransferable
      ? { en: 'No collection approvals allow post-mint holder-to-holder transfers. Tokens cannot leave the wallet they were minted to (burns excepted).' }
      : { en: 'At least one collection approval allows post-mint transfers between holders.' },
    status: nonTransferable ? 'pass' : 'fail',
    evidence: nonTransferable
      ? `${approvals.length} approval(s) total, all mint-origin or burn`
      : `${postMintTransferApprovals.length} post-mint transfer approval(s)`
  });

  // Forceful-transfer invariant — genesis-locked if true.
  const forcefulForbidden = !!collection.invariants?.noForcefulPostMintTransfers;
  out.push({
    code: 'design.transferability.no_forceful_transfers',
    category: 'transferability',
    title: { en: 'No forceful post-mint transfers' },
    detail: forcefulForbidden
      ? { en: 'Collection invariant permanently forbids approvals that override user-level incoming/outgoing approvals. Holders cannot be forcibly transferred against.' }
      : { en: 'The forceful-transfer invariant is off. Approvals with overrides could be added that bypass user-level approvals.' },
    status: forcefulForbidden ? 'pass' : 'fail',
    evidence: `invariants.noForcefulPostMintTransfers = ${forcefulForbidden}`
  });

  return out;
}
