import { iCollectionDoc } from '@/api-indexer/docs-types/interfaces.js';
import { GO_MAX_UINT_64 } from '@/common/math.js';
import type { iCollectionApproval } from '@/interfaces/types/approvals.js';
import { UintRangeArray } from './uintRanges.js';

export interface AuctionValidationResult {
  valid: boolean;
  errors: string[];
  warnings: string[];
}

export const validateAuctionCollection = (collection: Readonly<iCollectionDoc<bigint>>): AuctionValidationResult => {
  const errors: string[] = [];
  const warnings: string[] = [];

  // 1. Standard includes "Auction"
  if (!collection.standards?.includes('Auction')) errors.push('Missing "Auction" standard');

  // 2. validTokenIds = exactly [{1,1}]
  // BigInt-coerce — indexer's HTTP responses ship uint64 as strings.
  const vt = collection.validTokenIds;
  if (!vt || vt.length !== 1 || BigInt(vt[0].start) !== 1n || BigInt(vt[0].end) !== 1n) {
    errors.push('validTokenIds must be exactly [{start: 1, end: 1}]');
  }

  // 3. 0-2 approvals (mint-to-winner + optional burn). The mint-to-winner
  // approval uses autoDeletionOptions.afterOneUse, so once the auction
  // settles it is removed from the collection — a valid post-settlement
  // state with 0-1 remaining approvals.
  const approvals = collection.collectionApprovals;
  if (approvals.length > 2) {
    errors.push(`Expected 0-2 approvals, found ${approvals.length}`);
  }

  // 4. Find mint-to-winner approval. Absence is a valid post-settlement
  // state (auto-deleted after one use) — skip mint-specific checks rather
  // than flag a structural error.
  const mintApproval = approvals.find((a) => a.fromListId === 'Mint');
  if (!mintApproval) {
    return { valid: errors.length === 0, errors, warnings };
  }

  const ac = mintApproval.approvalCriteria;

  // 5. maxNumTransfers = 1
  if (!ac?.maxNumTransfers || BigInt(ac.maxNumTransfers.overallMaxNumTransfers) !== 1n) {
    errors.push('Mint-to-winner overallMaxNumTransfers must be 1');
  }

  // 6. overridesFromOutgoingApprovals
  if (!ac?.overridesFromOutgoingApprovals) {
    errors.push('Mint-to-winner must have overridesFromOutgoingApprovals=true');
  }

  // 7. initiatedByListId != 'All' (restricted seller)
  if (mintApproval.initiatedByListId === 'All') {
    errors.push('Mint-to-winner initiatedByListId must restrict to seller (not "All")');
  }

  // 8. transferTimes must be bounded (not GO_MAX_UINT_64)
  const tt = mintApproval.transferTimes;
  if (tt && tt.length > 0) {
    const end = tt[0].end;
    if (end >= GO_MAX_UINT_64) {
      errors.push('Mint-to-winner transferTimes must have a bounded end date (not max uint64)');
    }
  }

  return { valid: errors.length === 0, errors, warnings };
};

export const doesCollectionFollowAuctionProtocol = (collection: Readonly<iCollectionDoc<bigint>>): boolean => {
  return validateAuctionCollection(collection).valid;
};

// ── End-user helpers (lifted from FE AuctionView + AuctionBidsTab) ────────

export type AuctionStatus = 'live' | 'pending-settlement' | 'settled';

export interface AuctionDetails {
  mintApproval: iCollectionApproval<bigint>;
  sellerAddress: string;
  acceptDeadline: bigint;
}

/** Extract auction shape. Returns null when the mint-to-winner approval is missing (post-settlement state). */
export function extractAuctionDetails(
  approvals: ReadonlyArray<iCollectionApproval<bigint>>
): AuctionDetails | null {
  const mintApproval = approvals.find((a) => a.fromListId === 'Mint');
  if (!mintApproval) return null;
  return {
    mintApproval,
    sellerAddress: mintApproval.initiatedByListId ?? '',
    acceptDeadline: BigInt(mintApproval.transferTimes?.[0]?.end ?? 0)
  };
}

export function deriveAuctionStatus(approvals: ReadonlyArray<iCollectionApproval<bigint>>, acceptDeadline: bigint): AuctionStatus {
  // If the mint-to-winner approval auto-deleted (afterOneUse), the auction settled.
  if (!approvals.find((a) => a.fromListId === 'Mint')) return 'settled';
  const now = BigInt(Date.now());
  if (now > acceptDeadline && acceptDeadline > 0n) return 'pending-settlement';
  return 'live';
}

// ── Bid intent factory ───────────────────────────────────────────────────
//
// Bids are buyer-side INCOMING approvals declaring "I want to receive
// 1 of token-X and pay <amount> <denom> for it". The seller's accept-bid
// flow fills them. Lifted from the FE's
// `UserOutgoingApprovalRegistry.predictionMarketBuyIntent` — same shape,
// applies to auctions and prediction markets alike.

export interface AuctionBidArgs {
  /** Bidder address (will be the `to` on the approval). */
  bidderAddress: string;
  /** Token id the bidder wants to receive. Most auctions use 1. */
  tokenId: bigint;
  /** Number of tokens (almost always 1 for auctions). */
  tokenAmount: bigint;
  /** Denom of payment (e.g. 'uusdc', 'ubadge'). */
  paymentDenom: string;
  /** Amount of payment in base units. */
  paymentAmount: bigint;
  /** Validity window for the bid — typically [1, acceptDeadline]. */
  transferTimes: UintRangeArray<bigint>;
  /** Approval id — caller picks. */
  approvalId: string;
}

/**
 * Build the buyer-side incoming-approval (a "bid"). Use with
 * `MsgSetIncomingApproval` to post the bid on-chain. Proto-shape only —
 * no FE-only `fromList`/`toList`/`details` enrichment.
 */
export function buildAuctionBidApproval(args: AuctionBidArgs): Record<string, unknown> {
  const { bidderAddress, tokenId, tokenAmount, paymentDenom, paymentAmount, transferTimes, approvalId } = args;
  const tokenIds = [{ start: tokenId, end: tokenId }];
  return {
    fromListId: 'All',
    initiatedByListId: 'All',
    transferTimes,
    tokenIds,
    ownershipTimes: UintRangeArray.FullRanges(),
    approvalId,
    version: 0n,
    approvalCriteria: {
      autoDeletionOptions: {
        afterOneUse: true,
        afterOverallMaxNumTransfers: true,
        allowCounterpartyPurge: false,
        allowPurgeIfExpired: true
      },
      coinTransfers: [
        {
          to: '',
          overrideFromWithApproverAddress: true,
          overrideToWithInitiator: true,
          coins: [{ amount: paymentAmount, denom: paymentDenom }]
        }
      ],
      predeterminedBalances: {
        manualBalances: [],
        orderCalculationMethod: {
          useOverallNumTransfers: true,
          usePerToAddressNumTransfers: false,
          usePerFromAddressNumTransfers: false,
          usePerInitiatedByAddressNumTransfers: false,
          useMerkleChallengeLeafIndex: false,
          challengeTrackerId: ''
        },
        incrementedBalances: {
          startBalances: [{ amount: tokenAmount, tokenIds, ownershipTimes: UintRangeArray.FullRanges() }],
          incrementTokenIdsBy: 0n,
          incrementOwnershipTimesBy: 0n,
          durationFromTimestamp: 0n,
          allowOverrideTimestamp: false,
          allowOverrideWithAnyValidToken: false,
          allowAmountScaling: false,
          maxScalingMultiplier: 0n,
          recurringOwnershipTimes: { startTime: 0n, intervalLength: 0n, chargePeriodLength: 0n }
        }
      },
      maxNumTransfers: {
        overallMaxNumTransfers: 1n,
        perToAddressMaxNumTransfers: 0n,
        perFromAddressMaxNumTransfers: 0n,
        perInitiatedByAddressMaxNumTransfers: 0n,
        amountTrackerId: approvalId,
        resetTimeIntervals: { startTime: 0n, intervalLength: 0n }
      },
      approvalAmounts: {
        overallApprovalAmount: 0n,
        perFromAddressApprovalAmount: 0n,
        perToAddressApprovalAmount: 0n,
        perInitiatedByAddressApprovalAmount: 0n,
        amountTrackerId: approvalId,
        resetTimeIntervals: { startTime: 0n, intervalLength: 0n }
      },
      merkleChallenges: [],
      mustOwnTokens: [],
      dynamicStoreChallenges: [],
      ethSignatureChallenges: [],
      votingChallenges: [],
      evmQueryChallenges: [],
      requireFromEqualsInitiatedBy: false
    }
  };
}

// ── Accept-bid msg builder ───────────────────────────────────────────────
//
// Accepting a bid is a single MsgTransferTokens that prioritizes BOTH
// the bid's incoming approval (so the bidder's coinTransfer fires and
// debits their wallet) AND the auction's mint-to-winner collection
// approval (so the prize is minted).

const AUCTION_MAX_UINT64 = '18446744073709551615';
void GO_MAX_UINT_64;

export interface AcceptAuctionBidMsg {
  typeUrl: '/tokenization.MsgTransferTokens';
  value: Record<string, unknown>;
}

export function buildAcceptAuctionBidMsg(
  seller: string,
  collectionId: string,
  bidApprovalId: string,
  bidderAddress: string,
  mintApprovalId: string,
  tokenAmount: bigint = 1n
): AcceptAuctionBidMsg {
  return {
    typeUrl: '/tokenization.MsgTransferTokens',
    value: {
      creator: seller,
      collectionId: String(collectionId),
      transfers: [
        {
          from: 'Mint',
          toAddresses: [bidderAddress],
          balances: [
            {
              amount: tokenAmount.toString(),
              tokenIds: [{ start: '1', end: '1' }],
              ownershipTimes: [{ start: '1', end: AUCTION_MAX_UINT64 }]
            }
          ],
          prioritizedApprovals: [
            {
              approvalId: mintApprovalId,
              approvalLevel: 'collection',
              approverAddress: '',
              version: '0'
            },
            {
              approvalId: bidApprovalId,
              approvalLevel: 'incoming',
              approverAddress: bidderAddress,
              version: '0'
            }
          ],
          onlyCheckPrioritizedCollectionApprovals: true,
          onlyCheckPrioritizedOutgoingApprovals: false,
          onlyCheckPrioritizedIncomingApprovals: true,
          memo: ''
        }
      ]
    }
  };
}
