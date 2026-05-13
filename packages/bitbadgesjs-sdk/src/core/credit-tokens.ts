/**
 * Credit Token helpers — consumer-side extraction + purchase msg builder.
 *
 * A Credit Token collection has one (or more) "credit-*" mint approvals.
 * The modern shape (post-`builders/credit-token.ts`) emits a single
 * `credit-scaled` approval that scales balances by a buyer-supplied
 * multiplier — the buyer pays `1 unit × multiplier` of paymentDenom and
 * receives `tokensPerUnit × multiplier` credit tokens. Older shapes had
 * per-tier approvals (`credit-1`, `credit-10`, ...) — supported below
 * for read-side compatibility.
 *
 * Source of truth for the FE flow is `CreditTokenLayout.tsx`.
 */

import type { iCollectionApproval } from '@/interfaces/types/approvals.js';
import type { iCollectionDoc } from '@/api-indexer/docs-types/interfaces.js';

export interface CreditTokenTier {
  /** Approval id — `credit-scaled` or `credit-<N>`. */
  approvalId: string;
  /** Display-units-per-tier (1 for scaled, N for `credit-<N>`). */
  value: number;
  /** Payment denom (chain-side; ibc/... or ubadge). */
  paymentDenom: string;
  /** Amount of paymentDenom per `value` units, in base units. */
  paymentAmount: bigint;
  /** Amount of credit token minted per `value` units. */
  mintAmount: bigint;
  /** Address that receives the payment (the seller). */
  recipient: string;
  /** True for the scaled-balances variant (buyer picks multiplier). */
  isScaled: boolean;
  /** For scaled tier: max multiplier (chain-enforced upper bound). */
  maxMultiplier?: bigint;
}

/**
 * Return true if the collection has at least one `credit-*` mint approval —
 * cheap structural check used as the "is this a Credit Token?" gate. The
 * builder explicitly tags `standards: ['Credit Token']` so we prefer that
 * when present.
 */
export function doesCollectionFollowCreditTokenProtocol(collection: Readonly<iCollectionDoc<bigint>>): boolean {
  if (collection.standards?.includes('Credit Token')) return true;
  return (collection.collectionApprovals ?? []).some((a) => a.approvalId?.startsWith('credit-'));
}

/**
 * Extract every credit-* mint tier from a collection's approvals. Skips
 * non-credit approvals silently. Returns [] if none match. Mirrors the
 * FE `CreditTokenLayout` extraction (lines 70-95).
 */
export function extractCreditTokenTiers(
  approvals: ReadonlyArray<iCollectionApproval<bigint>>
): CreditTokenTier[] {
  const tiers: CreditTokenTier[] = [];

  for (const approval of approvals) {
    if (!approval.approvalId?.startsWith('credit-')) continue;

    const coinTransfer = approval.approvalCriteria?.coinTransfers?.[0];
    if (!coinTransfer) continue;
    const paymentDenom = coinTransfer.coins[0]?.denom ?? '';
    const paymentAmount = BigInt(coinTransfer.coins[0]?.amount ?? '0');
    const recipient = coinTransfer.to ?? '';

    const startBalance = approval.approvalCriteria?.predeterminedBalances?.incrementedBalances?.startBalances?.[0];
    const mintAmount = BigInt(startBalance?.amount ?? '0');

    const allowAmountScaling =
      approval.approvalCriteria?.predeterminedBalances?.incrementedBalances?.allowAmountScaling ?? false;

    if (allowAmountScaling) {
      const maxMultiplier = BigInt(
        approval.approvalCriteria?.predeterminedBalances?.incrementedBalances?.maxScalingMultiplier ?? '0'
      );
      tiers.push({
        approvalId: approval.approvalId,
        value: 1,
        paymentDenom,
        paymentAmount,
        mintAmount,
        recipient,
        isScaled: true,
        maxMultiplier
      });
      continue;
    }

    // Legacy tiered: `credit-1`, `credit-10`, etc.
    const numStr = approval.approvalId.replace('credit-', '');
    const value = Number(numStr);
    if (!Number.isFinite(value) || value <= 0) continue;
    tiers.push({
      approvalId: approval.approvalId,
      value,
      paymentDenom,
      paymentAmount,
      mintAmount,
      recipient,
      isScaled: false
    });
  }

  return tiers;
}

// ── Purchase msg builder ──────────────────────────────────────────────────

const MAX_UINT64 = '18446744073709551615';

export interface PurchaseCreditTokenMsg {
  typeUrl: '/tokenization.MsgTransferTokens';
  value: Record<string, unknown>;
}

/**
 * Build the MsgTransferTokens for purchasing N credit-token units from a
 * scaled tier. The chain handles the rate math via the approval's
 * `scalingBalances` — we just set the balances to
 * `mintAmount × multiplier` and prioritize the approval.
 *
 * For legacy (per-tier) approvals, pass `tier.isScaled === false` and we
 * fall back to the precalculate-from-approval flow (one tx per unit).
 * Caller can repeat the same msg N times for N units.
 */
export function buildPurchaseCreditTokenMsg(
  creator: string,
  collectionId: string,
  tier: CreditTokenTier,
  units: bigint
): PurchaseCreditTokenMsg {
  if (units <= 0n) {
    throw new Error('buildPurchaseCreditTokenMsg: --units must be > 0');
  }

  if (tier.isScaled) {
    const multiplier =
      tier.maxMultiplier !== undefined && tier.maxMultiplier > 0n && units > tier.maxMultiplier
        ? tier.maxMultiplier
        : units;
    const mintTotal = tier.mintAmount * multiplier;
    return {
      typeUrl: '/tokenization.MsgTransferTokens',
      value: {
        creator,
        collectionId: String(collectionId),
        transfers: [
          {
            from: 'Mint',
            toAddresses: [creator],
            balances: [
              {
                amount: mintTotal.toString(),
                tokenIds: [{ start: '1', end: '1' }],
                ownershipTimes: [{ start: '1', end: MAX_UINT64 }]
              }
            ],
            prioritizedApprovals: [
              {
                approvalId: tier.approvalId,
                approvalLevel: 'collection',
                approverAddress: '',
                version: '0'
              }
            ],
            onlyCheckPrioritizedCollectionApprovals: true,
            onlyCheckPrioritizedOutgoingApprovals: false,
            onlyCheckPrioritizedIncomingApprovals: false,
            memo: ''
          }
        ]
      }
    };
  }

  // Legacy per-tier: precalculate from approval (1 unit per msg).
  return {
    typeUrl: '/tokenization.MsgTransferTokens',
    value: {
      creator,
      collectionId: String(collectionId),
      transfers: [
        {
          from: 'Mint',
          toAddresses: [creator],
          balances: [],
          precalculateBalancesFromApproval: {
            approvalId: tier.approvalId,
            approvalLevel: 'collection',
            approverAddress: '',
            version: '0',
            precalculationOptions: { overrideTimestamp: '0', tokenIdsOverride: [] }
          },
          prioritizedApprovals: [
            {
              approvalId: tier.approvalId,
              approvalLevel: 'collection',
              approverAddress: '',
              version: '0'
            }
          ],
          onlyCheckPrioritizedCollectionApprovals: true,
          onlyCheckPrioritizedOutgoingApprovals: false,
          onlyCheckPrioritizedIncomingApprovals: false,
          memo: ''
        }
      ]
    }
  };
}
