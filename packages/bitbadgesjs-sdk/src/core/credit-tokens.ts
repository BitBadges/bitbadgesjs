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

/**
 * Per-network collection ID for **BitBadges' own** API-credits token
 * (the "APITOKEN" collection that meters the BitBadges AI Builder and
 * the main API-key middleware; 1 USDC = 100,000 APITOKEN).
 *
 * This is NOT "the" credit token — the Credit Token standard is generic
 * and anyone can deploy their own collection. This constant is purely a
 * convenience so callers topping up *BitBadges'* API don't have to look
 * the id up. Mirrors `API_CREDITS_COLLECTION_ID` in the FE constants.
 * `testnet: null` — the APITOKEN collection is not deployed on testnet.
 */
export const BITBADGES_API_CREDITS_COLLECTION_IDS: Record<'mainnet' | 'testnet' | 'local', string | null> = {
  mainnet: '84',
  testnet: null,
  local: '23'
};

export function bitbadgesApiCreditsCollectionId(network: 'mainnet' | 'testnet' | 'local'): string {
  const id = BITBADGES_API_CREDITS_COLLECTION_IDS[network];
  if (!id) {
    throw new Error(
      `BitBadges' API-credits collection is not deployed on ${network}. ` +
      `It exists on mainnet and local only. (Any Credit Token collection works with ` +
      `\`credit-tokens purchase <collection-id>\` — this shortcut is just for BitBadges' own API.)`
    );
  }
  return id;
}

export interface CreditTokenTier {
  /** Approval id — `credit-scaled` or `credit-<N>`. */
  approvalId: string;
  version?: bigint;
  /** Legacy tier label (N for `credit-<N>`); not an asset display quantity. */
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
  /** For scaled tier: positive per-transaction multiplier cap. */
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
 * Extract fixed token-1 credit mint terms supported by the exact purchase helpers.
 * Discovery of a standard tag is separate from support for its custom approvals.
 */
export function extractCreditTokenTiers(
  approvals: ReadonlyArray<iCollectionApproval<bigint>>
): CreditTokenTier[] {
  const tiers: CreditTokenTier[] = [];

  for (const approval of approvals) {
    if (!approval.approvalId?.startsWith('credit-')) continue;

    const transfers = approval.approvalCriteria?.coinTransfers ?? [];
    if (transfers.length !== 1 || transfers[0].coins.length !== 1 || transfers[0].overrideToWithInitiator || transfers[0].overrideFromWithApproverAddress) continue;
    const coinTransfer = transfers[0];
    if (!coinTransfer) continue;
    const paymentDenom = coinTransfer.coins[0]?.denom ?? '';
    const paymentAmount = BigInt(coinTransfer.coins[0]?.amount ?? '0');
    const recipient = coinTransfer.to ?? '';

    const predetermined = approval.approvalCriteria?.predeterminedBalances;
    const incremented = predetermined?.incrementedBalances;
    const startBalance = incremented?.startBalances?.[0];
    if (approval.fromListId !== 'Mint' || predetermined?.manualBalances?.length || incremented?.startBalances?.length !== 1 ||
      startBalance?.tokenIds?.length !== 1 || BigInt(startBalance.tokenIds[0].start) !== 1n || BigInt(startBalance.tokenIds[0].end) !== 1n ||
      startBalance?.ownershipTimes?.length !== 1 || BigInt(startBalance.ownershipTimes[0].start) !== 1n || BigInt(startBalance.ownershipTimes[0].end) !== BigInt(MAX_UINT64) ||
      BigInt(incremented.incrementTokenIdsBy ?? 0) !== 0n || BigInt(incremented.incrementOwnershipTimesBy ?? 0) !== 0n ||
      BigInt(incremented.durationFromTimestamp ?? 0) !== 0n || BigInt(incremented.recurringOwnershipTimes?.intervalLength ?? 0) !== 0n ||
      incremented.allowOverrideTimestamp || incremented.allowOverrideWithAnyValidToken) continue;
    const mintAmount = BigInt(startBalance?.amount ?? '0');

    const allowAmountScaling =
      approval.approvalCriteria?.predeterminedBalances?.incrementedBalances?.allowAmountScaling ?? false;

    if (allowAmountScaling) {
      const maxMultiplier = BigInt(
        approval.approvalCriteria?.predeterminedBalances?.incrementedBalances?.maxScalingMultiplier ?? '0'
      );
      if (maxMultiplier <= 0n) continue;
      tiers.push({
        approvalId: approval.approvalId,
        version: BigInt(approval.version ?? 0),
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
    if (!Number.isSafeInteger(value) || value <= 0) continue;
    tiers.push({
      approvalId: approval.approvalId,
      version: BigInt(approval.version ?? 0),
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

export type CreditPurchaseDecimals = { paymentDecimals?: number; creditDecimals?: number };

function creditDisplayAmount(amount: bigint, decimals?: number): string | null {
  if (decimals === undefined) return null;
  if (!Number.isInteger(decimals) || decimals < 0 || decimals > 255) throw new Error('Invalid asset decimals.');
  if (decimals === 0) return amount.toString();
  const digits = amount.toString().padStart(decimals + 1, '0');
  const fraction = digits.slice(-decimals).replace(/0+$/, '');
  return digits.slice(0, -decimals) + (fraction ? `.${fraction}` : '');
}

/** Exact terms quote; balances, eligibility, network fees and external consumption are not inferred. */
export function quoteCreditTokenPurchase(tier: CreditTokenTier, units: bigint, decimals: CreditPurchaseDecimals = {}) {
  if (units <= 0n) throw new Error('Purchase multiplier must be a positive integer.');
  if (tier.paymentAmount <= 0n || tier.mintAmount <= 0n || !tier.paymentDenom || !tier.recipient) {
    throw new Error('Credit tier must have a positive payment, positive mint amount, denomination and recipient.');
  }
  if (!tier.isScaled && units !== 1n) throw new Error('Legacy credit tiers support exactly one pack per transaction.');
  if (tier.isScaled && (!tier.maxMultiplier || tier.maxMultiplier <= 0n)) throw new Error('Scaled credit tiers require a positive maximum multiplier.');
  if (tier.isScaled && tier.maxMultiplier && tier.maxMultiplier > 0n && units > tier.maxMultiplier) {
    throw new Error(`Requested multiplier ${units} exceeds the maximum ${tier.maxMultiplier}. Choose a smaller quantity explicitly.`);
  }
  const payment = tier.paymentAmount * units;
  const minted = tier.mintAmount * units;
  return {
    approvalId: tier.approvalId,
    requestedMultiplier: units,
    actualMultiplier: units,
    maximumMultiplier: tier.isScaled ? (tier.maxMultiplier && tier.maxMultiplier > 0n ? tier.maxMultiplier : null) : 1n,
    limitingRule: tier.isScaled ? 'maxScalingMultiplier' : 'oneLegacyPack',
    payment: { denom: tier.paymentDenom, recipient: tier.recipient, baseAmount: payment, decimals: decimals.paymentDecimals ?? null, displayAmount: creditDisplayAmount(payment, decimals.paymentDecimals) },
    minted: { tokenId: '1', baseAmount: minted, decimals: decimals.creditDecimals ?? null, displayAmount: creditDisplayAmount(minted, decimals.creditDecimals) },
    ratio: { paymentBaseAmount: tier.paymentAmount, mintedBaseAmount: tier.mintAmount },
    remainingCredits: null,
    consumptionTracking: 'external-ledger',
    feesIncluded: false,
    eligibility: 'not-checked'
  };
}

/**
 * Build the MsgTransferTokens for purchasing N credit-token units from a
 * scaled tier. The chain handles the rate math via the approval's
 * `scalingBalances` — we just set the balances to
 * `mintAmount × multiplier` and prioritize the approval.
 *
 * For legacy (per-tier) approvals, pass `tier.isScaled === false` and we
 * fall back to the precalculate-from-approval flow (exactly one pack).
 */
export function buildPurchaseCreditTokenMsg(
  creator: string,
  collectionId: string,
  tier: CreditTokenTier,
  units: bigint
): PurchaseCreditTokenMsg {
  const quote = quoteCreditTokenPurchase(tier, units);

  if (tier.isScaled) {
    const mintTotal = quote.minted.baseAmount;
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
                version: (tier.version ?? 0n).toString()
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
            version: (tier.version ?? 0n).toString(),
            precalculationOptions: { overrideTimestamp: '0', tokenIdsOverride: [] }
          },
          prioritizedApprovals: [
            {
              approvalId: tier.approvalId,
              approvalLevel: 'collection',
              approverAddress: '',
              version: (tier.version ?? 0n).toString()
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
